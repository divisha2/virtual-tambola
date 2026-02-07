import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PRIZE_TYPES = [
  { value: 'early_five', label: 'Early Five' },
  { value: 'top_row', label: 'Top Row' },
  { value: 'middle_row', label: 'Middle Row' },
  { value: 'bottom_row', label: 'Bottom Row' },
  { value: 'full_house', label: 'Full House' },
];

function PrizeConfig({ roomCode, socket, onPrizesConfigured }) {
  const [prizes, setPrizes] = useState(
    PRIZE_TYPES.map((type) => ({ type: type.value, maxWinners: 1 }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);

  const handleFrequencyChange = (index, value) => {
    const newPrizes = [...prizes];
    newPrizes[index].maxWinners = parseInt(value) || 1;
    setPrizes(newPrizes);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!socket) return;

    setLoading(true);
    setError('');

    socket.emit('configure_prizes', { roomCode, prizes }, (response) => {
      setLoading(false);
      if (response.success) {
        setConfigured(true);
        onPrizesConfigured(prizes.map(p => ({ ...p, currentWinners: 0, available: true })));
      } else {
        setError(response.error || 'Failed to configure prizes');
      }
    });
  };

  if (configured) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        <div className="text-center">
          <div className="text-success text-2xl mb-2">✓</div>
          <p className="text-sm text-text-muted">Prizes Configured</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="card"
    >
      <h3 className="text-display text-xl mb-4 text-accent">CONFIGURE PRIZES</h3>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3 mb-4">
          {PRIZE_TYPES.map((prizeType, index) => (
            <div key={prizeType.value} className="flex items-center justify-between gap-4">
              <label className="text-sm text-text-muted flex-1">
                {prizeType.label}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={prizes[index].maxWinners}
                onChange={(e) => handleFrequencyChange(index, e.target.value)}
                className="input w-20 text-center"
                disabled={loading}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-2 border-2 border-error text-error text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-accent w-full"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
    </motion.div>
  );
}

export default PrizeConfig;
