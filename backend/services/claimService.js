import { db } from '../config/firebase.js';
import { nanoid } from 'nanoid';
import prizeService from './prizeService.js';
import ticketService from './ticketService.js';
import gameStateService from './gameStateService.js';

class ClaimService {
  constructor() {
    this.claimsCollection = db.collection('claims');
    this.roomsCollection = db.collection('rooms');
  }

  /**
   * Submit a claim
   * @param {string} roomCode - Room code
   * @param {string} userId - User ID
   * @param {string} userName - User display name
   * @param {string} ticketId - Ticket ID
   * @param {string} prizeType - Prize type being claimed
   * @returns {Promise<Object>} Claim result
   */
  async submitClaim(roomCode, userId, userName, ticketId, prizeType) {
    // Validate prize type
    if (!prizeService.validatePrizeType(prizeType)) {
      throw new Error('Invalid prize type');
    }

    // Check if prize is still available
    const isAvailable = await prizeService.isPrizeAvailable(roomCode, prizeType);
    if (!isAvailable) {
      throw new Error('Prize is no longer available');
    }

    // Get ticket and validate claim
    const ticket = await ticketService.getTicket(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const calledNumbers = await gameStateService.getCalledNumbers(roomCode);
    const isValid = prizeService.validateClaim(ticket, calledNumbers, prizeType);

    if (!isValid) {
      throw new Error('Invalid claim - winning condition not met');
    }

    // Create claim
    const claimId = nanoid();
    const claimData = {
      claimId,
      roomCode,
      userId,
      userName,
      ticketId,
      prizeType,
      status: 'pending',
      submittedAt: Date.now(), // Use timestamp
      verifiedAt: null,
      verifiedBy: null,
      ticket: ticket.grid, // Snapshot of ticket
    };

    await this.claimsCollection.doc(claimId).set(claimData);

    return {
      success: true,
      claimId,
      claim: claimData,
    };
  }

  /**
   * Get claim by ID
   * @param {string} claimId - Claim ID
   * @returns {Promise<Object|null>} Claim data
   */
  async getClaim(claimId) {
    const doc = await this.claimsCollection.doc(claimId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  }

  /**
   * Get all pending claims for a room
   * @param {string} roomCode - Room code
   * @returns {Promise<Array>} Array of pending claims
   */
  async getPendingClaims(roomCode) {
    const snapshot = await this.claimsCollection
      .where('roomCode', '==', roomCode)
      .where('status', '==', 'pending')
      .orderBy('submittedAt', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Get claim queue (all pending claims ordered by timestamp)
   * @param {string} roomCode - Room code
   * @returns {Promise<Array>} Array of claims in queue
   */
  async getClaimQueue(roomCode) {
    return this.getPendingClaims(roomCode);
  }

  /**
   * Approve a claim
   * @param {string} claimId - Claim ID
   * @param {string} hostId - Host user ID
   * @returns {Promise<Object>} Approval result
   */
  async approveClaim(claimId, hostId) {
    const claimRef = this.claimsCollection.doc(claimId);
    const claimDoc = await claimRef.get();

    if (!claimDoc.exists) {
      throw new Error('Claim not found');
    }

    const claim = claimDoc.data();

    if (claim.status !== 'pending') {
      throw new Error('Claim has already been processed');
    }

    // Check if prize is still available
    const isAvailable = await prizeService.isPrizeAvailable(
      claim.roomCode,
      claim.prizeType
    );

    if (!isAvailable) {
      // Prize exhausted, reject this claim
      await this.rejectClaim(claimId, hostId);
      throw new Error('Prize is no longer available');
    }

    // Update claim status
    await claimRef.update({
      status: 'approved',
      verifiedAt: Date.now(), // Use timestamp
      verifiedBy: hostId,
    });

    // Decrement prize frequency
    await prizeService.decrementPrizeFrequency(claim.roomCode, claim.prizeType);

    // Check if prize is now exhausted and reject pending claims
    const stillAvailable = await prizeService.isPrizeAvailable(
      claim.roomCode,
      claim.prizeType
    );

    if (!stillAvailable) {
      await this.rejectPendingClaimsForPrize(claim.roomCode, claim.prizeType);
    }

    return {
      success: true,
      claim: {
        ...claim,
        status: 'approved',
        verifiedAt: Date.now(), // Use timestamp
        verifiedBy: hostId,
      },
    };
  }

  /**
   * Reject a claim
   * @param {string} claimId - Claim ID
   * @param {string} hostId - Host user ID
   * @returns {Promise<Object>} Rejection result
   */
  async rejectClaim(claimId, hostId) {
    const claimRef = this.claimsCollection.doc(claimId);
    const claimDoc = await claimRef.get();

    if (!claimDoc.exists) {
      throw new Error('Claim not found');
    }

    const claim = claimDoc.data();

    if (claim.status !== 'pending') {
      throw new Error('Claim has already been processed');
    }

    // Update claim status
    await claimRef.update({
      status: 'rejected',
      verifiedAt: Date.now(), // Use timestamp
      verifiedBy: hostId,
    });

    return {
      success: true,
      claim: {
        ...claim,
        status: 'rejected',
        verifiedAt: Date.now(), // Use timestamp
        verifiedBy: hostId,
      },
    };
  }

  /**
   * Reject all pending claims for a specific prize
   * @param {string} roomCode - Room code
   * @param {string} prizeType - Prize type
   * @returns {Promise<void>}
   */
  async rejectPendingClaimsForPrize(roomCode, prizeType) {
    const pendingClaims = await this.claimsCollection
      .where('roomCode', '==', roomCode)
      .where('prizeType', '==', prizeType)
      .where('status', '==', 'pending')
      .get();

    const rejectPromises = pendingClaims.docs.map(doc =>
      doc.ref.update({
        status: 'rejected',
        verifiedAt: Date.now(), // Use timestamp
        verifiedBy: 'system',
      })
    );

    await Promise.all(rejectPromises);
  }

  /**
   * Get all claims for a room
   * @param {string} roomCode - Room code
   * @returns {Promise<Array>} Array of all claims
   */
  async getRoomClaims(roomCode) {
    const snapshot = await this.claimsCollection
      .where('roomCode', '==', roomCode)
      .orderBy('submittedAt', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Get approved claims (winners) for a room
   * @param {string} roomCode - Room code
   * @returns {Promise<Array>} Array of approved claims
   */
  async getWinners(roomCode) {
    const snapshot = await this.claimsCollection
      .where('roomCode', '==', roomCode)
      .where('status', '==', 'approved')
      .orderBy('verifiedAt', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Get user's claims for a room
   * @param {string} roomCode - Room code
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user's claims
   */
  async getUserClaims(roomCode, userId) {
    const snapshot = await this.claimsCollection
      .where('roomCode', '==', roomCode)
      .where('userId', '==', userId)
      .orderBy('submittedAt', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data());
  }
}

export default new ClaimService();
