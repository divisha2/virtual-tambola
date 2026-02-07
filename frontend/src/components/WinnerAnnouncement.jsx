import React from 'react';
import { motion } from 'framer-motion';

function WinnerAnnouncement({ winner }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, rotate: 10 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="text-display text-8xl mb-4"
        >
          🎉
        </motion.div>

        <h2 className="text-display text-6xl text-accent mb-4 animate-glitch">
          WINNER!
        </h2>

        <p className="text-display text-4xl text-primary mb-2">
          {winner.userName}
        </p>

        <p className="text-display text-2xl text-secondary">
          {winner.prizeName}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default WinnerAnnouncement;
