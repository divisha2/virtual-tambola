import { db } from '../config/firebase.js';
import ticketService from './ticketService.js';

class GameStateService {
  constructor() {
    this.roomsCollection = db.collection('rooms');
  }

  /**
   * Call the next number in the game
   * @param {string} roomCode - Room code
   * @returns {Promise<number>} The called number
   */
  async callNextNumber(roomCode) {
    const roomRef = this.roomsCollection.doc(roomCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();

    // Check if game is active
    if (room.status !== 'active') {
      throw new Error('Game is not active');
    }

    // Get remaining numbers (1-90 minus already called)
    // Ensure calledNumbers is an array (Firebase may convert to object)
    let calledNumbers = room.calledNumbers || [];
    if (!Array.isArray(calledNumbers)) {
      calledNumbers = Object.values(calledNumbers);
    }
    
    const remainingNumbers = [];

    for (let i = 1; i <= 90; i++) {
      if (!calledNumbers.includes(i)) {
        remainingNumbers.push(i);
      }
    }

    if (remainingNumbers.length === 0) {
      throw new Error('All numbers have been called');
    }

    // Select random number from remaining
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    const nextNumber = remainingNumbers[randomIndex];

    // Update room with new number
    const updatedCalledNumbers = [...calledNumbers, nextNumber];

    await roomRef.update({
      calledNumbers: updatedCalledNumbers,
      currentNumber: nextNumber,
    });

    // Mark number on all tickets
    await ticketService.markNumberOnAllTickets(roomCode, nextNumber);

    return nextNumber;
  }

  /**
   * Get all called numbers for a room
   * @param {string} roomCode - Room code
   * @returns {Promise<Array<number>>} Array of called numbers
   */
  async getCalledNumbers(roomCode) {
    const roomRef = this.roomsCollection.doc(roomCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();
    let calledNumbers = room.calledNumbers || [];
    
    // Ensure it's an array (Firebase may convert to object)
    if (!Array.isArray(calledNumbers)) {
      calledNumbers = Object.values(calledNumbers);
    }
    
    return calledNumbers;
  }

  /**
   * Get current number
   * @param {string} roomCode - Room code
   * @returns {Promise<number|null>} Current number or null
   */
  async getCurrentNumber(roomCode) {
    const roomRef = this.roomsCollection.doc(roomCode);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data();
    return room.currentNumber || null;
  }

  /**
   * Get previous N called numbers
   * @param {string} roomCode - Room code
   * @param {number} count - How many previous numbers to get
   * @returns {Promise<Array<number>>} Array of previous numbers
   */
  async getPreviousNumbers(roomCode, count = 2) {
    const calledNumbers = await this.getCalledNumbers(roomCode);

    if (calledNumbers.length === 0) {
      return [];
    }

    // Get last N numbers (excluding current which is last in array)
    const previousNumbers = calledNumbers.slice(
      Math.max(0, calledNumbers.length - count - 1),
      calledNumbers.length - 1
    );

    return previousNumbers;
  }

  /**
   * Get number history (current + previous 2)
   * @param {string} roomCode - Room code
   * @returns {Promise<Object>} Object with current and previous numbers
   */
  async getNumberHistory(roomCode) {
    const calledNumbers = await this.getCalledNumbers(roomCode);

    if (calledNumbers.length === 0) {
      return {
        current: null,
        previous: [],
      };
    }

    const current = calledNumbers[calledNumbers.length - 1];
    const previous = calledNumbers.slice(
      Math.max(0, calledNumbers.length - 3),
      calledNumbers.length - 1
    );

    return {
      current,
      previous,
    };
  }

  /**
   * Check if a number has been called
   * @param {string} roomCode - Room code
   * @param {number} number - Number to check
   * @returns {Promise<boolean>} True if called
   */
  async isNumberCalled(roomCode, number) {
    const calledNumbers = await this.getCalledNumbers(roomCode);
    return calledNumbers.includes(number);
  }

  /**
   * Get remaining numbers count
   * @param {string} roomCode - Room code
   * @returns {Promise<number>} Count of remaining numbers
   */
  async getRemainingCount(roomCode) {
    const calledNumbers = await this.getCalledNumbers(roomCode);
    return 90 - calledNumbers.length;
  }

  /**
   * Get game board state (all numbers 1-90 with their status)
   * @param {string} roomCode - Room code
   * @returns {Promise<Array>} Array of number states
   */
  async getGameBoardState(roomCode) {
    const calledNumbers = await this.getCalledNumbers(roomCode);
    const currentNumber = await this.getCurrentNumber(roomCode);
    const calledSet = new Set(calledNumbers);

    const boardState = [];

    for (let i = 1; i <= 90; i++) {
      let status = 'not_called';

      if (i === currentNumber) {
        status = 'current';
      } else if (calledSet.has(i)) {
        status = 'called';
      }

      boardState.push({
        number: i,
        status,
      });
    }

    return boardState;
  }

  /**
   * Reset game (for testing or restart)
   * @param {string} roomCode - Room code
   * @returns {Promise<void>}
   */
  async resetGame(roomCode) {
    const roomRef = this.roomsCollection.doc(roomCode);

    await roomRef.update({
      calledNumbers: [],
      currentNumber: null,
      status: 'waiting',
      startedAt: null,
      prizesLocked: false,
    });

    // Reset all tickets
    const tickets = await ticketService.getRoomTickets(roomCode);
    const resetPromises = tickets.map(ticket =>
      db.collection('tickets').doc(ticket.ticketId).update({
        markedNumbers: [],
      })
    );

    await Promise.all(resetPromises);
  }
}

export default new GameStateService();
