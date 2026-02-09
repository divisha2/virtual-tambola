import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../utils/socket';
import { auth } from '../config/firebase';

function Landing() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'host' or 'join'
  const [hostName, setHostName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateName = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      return 'Name must be 2-30 characters';
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
      return 'Name must be alphanumeric';
    }
    return null;
  };

  const validateRoomCode = (code) => {
    if (!code || code.trim().length === 0) {
      return 'Room code is required';
    }
    return null;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');

    const nameError = validateName(hostName);
    if (nameError) {
      setError(nameError);
      return;
    }

    setLoading(true);

    try {
      const socket = getSocket();
      const userId = auth.currentUser?.uid || `anon-${Date.now()}`;

      // Add timeout for callback
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Server timeout. Please check your connection and try again.');
      }, 10000); // 10 second timeout

      socket.emit('create_room', { hostName: hostName.trim(), userId }, (response) => {
        clearTimeout(timeout);
        setLoading(false);

        console.log('Create room response:', response);

        if (response.success) {
          // Store room and user info in localStorage
          localStorage.setItem('roomCode', response.room.roomCode);
          localStorage.setItem('userId', userId);
          localStorage.setItem('role', 'host');
          localStorage.setItem('userName', hostName.trim());
          localStorage.setItem('ticketId', response.ticket.ticketId);
          localStorage.setItem('ticket', JSON.stringify(response.ticket));

          navigate(`/host/${response.room.roomCode}`);
        } else {
          setError(response.error || 'Failed to create room');
        }
      });
    } catch (err) {
      setLoading(false);
      console.error('Create room error:', err);
      setError('Connection error. Please try again.');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');

    const nameError = validateName(participantName);
    if (nameError) {
      setError(nameError);
      return;
    }

    const codeError = validateRoomCode(roomCode);
    if (codeError) {
      setError(codeError);
      return;
    }

    setLoading(true);

    try {
      const socket = getSocket();
      const userId = auth.currentUser?.uid || `anon-${Date.now()}`;

      socket.emit(
        'join_room',
        {
          roomCode: roomCode.trim().toUpperCase(),
          participantName: participantName.trim(),
          userId,
        },
        (response) => {
          setLoading(false);

          if (response.success) {
            // Store room and user info in localStorage
            localStorage.setItem('roomCode', roomCode.trim().toUpperCase());
            localStorage.setItem('userId', userId);
            localStorage.setItem('role', 'participant');
            localStorage.setItem('userName', participantName.trim());
            localStorage.setItem('ticketId', response.ticket.ticketId);
            localStorage.setItem('ticket', JSON.stringify(response.ticket));

            navigate(`/play/${roomCode.trim().toUpperCase()}`);
          } else {
            setError(response.error || 'Failed to join room');
          }
        }
      );
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Title */}
        <motion.h1
          className="text-display text-6xl md:text-8xl text-center mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <span className="text-primary">VIRTUAL</span>
          <br />
          <span className="text-secondary">TAMBOLA</span>
        </motion.h1>

        <motion.p
          className="text-body text-center text-text-muted mb-12 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Real-time multiplayer Tambola experience
        </motion.p>

        {/* Mode selection or forms */}
        {!mode ? (
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => setMode('host')}
              className="btn btn-primary w-full py-6"
            >
              Host a Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="btn btn-secondary w-full py-6"
            >
              Join a Game
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <button
              onClick={() => {
                setMode(null);
                setError('');
              }}
              className="text-text-muted hover:text-text mb-4 text-sm"
            >
              ← Back
            </button>

            {mode === 'host' ? (
              <form onSubmit={handleCreateRoom}>
                <h2 className="text-display text-3xl mb-6 text-primary">
                  Host a Game
                </h2>

                <div className="mb-6">
                  <label className="block text-sm mb-2 text-text-muted">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="Enter your name"
                    className="input w-full"
                    disabled={loading}
                    maxLength={30}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 border-2 border-error text-error text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoom}>
                <h2 className="text-display text-3xl mb-6 text-secondary">
                  Join a Game
                </h2>

                <div className="mb-4">
                  <label className="block text-sm mb-2 text-text-muted">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="TMB-XXXX"
                    className="input w-full"
                    disabled={loading}
                    maxLength={8}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm mb-2 text-text-muted">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your name"
                    className="input w-full"
                    disabled={loading}
                    maxLength={30}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 border-2 border-error text-error text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-secondary w-full"
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default Landing;
