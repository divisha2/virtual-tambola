import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../utils/socket';

function ConnectionStatus() {
  const [status, setStatus] = useState('connected'); // connected, disconnected, reconnecting
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setStatus('connected');
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 2000);
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
      setShowStatus(true);
    };

    const handleReconnecting = () => {
      setStatus('reconnecting');
      setShowStatus(true);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnecting', handleReconnecting);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnecting', handleReconnecting);
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          text: 'Connected',
          color: 'bg-success',
          icon: '✓',
        };
      case 'disconnected':
        return {
          text: 'Disconnected',
          color: 'bg-error',
          icon: '✗',
        };
      case 'reconnecting':
        return {
          text: 'Reconnecting...',
          color: 'bg-warning',
          icon: '⟳',
        };
      default:
        return {
          text: 'Unknown',
          color: 'bg-text-muted',
          icon: '?',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`${config.color} text-background px-4 py-2 flex items-center gap-2`}>
            <span className="text-lg">{config.icon}</span>
            <span className="text-sm font-bold">{config.text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConnectionStatus;
