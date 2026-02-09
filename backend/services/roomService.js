import { db } from '../config/firebase.js';
import { customAlphabet } from 'nanoid';

// Generate room codes in format TMB-XXXX (alphanumeric)
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 4);

class RoomService {
  constructor() {
    this.roomsCollection = db.collection('rooms');
  }

  /**
   * Generate a unique room code in format TMB-XXXX
   * @returns {Promise<string>} Unique room code
   */
  async generateRoomCode() {
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = `TMB-${nanoid()}`;
      
      // Check if code already exists in active rooms
      const existingRoom = await this.roomsCollection
        .where('roomCode', '==', code)
        .where('status', 'in', ['waiting', 'active', 'paused'])
        .limit(1)
        .get();
      
      isUnique = existingRoom.empty;
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique room code');
    }

    return code;
  }

  /**
   * Validate display name
   * @param {string} name - Display name to validate
   * @returns {boolean} True if valid
   */
  validateDisplayName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const trimmedName = name.trim();
    
    // Check length (2-30 characters)
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      return false;
    }

    // Check alphanumeric (allow spaces)
    const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
    return alphanumericRegex.test(trimmedName);
  }

  /**
   * Create a new room
   * @param {string} hostName - Host display name
   * @param {string} hostId - Host user ID
   * @returns {Promise<Object>} Room data
   */
  async createRoom(hostName, hostId) {
    try {
      console.log('[RoomService] Starting createRoom for:', hostName);
      
      // Validate host name
      if (!this.validateDisplayName(hostName)) {
        throw new Error('Invalid host name. Must be 2-30 alphanumeric characters.');
      }
      console.log('[RoomService] Host name validated');

      console.log('[RoomService] Generating room code...');
      const roomCode = await this.generateRoomCode();
      console.log('[RoomService] Room code generated:', roomCode);
      
      const now = Date.now(); // Use timestamp

      const roomData = {
        roomCode,
        hostId,
        hostName: hostName.trim(),
        status: 'waiting',
        createdAt: now,
        startedAt: null,
        prizes: [],
        prizesLocked: false,
        calledNumbers: [],
        currentNumber: null,
        participants: [],
        maxParticipants: 50,
      };

      console.log('[RoomService] Saving room data to database...');
      await this.roomsCollection.doc(roomCode).set(roomData);
      console.log('[RoomService] Room data saved successfully');

      return roomData;
    } catch (error) {
      console.error('[RoomService] Error in createRoom:', error);
      console.error('[RoomService] Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get room by code (case-insensitive)
   * @param {string} roomCode - Room code
   * @returns {Promise<Object|null>} Room data or null
   */
  async getRoomByCode(roomCode) {
    if (!roomCode) {
      return null;
    }

    // Normalize to uppercase for case-insensitive lookup
    const normalizedCode = roomCode.toUpperCase();

    const snapshot = await this.roomsCollection
      .where('roomCode', '==', normalizedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }

  /**
   * Join a room
   * @param {string} roomCode - Room code
   * @param {string} participantName - Participant display name
   * @param {string} participantId - Participant user ID
   * @returns {Promise<Object>} Join result
   */
  async joinRoom(roomCode, participantName, participantId) {
    // Validate participant name
    if (!this.validateDisplayName(participantName)) {
      throw new Error('Invalid participant name. Must be 2-30 alphanumeric characters.');
    }

    const normalizedCode = roomCode.toUpperCase();
    const roomRef = this.roomsCollection.doc(normalizedCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();

    // Check if game has started
    if (room.status !== 'waiting') {
      throw new Error('Game has already started');
    }

    // Ensure participants array exists
    const participants = room.participants || [];

    // Check if room is full
    if (participants.length >= room.maxParticipants) {
      throw new Error('Room is full');
    }

    // Check if participant already joined
    const alreadyJoined = participants.some(p => p.userId === participantId);
    if (alreadyJoined) {
      return { success: true, message: 'Already in room', room };
    }

    // Add participant
    const participant = {
      userId: participantId,
      userName: participantName.trim(),
      ticketId: null, // Will be set when ticket is generated
      connected: true,
      joinedAt: Date.now(), // Use timestamp
    };

    await roomRef.update({
      participants: [...participants, participant],
    });

    return { success: true, message: 'Joined room', room: { ...room, participants: [...participants, participant] } };
  }

  /**
   * Start the game
   * @param {string} roomCode - Room code
   * @returns {Promise<void>}
   */
  async startGame(roomCode) {
    const normalizedCode = roomCode.toUpperCase();
    const roomRef = this.roomsCollection.doc(normalizedCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();

    if (room.status !== 'waiting') {
      throw new Error('Game already started or completed');
    }

    await roomRef.update({
      status: 'active',
      startedAt: Date.now(), // Use timestamp
      prizesLocked: true,
    });
  }

  /**
   * Pause the game (host disconnect)
   * @param {string} roomCode - Room code
   * @returns {Promise<void>}
   */
  async pauseGame(roomCode) {
    const normalizedCode = roomCode.toUpperCase();
    const roomRef = this.roomsCollection.doc(normalizedCode);

    await roomRef.update({
      status: 'paused',
    });
  }

  /**
   * Resume the game (host reconnect)
   * @param {string} roomCode - Room code
   * @returns {Promise<void>}
   */
  async resumeGame(roomCode) {
    const normalizedCode = roomCode.toUpperCase();
    const roomRef = this.roomsCollection.doc(normalizedCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();

    if (room.status === 'paused') {
      await roomRef.update({
        status: 'active',
      });
    }
  }

  /**
   * Update participant connection status
   * @param {string} roomCode - Room code
   * @param {string} userId - User ID
   * @param {boolean} connected - Connection status
   * @returns {Promise<void>}
   */
  async updateParticipantConnection(roomCode, userId, connected) {
    const normalizedCode = roomCode.toUpperCase();
    const roomRef = this.roomsCollection.doc(normalizedCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return;
    }

    const room = roomDoc.data();
    const participants = room.participants || [];
    const updatedParticipants = participants.map(p => 
      p.userId === userId ? { ...p, connected } : p
    );

    await roomRef.update({
      participants: updatedParticipants,
    });
  }

  /**
   * Get room state
   * @param {string} roomCode - Room code
   * @returns {Promise<Object>} Room state
   */
  async getRoomState(roomCode) {
    const room = await this.getRoomByCode(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    return room;
  }
}

export default new RoomService();
