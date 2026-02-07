import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../utils/socket';
import TambolaTicket from '../components/TambolaTicket';
import ClaimModal from '../components/ClaimModal';
import WinnerAnnouncement from '../components/WinnerAnnouncement';

function ParticipantView() {
  const { roomCode } = useParams();
  const [socket, setSocket] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [previousNumbers, setPreviousNumbers] = useState([]);
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null); // pending, approved, rejected
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // Fetch initial room state and reconnect
    const fetchRoomState = async () => {
      const userId = localStorage.getItem('userId');
      const ticketId = localStorage.getItem('ticketId');
      const storedTicket = localStorage.getItem('ticket');
      
      // Try to parse stored ticket
      if (storedTicket) {
        try {
          const parsedTicket = JSON.parse(storedTicket);
          // Convert grid to proper arrays (Firebase may convert to objects)
          if (parsedTicket.grid) {
            parsedTicket.grid = parsedTicket.grid.map(row => {
              if (Array.isArray(row)) return row;
              // Convert object to array
              return Object.values(row);
            });
          }
          setTicket(parsedTicket);
        } catch (e) {
          console.error('Failed to parse stored ticket');
        }
      }

      socketInstance.emit('reconnect_user', { 
        roomCode, 
        userId, 
        role: 'participant' 
      }, (response) => {
        if (response.success) {
          const room = response.room;
          setGameStatus(room.status);
          if (response.history) {
            setCurrentNumber(response.history.current);
            setPreviousNumbers(response.history.previous || []);
            // Mark all called numbers
            setMarkedNumbers(room.calledNumbers || []);
          }
        }
      });
    };

    fetchRoomState();

    // Listen for game started
    socketInstance.on('game_started', () => {
      setGameStatus('active');
    });

    // Listen for number called
    socketInstance.on('number_called', (data) => {
      setCurrentNumber(data.current);
      setPreviousNumbers(data.previous);
      
      // Mark number on ticket if present
      if (ticket && data.number) {
        const hasNumber = ticket.grid.some(row => row.includes(data.number));
        if (hasNumber) {
          setMarkedNumbers(prev => [...prev, data.number]);
        }
      }
    });

    // Listen for claim approved
    socketInstance.on('claim_approved', (data) => {
      setClaimStatus('approved');
      setTimeout(() => setClaimStatus(null), 3000);
    });

    // Listen for claim rejected
    socketInstance.on('claim_rejected', (data) => {
      setClaimStatus('rejected');
      setTimeout(() => setClaimStatus(null), 3000);
    });

    // Listen for winner announcements
    socketInstance.on('winner_announced', (data) => {
      setWinner(data);
      setTimeout(() => setWinner(null), 5000);
    });

    // Listen for game paused
    socketInstance.on('game_paused', () => {
      setGameStatus('paused');
    });

    socketInstance.on('game_resumed', () => {
      setGameStatus('active');
    });

    return () => {
      socketInstance.off('game_started');
      socketInstance.off('number_called');
      socketInstance.off('claim_approved');
      socketInstance.off('claim_rejected');
      socketInstance.off('winner_announced');
      socketInstance.off('game_paused');
      socketInstance.off('game_resumed');
    };
  }, [ticket]);

  const handleClaimClick = () => {
    setShowClaimModal(true);
  };

  const handleSubmitClaim = (prizeType) => {
    if (!socket) return;

    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const ticketId = localStorage.getItem('ticketId');

    socket.emit(
      'submit_claim',
      { roomCode, userId, userName, ticketId, prizeType },
      (response) => {
        if (response.success) {
          setClaimStatus('pending');
          setShowClaimModal(false);
        } else {
          setError(response.error || 'Failed to submit claim');
        }
      }
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-display text-4xl md:text-6xl text-secondary">
          TAMBOLA
        </h1>
        <p className="text-text-muted text-sm mt-2">
          Room: <span className="text-primary">{roomCode}</span>
        </p>
      </motion.div>

      {/* Game Status */}
      {gameStatus === 'waiting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <p className="text-text-muted animate-pulse">
            Waiting for host to start the game...
          </p>
        </motion.div>
      )}

      {gameStatus === 'paused' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <p className="text-warning">Game Paused - Host Disconnected</p>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Current Number Display */}
        {currentNumber && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card mb-6 text-center"
          >
            <p className="text-text-muted text-sm mb-2">CURRENT NUMBER</p>
            <div className="text-display text-9xl text-primary animate-pulse">
              {currentNumber}
            </div>
            {previousNumbers.length > 0 && (
              <div className="mt-4">
                <p className="text-text-muted text-xs mb-2">PREVIOUS</p>
                <div className="flex justify-center gap-6">
                  {previousNumbers.map((num, idx) => (
                    <span key={idx} className="text-display text-3xl text-secondary">
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {ticket ? (
            <TambolaTicket ticket={ticket} markedNumbers={markedNumbers} />
          ) : (
            <div className="card text-center">
              <p className="text-text-muted">Loading ticket...</p>
            </div>
          )}
        </motion.div>

        {/* Claim Button */}
        {gameStatus === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <button
              onClick={handleClaimClick}
              className="btn btn-accent text-2xl py-6 px-12"
              disabled={claimStatus === 'pending'}
            >
              {claimStatus === 'pending' ? 'CLAIM PENDING...' : 'CLAIM PRIZE'}
            </button>

            {claimStatus === 'approved' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-success mt-4"
              >
                ✓ Claim Approved!
              </motion.p>
            )}

            {claimStatus === 'rejected' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-error mt-4"
              >
                ✗ Claim Rejected
              </motion.p>
            )}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 border-2 border-error text-error text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {showClaimModal && (
          <ClaimModal
            onClose={() => setShowClaimModal(false)}
            onSubmit={handleSubmitClaim}
          />
        )}
      </AnimatePresence>

      {/* Winner Announcement */}
      <AnimatePresence>
        {winner && <WinnerAnnouncement winner={winner} />}
      </AnimatePresence>
    </div>
  );
}

export default ParticipantView;
