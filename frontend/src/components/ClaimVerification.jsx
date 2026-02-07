import React from 'react';
import { motion } from 'framer-motion';

function ClaimVerification({ claim, onVerify, calledNumbers }) {
  const renderTicket = () => {
    // Ensure ticket is properly formatted as 3 rows × 9 columns
    const grid = claim.ticket.map(row => {
      if (Array.isArray(row)) return row;
      return Object.values(row);
    });

    return (
      <div className="mb-4">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-9 gap-1 mb-1">
            {row.map((cell, colIndex) => {
              const isCalled = cell !== null && calledNumbers.includes(cell);
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    aspect-square flex items-center justify-center text-sm font-bold
                    border-2 ${cell === null ? 'border-transparent bg-transparent' : 'border-text-muted'}
                    ${isCalled ? 'bg-primary text-background' : 'bg-surface text-text'}
                  `}
                >
                  {cell || ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const getPrizeName = (prizeType) => {
    return prizeType.replace('_', ' ').toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Optional: close on backdrop click
        }
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="card w-full max-w-md h-full overflow-y-auto rounded-none border-l-4 border-accent"
        style={{ borderRadius: 0 }}
      >
        <h2 className="text-display text-2xl mb-4 text-accent">
          CLAIM VERIFICATION
        </h2>

        <div className="mb-4">
          <p className="text-sm text-text-muted mb-1">Participant</p>
          <p className="text-xl">{claim.userName}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-text-muted mb-1">Prize Claimed</p>
          <p className="text-xl text-primary">{getPrizeName(claim.prizeType)}</p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-text-muted mb-2">Ticket</p>
          {renderTicket()}
        </div>

        <div className="mb-4">
          <p className="text-xs text-text-muted">
            Submitted: {new Date(claim.submittedAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onVerify(claim.claimId, true)}
            className="btn btn-primary w-full"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onVerify(claim.claimId, false)}
            className="btn btn-secondary w-full"
          >
            ✗ Reject
          </button>
        </div>

        <div className="mt-6 p-3 bg-surface border-2 border-text-muted">
          <p className="text-xs text-text-muted">
            💡 Tip: Check the number board on the left to verify all marked numbers have been called.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ClaimVerification;
