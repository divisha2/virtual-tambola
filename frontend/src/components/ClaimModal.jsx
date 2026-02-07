import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PRIZE_OPTIONS = [
  { value: 'early_five', label: 'Early Five' },
  { value: 'top_row', label: 'Top Row' },
  { value: 'middle_row', label: 'Middle Row' },
  { value: 'bottom_row', label: 'Bottom Row' },
  { value: 'full_house', label: 'Full House' },
];

function ClaimModal({ onClose, onSubmit }) {
  const [selectedPrize, setSelectedPrize] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPrize) {
      onSubmit(selectedPrize);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="card max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-display text-3xl mb-6 text-accent">
          SELECT PRIZE
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-6">
            {PRIZE_OPTIONS.map((prize) => (
              <label
                key={prize.value}
                className={`
                  block p-4 border-2 cursor-pointer transition-all
                  ${
                    selectedPrize === prize.value
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-text-muted hover:border-primary'
                  }
                `}
              >
                <input
                  type="radio"
                  name="prize"
                  value={prize.value}
                  checked={selectedPrize === prize.value}
                  onChange={(e) => setSelectedPrize(e.target.value)}
                  className="sr-only"
                />
                <span className="text-display text-xl">{prize.label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={!selectedPrize}
            >
              Submit Claim
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default ClaimModal;
