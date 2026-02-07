import { db } from '../config/firebase.js';

const VALID_PRIZE_TYPES = [
  'early_five',
  'top_row',
  'middle_row',
  'bottom_row',
  'full_house',
];

class PrizeService {
  constructor() {
    this.roomsCollection = db.collection('rooms');
  }

  /**
   * Validate prize type
   * @param {string} prizeType - Prize type to validate
   * @returns {boolean} True if valid
   */
  validatePrizeType(prizeType) {
    return VALID_PRIZE_TYPES.includes(prizeType);
  }

  /**
   * Validate prize frequency
   * @param {number} frequency - Frequency to validate
   * @returns {boolean} True if valid
   */
  validateFrequency(frequency) {
    return (
      typeof frequency === 'number' &&
      Number.isInteger(frequency) &&
      frequency > 0
    );
  }

  /**
   * Configure prizes for a room
   * @param {string} roomCode - Room code
   * @param {Array} prizes - Array of prize configurations
   * @returns {Promise<void>}
   */
  async configurePrizes(roomCode, prizes) {
    const roomRef = this.roomsCollection.doc(roomCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();

    // Check if prizes are locked (game started)
    if (room.prizesLocked) {
      throw new Error('Cannot modify prizes after game has started');
    }

    // Validate all prizes
    for (const prize of prizes) {
      if (!this.validatePrizeType(prize.type)) {
        throw new Error(`Invalid prize type: ${prize.type}`);
      }

      if (!this.validateFrequency(prize.maxWinners)) {
        throw new Error(`Invalid frequency for ${prize.type}: must be a positive integer`);
      }
    }

    // Create prize configurations
    const prizeConfigs = prizes.map(prize => ({
      type: prize.type,
      maxWinners: prize.maxWinners,
      currentWinners: 0,
      available: true,
    }));

    await roomRef.update({
      prizes: prizeConfigs,
    });
  }

  /**
   * Get prize availability for a room
   * @param {string} roomCode - Room code
   * @returns {Promise<Array>} Array of prize availability
   */
  async getPrizeAvailability(roomCode) {
    const roomRef = this.roomsCollection.doc(roomCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();
    return room.prizes || [];
  }

  /**
   * Check if a specific prize is available
   * @param {string} roomCode - Room code
   * @param {string} prizeType - Prize type
   * @returns {Promise<boolean>} True if available
   */
  async isPrizeAvailable(roomCode, prizeType) {
    const prizes = await this.getPrizeAvailability(roomCode);
    const prize = prizes.find(p => p.type === prizeType);

    if (!prize) {
      return false;
    }

    return prize.currentWinners < prize.maxWinners;
  }

  /**
   * Decrement prize frequency (when claim approved)
   * @param {string} roomCode - Room code
   * @param {string} prizeType - Prize type
   * @returns {Promise<void>}
   */
  async decrementPrizeFrequency(roomCode, prizeType) {
    const roomRef = this.roomsCollection.doc(roomCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();
    const prizes = room.prizes || [];

    const updatedPrizes = prizes.map(prize => {
      if (prize.type === prizeType) {
        const newCurrentWinners = prize.currentWinners + 1;
        return {
          ...prize,
          currentWinners: newCurrentWinners,
          available: newCurrentWinners < prize.maxWinners,
        };
      }
      return prize;
    });

    await roomRef.update({
      prizes: updatedPrizes,
    });
  }

  /**
   * Lock prize configuration (called when game starts)
   * @param {string} roomCode - Room code
   * @returns {Promise<void>}
   */
  async lockPrizeConfiguration(roomCode) {
    const roomRef = this.roomsCollection.doc(roomCode);

    await roomRef.update({
      prizesLocked: true,
    });
  }

  /**
   * Get prize display name
   * @param {string} prizeType - Prize type
   * @returns {string} Display name
   */
  getPrizeDisplayName(prizeType) {
    const displayNames = {
      early_five: 'Early Five',
      top_row: 'Top Row',
      middle_row: 'Middle Row',
      bottom_row: 'Bottom Row',
      full_house: 'Full House',
    };

    return displayNames[prizeType] || prizeType;
  }

  /**
   * Validate a claim against ticket
   * @param {Object} ticket - Ticket data
   * @param {Array} calledNumbers - Array of called numbers
   * @param {string} prizeType - Prize type being claimed
   * @returns {boolean} True if claim is valid
   */
  validateClaim(ticket, calledNumbers, prizeType) {
    const { grid } = ticket;
    const calledSet = new Set(calledNumbers);

    switch (prizeType) {
      case 'early_five': {
        // First 5 numbers on ticket that were called
        const ticketNumbers = [];
        for (const row of grid) {
          for (const num of row) {
            if (num !== null) {
              ticketNumbers.push(num);
            }
          }
        }

        let markedCount = 0;
        for (const num of ticketNumbers) {
          if (calledSet.has(num)) {
            markedCount++;
          }
        }

        return markedCount >= 5;
      }

      case 'top_row': {
        // All numbers in row 0
        const rowNumbers = grid[0].filter(n => n !== null);
        return rowNumbers.every(num => calledSet.has(num));
      }

      case 'middle_row': {
        // All numbers in row 1
        const rowNumbers = grid[1].filter(n => n !== null);
        return rowNumbers.every(num => calledSet.has(num));
      }

      case 'bottom_row': {
        // All numbers in row 2
        const rowNumbers = grid[2].filter(n => n !== null);
        return rowNumbers.every(num => calledSet.has(num));
      }

      case 'full_house': {
        // All 15 numbers on ticket
        const allNumbers = [];
        for (const row of grid) {
          for (const num of row) {
            if (num !== null) {
              allNumbers.push(num);
            }
          }
        }
        return allNumbers.every(num => calledSet.has(num));
      }

      default:
        return false;
    }
  }
}

export default new PrizeService();
