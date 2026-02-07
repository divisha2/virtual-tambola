import { db } from '../config/firebase.js';
import { nanoid } from 'nanoid';

class TicketService {
  constructor() {
    this.ticketsCollection = db.collection('tickets');
    this.roomsCollection = db.collection('rooms');
  }

  /**
   * Generate a valid Tambola ticket
   * Rules:
   * - 3 rows × 9 columns
   * - 15 numbers total (5 per row)
   * - Column 0: 1-9, Column 1: 10-19, ..., Column 8: 80-90
   * - Numbers sorted within columns
   * @returns {Array<Array<number|null>>} 3×9 grid
   */
  generateTicketGrid() {
    // Initialize 3×9 grid with nulls
    const grid = Array(3).fill(null).map(() => Array(9).fill(null));
    
    // Track how many numbers per row (must be exactly 5)
    const numbersPerRow = [0, 0, 0];
    
    // For each column, decide how many numbers (0-3)
    const numbersPerColumn = [];
    for (let col = 0; col < 9; col++) {
      numbersPerColumn[col] = 0;
    }
    
    // We need exactly 15 numbers total, distributed as 5 per row
    // Strategy: Randomly assign columns to rows ensuring 5 per row
    
    // Create array of 15 positions (5 per row)
    const positions = [];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 5; i++) {
        positions.push(row);
      }
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Assign positions to columns (ensuring no column has more than 3)
    const columnAssignments = Array(9).fill(null).map(() => []);
    let posIndex = 0;
    
    for (let col = 0; col < 9; col++) {
      // Each column can have 1-3 numbers, but we need to distribute 15 total
      // Simple approach: try to put 1-2 numbers per column
      const maxForColumn = Math.min(3, 15 - posIndex);
      const minForColumn = col < 6 ? 1 : Math.max(0, 15 - posIndex - (8 - col) * 3);
      
      let numInColumn;
      if (minForColumn === maxForColumn) {
        numInColumn = minForColumn;
      } else {
        numInColumn = minForColumn + Math.floor(Math.random() * (maxForColumn - minForColumn + 1));
      }
      
      for (let i = 0; i < numInColumn && posIndex < 15; i++) {
        columnAssignments[col].push(positions[posIndex]);
        posIndex++;
      }
    }
    
    // Generate numbers for each column
    for (let col = 0; col < 9; col++) {
      const rows = columnAssignments[col];
      if (rows.length === 0) continue;
      
      // Determine number range for this column
      const min = col === 0 ? 1 : col * 10;
      const max = col === 8 ? 90 : (col + 1) * 10 - 1;
      
      // Generate unique random numbers for this column
      const numbers = this.getRandomNumbers(min, max, rows.length);
      numbers.sort((a, b) => a - b);
      
      // Assign numbers to rows
      rows.forEach((row, idx) => {
        grid[row][col] = numbers[idx];
      });
    }
    
    return grid;
  }

  /**
   * Get N unique random numbers from range [min, max]
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} count - How many numbers to generate
   * @returns {Array<number>} Array of unique random numbers
   */
  getRandomNumbers(min, max, count) {
    const range = max - min + 1;
    if (count > range) {
      throw new Error('Cannot generate more unique numbers than range allows');
    }
    
    const numbers = [];
    const used = new Set();
    
    while (numbers.length < count) {
      const num = min + Math.floor(Math.random() * range);
      if (!used.has(num)) {
        used.add(num);
        numbers.push(num);
      }
    }
    
    return numbers;
  }

  /**
   * Check if ticket is unique within room
   * @param {string} roomCode - Room code
   * @param {Array} grid - Ticket grid
   * @returns {Promise<boolean>} True if unique
   */
  async isTicketUnique(roomCode, grid) {
    const gridString = JSON.stringify(grid);
    
    const existingTickets = await this.ticketsCollection
      .where('roomCode', '==', roomCode)
      .get();
    
    for (const doc of existingTickets.docs) {
      const ticket = doc.data();
      if (JSON.stringify(ticket.grid) === gridString) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Generate a unique ticket for a room
   * @param {string} roomCode - Room code
   * @param {string} userId - User ID
   * @param {string} userName - User display name
   * @returns {Promise<Object>} Ticket data
   */
  async generateTicket(roomCode, userId, userName) {
    let grid;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    // Generate unique ticket
    while (!isUnique && attempts < maxAttempts) {
      grid = this.generateTicketGrid();
      isUnique = await this.isTicketUnique(roomCode, grid);
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Failed to generate unique ticket');
    }
    
    const ticketId = nanoid();
    const ticketData = {
      ticketId,
      roomCode,
      userId,
      userName,
      grid,
      markedNumbers: [],
      createdAt: Date.now(), // Use timestamp instead of Date object
    };
    
    await this.ticketsCollection.doc(ticketId).set(ticketData);
    
    // Update room with ticket reference
    const roomRef = this.roomsCollection.doc(roomCode);
    const roomDoc = await roomRef.get();
    
    if (roomDoc.exists) {
      const room = roomDoc.data();
      
      // Ensure participants array exists
      const participants = room.participants || [];
      
      // Update participant's ticketId
      const updatedParticipants = participants.map(p =>
        p.userId === userId ? { ...p, ticketId } : p
      );
      
      // If host, also set host ticket
      if (room.hostId === userId) {
        await roomRef.update({
          participants: updatedParticipants,
          hostTicketId: ticketId,
        });
      } else {
        await roomRef.update({
          participants: updatedParticipants,
        });
      }
    }
    
    // Return the ticket data directly (not from Firebase to avoid array->object conversion)
    return ticketData;
  }

  /**
   * Get ticket by ID
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object|null>} Ticket data
   */
  async getTicket(ticketId) {
    const doc = await this.ticketsCollection.doc(ticketId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const ticket = doc.data();
    
    // Convert grid to proper arrays (Firebase Realtime DB may convert to objects)
    if (ticket.grid) {
      ticket.grid = ticket.grid.map(row => {
        if (Array.isArray(row)) return row;
        // Convert object to array
        return Object.values(row);
      });
    }
    
    return ticket;
  }

  /**
   * Get all tickets for a room
   * @param {string} roomCode - Room code
   * @returns {Promise<Array>} Array of tickets
   */
  async getRoomTickets(roomCode) {
    const snapshot = await this.ticketsCollection
      .where('roomCode', '==', roomCode)
      .get();
    
    return snapshot.docs.map(doc => {
      const ticket = doc.data();
      // Convert grid to proper arrays (Firebase Realtime DB may convert to objects)
      if (ticket.grid) {
        ticket.grid = ticket.grid.map(row => {
          if (Array.isArray(row)) return row;
          return Object.values(row);
        });
      }
      return ticket;
    });
  }

  /**
   * Mark a number on a ticket
   * @param {string} ticketId - Ticket ID
   * @param {number} number - Number to mark
   * @returns {Promise<void>}
   */
  async markNumber(ticketId, number) {
    const ticketRef = this.ticketsCollection.doc(ticketId);
    const ticketDoc = await ticketRef.get();
    
    if (!ticketDoc.exists) {
      throw new Error('Ticket not found');
    }
    
    const ticket = ticketDoc.data();
    
    // Convert grid to proper arrays (Firebase Realtime DB may convert to objects)
    const grid = ticket.grid.map(row => {
      if (Array.isArray(row)) return row;
      return Object.values(row);
    });
    
    // Ensure markedNumbers is an array
    let markedNumbers = ticket.markedNumbers || [];
    if (!Array.isArray(markedNumbers)) {
      markedNumbers = Object.values(markedNumbers);
    }
    
    // Check if number exists on ticket
    const hasNumber = grid.some(row => row.includes(number));
    
    if (hasNumber && !markedNumbers.includes(number)) {
      await ticketRef.update({
        markedNumbers: [...markedNumbers, number],
      });
    }
  }

  /**
   * Mark a number on all tickets in a room
   * @param {string} roomCode - Room code
   * @param {number} number - Number to mark
   * @returns {Promise<void>}
   */
  async markNumberOnAllTickets(roomCode, number) {
    const tickets = await this.getRoomTickets(roomCode);
    
    const markPromises = tickets.map(ticket => 
      this.markNumber(ticket.ticketId, number)
    );
    
    await Promise.all(markPromises);
  }

  /**
   * Validate ticket structure
   * @param {Array} grid - Ticket grid
   * @returns {boolean} True if valid
   */
  validateTicketStructure(grid) {
    // Check 3 rows
    if (!Array.isArray(grid) || grid.length !== 3) {
      return false;
    }
    
    // Check 9 columns per row
    for (const row of grid) {
      if (!Array.isArray(row) || row.length !== 9) {
        return false;
      }
    }
    
    // Count total numbers (should be 15)
    let totalNumbers = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell !== null) {
          totalNumbers++;
          
          // Check number range (1-90)
          if (typeof cell !== 'number' || cell < 1 || cell > 90) {
            return false;
          }
        }
      }
    }
    
    if (totalNumbers !== 15) {
      return false;
    }
    
    // Check 5 numbers per row
    for (const row of grid) {
      const numbersInRow = row.filter(cell => cell !== null).length;
      if (numbersInRow !== 5) {
        return false;
      }
    }
    
    return true;
  }
}

export default new TicketService();
