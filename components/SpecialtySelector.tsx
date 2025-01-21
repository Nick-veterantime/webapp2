import React, { useState } from 'react';

interface SpecialtySelectorProps {
  branch: string;
  paygrade: string;
  onSelect: (specialty: string) => void;
  onNext: () => void;
  onBack: () => void;
}

type RankCategory = 'enlisted' | 'officer' | 'warrant-officer';
type BranchTerminology = {
  [key in RankCategory]?: string;
};

const specialtyTerminology: Record<string, BranchTerminology> = {
  army: {
    enlisted: 'MOS',
    officer: 'AOC',
    'warrant-officer': 'WOMOS'
  },
  navy: {
    enlisted: 'Rating',
    officer: 'Designator',
    'warrant-officer': 'Designator'
  },
  'air-force': {
    enlisted: 'AFSC',
    officer: 'AFSC'
  },
  marines: {
    enlisted: 'MOS',
    officer: 'MOS'
  },
  'coast-guard': {
    enlisted: 'Rating',
    officer: 'Designator',
    'warrant-officer': 'Specialty'
  },
  'space-force': {
    enlisted: 'SFSC',
    officer: 'SFSC'
  }
};

export function SpecialtySelector({ branch, paygrade, onSelect, onNext, onBack }: SpecialtySelectorProps) {
  const [specialty, setSpecialty] = useState('');

  const getRankCategory = (paygrade: string): RankCategory => {
    if (paygrade.startsWith('E')) return 'enlisted';
    if (paygrade.startsWith('O')) return 'officer';
    if (paygrade.startsWith('W')) return 'warrant-officer';
    return 'enlisted';
  };

  const getSpecialtyTerm = () => {
    const rankCategory = getRankCategory(paygrade);
    const branchTerms = specialtyTerminology[branch] || {};
    return branchTerms[rankCategory] || 'Specialty Code';
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSpecialty(value);
  };

  const handleNext = () => {
    if (specialty.trim()) {
      onSelect(specialty);
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <input
          type="text"
          value={specialty}
          onChange={handleSpecialtyChange}
          placeholder={`Enter your ${getSpecialtyTerm()}`}
          className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!specialty.trim()}
          className={`px-6 py-2 rounded-lg transition-colors ${
            specialty.trim()
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