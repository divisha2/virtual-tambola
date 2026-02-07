import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ParticipantList({ participants }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card"
    >
      <h3 className="text-display text-xl mb-4 text-secondary">
        PARTICIPANTS ({participants.length})
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {participants.map((participant, index) => (
            <motion.div
              key={participant.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-2 border-b border-text-muted"
            >
              <span className="text-sm">{participant.userName}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  participant.connected ? 'bg-success' : 'bg-error'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {participants.length === 0 && (
          <p className="text-text-muted text-sm text-center py-4">
            Waiting for participants...
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default ParticipantList;
