import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../utils/socket';
import PrizeConfig from '../components/PrizeConfig';
import NumberBoard from '../components/NumberBoard';
import ClaimVerification from '../components/ClaimVerification';
import ParticipantList from '../components/ParticipantList';

function HostDashboard() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, active, paused
  const [currentNumber, setCurrentNumber] = useState(null);
  const [previousNumbers, setPreviousNumbers] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // Fetch initial room state
    const fetchRoomState = async () => {
      const userId = localStorage.getItem('userId');
      socketInstance.emit('reconnect_user', { 
        roomCode, 
        userId, 
        role: 'host' 
      }, (response) => {
        if (response.success) {
          const room = response.room;
          setParticipants(room.participants || []);
          setGameStatus(room.status);
          setPrizes(room.prizes || []);
          
          // Ensure calledNumbers is an array
          let calledNums = room.calledNumbers || [];
          if (!Array.isArray(calledNums)) {
            calledNums = Object.values(calledNums);
          }
          setCalledNumbers(calledNums);
          
          if (response.history) {
            setCurrentNumber(response.history.current);
            setPreviousNumbers(response.history.previous || []);
          }
        }
      });
    };

    fetchRoomState();

    // Listen for participant joins
    socketInstance.on('participant_joined', (data) => {
      // Update with full participants list if provided
      if (data.participants) {
        setParticipants(data.participants);
      } else {
        // Fallback: add single participant
        setParticipants((prev) => [...prev, { userName: data.userName, userId: data.userId }]);
      }
    });

    // Listen for game started
    socketInstance.on('game_started', () => {
      setGameStatus('active');
    });

    // Listen for number called
    socketInstance.on('number_called', (data) => {
      setCurrentNumber(data.current);
      setPreviousNumbers(data.previous);
      setCalledNumbers((prev) => [...prev, data.number]);
    });

    // Listen for claims
    socketInstance.on('claim_received', (claim) => {
      setPendingClaims((prev) => [...prev, claim]);
    });

    // Listen for game paused/resumed
    socketInstance.on('game_paused', () => {
      setGameStatus('paused');
    });

    socketInstance.on('game_resumed', () => {
      setGameStatus('active');
    });

    return () => {
      socketInstance.off('participant_joined');
      socketInstance.off('game_started');
      socketInstance.off('number_called');
      socketInstance.off('claim_received');
      socketInstance.off('game_paused');
      socketInstance.off('game_resumed');
    };
  }, []);

  const handlePrizesConfigured = (configuredPrizes) => {
    setPrizes(configuredPrizes);
  };

  const handleStartGame = () => {
    if (!socket) return;

    setLoading(true);
    socket.emit('start_game', { roomCode }, (response) => {
      setLoading(false);
      if (!response.success) {
        setError(response.error || 'Failed to start game');
      }
    });
  };

  const handleCallNumber = () => {
    if (!socket) return;

    setLoading(true);
    socket.emit('call_number', { roomCode }, (response) => {
      setLoading(false);
      if (!response.success) {
        setError(response.error || 'Failed to call number');
      }
    });
  };

  const handleVerifyClaim = (claimId, approved) => {
    if (!socket) return;

    const userId = localStorage.getItem('userId');
    socket.emit('verify_claim', { claimId, approved, hostId: userId }, (response) => {
      if (response.success) {
        // Remove claim from pending
        setPendingClaims((prev) => prev.filter((c) => c.claimId !== claimId));
      } else {
        setError(response.error || 'Failed to verify claim');
      }
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-display text-4xl md:text-6xl text-primary">
              HOST DASHBOARD
            </h1>
            <p className="text-text-muted text-sm mt-2">
              Room Code: <span className="text-secondary text-lg">{roomCode}</span>
            </p>
          </div>

          <div className="flex gap-4">
            {gameStatus === 'waiting' && prizes.length > 0 && (
              <button
                onClick={handleStartGame}
                className="btn btn-accent"
                disabled={loading}
              >
                Start Game
              </button>
            )}

            {gameStatus === 'active' && (
              <button
                onClick={handleCallNumber}
                className="btn btn-primary"
                disabled={loading}
              >
                Next Number
              </button>
            )}

            {gameStatus === 'paused' && (
              <div className="text-warning text-sm">
                Game Paused
              </div>
            )}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 border-2 border-error text-error text-sm"
          >
            {error}
          </motion.div>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Number Board */}
        <div className="lg:col-span-2">
          {/* Current Number Display */}
          {currentNumber && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card mb-6 text-center"
            >
              <p className="text-text-muted text-sm mb-2">CURRENT NUMBER</p>
              <div className="text-display text-8xl text-primary animate-pulse">
                {currentNumber}
              </div>
              {previousNumbers.length > 0 && (
                <div className="mt-4">
                  <p className="text-text-muted text-xs mb-2">PREVIOUS</p>
                  <div className="flex justify-center gap-4">
                    {previousNumbers.map((num, idx) => (
                      <span key={idx} className="text-display text-2xl text-secondary">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Number Board */}
          <NumberBoard calledNumbers={calledNumbers} currentNumber={currentNumber} />
        </div>

        {/* Right Column - Controls & Info */}
        <div className="space-y-6">
          {/* Prize Configuration */}
          {gameStatus === 'waiting' && (
            <PrizeConfig
              roomCode={roomCode}
              socket={socket}
              onPrizesConfigured={handlePrizesConfigured}
            />
          )}

          {/* Prize Status */}
          {prizes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
            >
              <h3 className="text-display text-xl mb-4 text-secondary">PRIZES</h3>
              <div className="space-y-2">
                {prizes.map((prize, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm border-b border-text-muted pb-2"
                  >
                    <span className="text-text-muted">
                      {prize.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={prize.available ? 'text-success' : 'text-error'}>
                      {prize.currentWinners}/{prize.maxWinners}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Participants */}
          <ParticipantList participants={participants} />
        </div>
      </div>

      {/* Claim Verification Modal */}
      <AnimatePresence>
        {pendingClaims.length > 0 && (
          <ClaimVerification
            claim={pendingClaims[0]}
            onVerify={handleVerifyClaim}
            calledNumbers={calledNumbers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default HostDashboard;
