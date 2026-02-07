import React from 'react';
import { motion } from 'framer-motion';

function ClaimVerification({ claim, onVerify, calledNumbers }) {
  const renderTicket = () => {
    return (
      <div className="grid grid-cols-9 gap-1 mb-4">
        {claim.ticket.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => {
              const isCalled = cell !== null && calledNumbers.includes(cell);
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    aspect-square flex items-center justify-center text-xs
                    border ${cell === null ? 'border-transparent' : 'border-text-muted'}
                    ${isCalled ? 'bg-primary text-background' : 'bg-surface text-text'}
                  `}
                >
                  {cell || ''}
                </div>
              );
            })}
          </React.Fragment>
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
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Optional: close on backdrop click
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-display text-3xl mb-4 text-accent">
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

        <div className="flex gap-4">
          <button
            onClick={() => onVerify(claim.claimId, false)}
            className="btn btn-secondary flex-1"
          >
            Reject
          </button>
          <button
            onClick={() => onVerify(claim.claimId, true)}
            className="btn btn-primary flex-1"
          >
            Approve
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ClaimVerification;
