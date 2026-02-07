import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import roomService from './services/roomService.js';
import ticketService from './services/ticketService.js';
import prizeService from './services/prizeService.js';
import gameStateService from './services/gameStateService.js';
import claimService from './services/claimService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Store socket to user/room mappings
const socketToUser = new Map(); // socket.id -> { userId, roomCode, role }
const roomSockets = new Map(); // roomCode -> Set of socket.ids

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Create room (host)
  socket.on('create_room', async (data, callback) => {
    try {
      const { hostName, userId } = data;
      const room = await roomService.createRoom(hostName, userId);
      
      // Generate ticket for host
      const ticket = await ticketService.generateTicket(
        room.roomCode,
        userId,
        hostName
      );

      // Join socket room
      socket.join(room.roomCode);
      
      // Store mapping
      socketToUser.set(socket.id, {
        userId,
        roomCode: room.roomCode,
        role: 'host',
      });

      if (!roomSockets.has(room.roomCode)) {
        roomSockets.set(room.roomCode, new Set());
      }
      roomSockets.get(room.roomCode).add(socket.id);

      callback({
        success: true,
        room,
        ticket,
      });
    } catch (error) {
      console.error('Create room error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  // Join room (participant)
  socket.on('join_room', async (data, callback) => {
    try {
      const { roomCode, participantName, userId } = data;
      
      const result = await roomService.joinRoom(roomCode, participantName, userId);
      
      // Generate ticket for participant
      const ticket = await ticketService.generateTicket(
        roomCode.toUpperCase(),
        userId,
        participantName
      );

      // Join socket room
      socket.join(roomCode.toUpperCase());
      
      // Store mapping
      socketToUser.set(socket.id, {
        userId,
        roomCode: roomCode.toUpperCase(),
        role: 'participant',
      });

      if (!roomSockets.has(roomCode.toUpperCase())) {
        roomSockets.set(roomCode.toUpperCase(), new Set());
      }
      roomSockets.get(roomCode.toUpperCase()).add(socket.id);

      // Get updated room state
      const updatedRoom = await roomService.getRoomState(roomCode.toUpperCase());
      
      // Broadcast to room that participant joined with full participant list
      socket.to(roomCode.toUpperCase()).emit('participant_joined', {
        userName: participantName,
        userId,
        participants: updatedRoom.participants,
      });

      callback({
        success: true,
        room: result.room,
        ticket,
      });
    } catch (error) {
      console.error('Join room error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  // Configure prizes (host only)
  socket.on('configure_prizes', async (data, callback) => {
    try {
      const { roomCode, prizes } = data;
      
      await prizeService.configurePrizes(roomCode, prizes);

      // Broadcast prize configuration to all in room
      io.to(roomCode).emit('prizes_configured', { prizes });

      callback({ success: true });
    } catch (error) {
      console.error('Configure prizes error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  // Start game (host only)
  socket.on('start_game', async (data, callback) => {
    try {
      const { roomCode } = data;
      
      await roomService.startGame(roomCode);

      // Broadcast game started to all in room
      io.to(roomCode).emit('game_started', {
        timestamp: Date.now(),
      });

      callback({ success: true });
    } catch (error) {
      console.error('Start game error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  // Call number (host only)
  socket.on('call_number', async (data, callback) => {
    try {
      const { roomCode } = data;
      
      const number = await gameStateService.callNextNumber(roomCode);
      const history = await gameStateService.getNumberHistory(roomCode);

      // Broadcast number to all in room
      io.to(roomCode).emit('number_called', {
        number,
        current: history.current,
        previous: history.previous,
      });

      callback({
        success: true,
        number,
        history,
      });
    } catch (error) {
      console.error('Call number error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  // Submit claim (participant)
  socket.on('submit_claim', async (data, callback) => {
    try {
      const { roomCode, userId, userName, ticketId, prizeType } = data;
      
      const result = await claimService.submitClaim(
        roomCode,
        userId,
        userName,
        ticketId,
        prizeType
      );

      // Send claim to host only
      const roomSocketSet = roomSockets.get(roomCode) || new Set();
      for (const socketId of roomSocketSet) {
        const userInfo = socketToUser.get(socketId);
        if (userInfo && userInfo.role === 'host') {
          io.to(socketId).emit('claim_received', result.claim);
        }
      }

      callback({
        success: true,
        claimId: result.claimId,
      });
    } catch (error) {
      console.error('Submit claim error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  // Verify claim (host only)
  socket.on('verify_claim', async (data, callback) => {
    try {
      const { claimId, approved, hostId } = data;
      
      let result;
      if (approved) {
        result = await claimService.approveClaim(claimId, hostId);
        
        // Broadcast winner announcement to all in room
        io.to(result.claim.roomCode).emit('winner_announced', {
          userName: result.claim.userName,
          prizeType: result.claim.prizeType,
          prizeName: prizeService.getPrizeDisplayName(result.claim.prizeType),
        });

        // Send approval to claimant
        const roomSocketSet = roomSockets.get(result.claim.roomCode) || new Set();
        for (const socketId of roomSocketSet) {
          const userInfo = socketToUser.get(socketId);
          if (userInfo && userInfo.userId === result.claim.userId) {
            io.to(socketId).emit('claim_approved', {
              claimId,
              prizeType: result.claim.prizeType,
            });
          }
        }
      } else {
        result = await claimService.rejectClaim(claimId, hostId);
        
        // Send rejection to claimant only
        const roomSocketSet = roomSockets.get(result.claim.roomCode) || new Set();
        for (const socketId of roomSocketSet) {
          const userInfo = socketToUser.get(socketId);
          if (userInfo && userInfo.userId === result.claim.userId) {
            io.to(socketId).emit('claim_rejected', {
              claimId,
              prizeType: result.claim.prizeType,
            });
          }
        }
      }

      callback({ success: true });
    } catch (error) {
      console.error('Verify claim error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    
    const userInfo = socketToUser.get(socket.id);
    if (userInfo) {
      const { userId, roomCode, role } = userInfo;
      
      // Update connection status
      await roomService.updateParticipantConnection(roomCode, userId, false);
      
      // If host disconnected, pause game
      if (role === 'host') {
        await roomService.pauseGame(roomCode);
        io.to(roomCode).emit('game_paused', {
          reason: 'Host disconnected',
        });
      }
      
      // Clean up mappings
      socketToUser.delete(socket.id);
      if (roomSockets.has(roomCode)) {
        roomSockets.get(roomCode).delete(socket.id);
      }
    }
  });

  // Reconnect handling
  socket.on('reconnect_user', async (data, callback) => {
    try {
      const { roomCode, userId, role } = data;
      
      // Update connection status
      await roomService.updateParticipantConnection(roomCode, userId, true);
      
      // Join socket room
      socket.join(roomCode);
      
      // Store mapping
      socketToUser.set(socket.id, { userId, roomCode, role });
      
      if (!roomSockets.has(roomCode)) {
        roomSockets.set(roomCode, new Set());
      }
      roomSockets.get(roomCode).add(socket.id);
      
      // If host reconnected, resume game
      if (role === 'host') {
        await roomService.resumeGame(roomCode);
        io.to(roomCode).emit('game_resumed', {
          timestamp: Date.now(),
        });
      }
      
      // Get current game state
      const room = await roomService.getRoomState(roomCode);
      const history = await gameStateService.getNumberHistory(roomCode);
      
      callback({
        success: true,
        room,
        history,
      });
    } catch (error) {
      console.error('Reconnect error:', error);
      callback({
        success: false,
        error: error.message,
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
