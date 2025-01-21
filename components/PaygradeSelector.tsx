import React, { useState } from 'react';

interface PaygradeSelectorProps {
  onSelect: (paygrade: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PaygradeSelector({ onSelect, onBack, onNext }: PaygradeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRank, setSelectedRank] = useState<string>('');

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleRankSelect = (rank: string) => {
    setSelectedRank(rank);
    onSelect(rank); // The rank is already in the correct format (e.g., "E-5", "O-3")
  };

  const ranks = {
    Enlisted: ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9'],
    'Warrant Officer': ['W-1', 'W-2', 'W-3', 'W-4', 'W-5'],
    Officer: ['O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10']
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">What is your paygrade?</h2>
        <p className="text-gray-400">
          Select your current rank to help personalize your timeline.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Object.keys(ranks).map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                selectedCategory === category
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {ranks[selectedCategory as keyof typeof ranks].map((rank) => (
              <button
                key={rank}
                onClick={() => handleRankSelect(rank)}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  selectedRank === rank
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {rank}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedRank}
          className={`px-6 py-2 rounded-lg transition-colors ${
            selectedRank
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
} 