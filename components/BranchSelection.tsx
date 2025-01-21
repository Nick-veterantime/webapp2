import React from 'react';
import { useRouter } from 'next/navigation';

interface BranchSelectionProps {
  onBranchSelect: (branch: string) => void;
}

const branches = [
  { name: 'Army', id: 'army' },
  { name: 'Navy', id: 'navy' },
  { name: 'Air Force', id: 'air-force' },
  { name: 'Marines', id: 'marines' },
  { name: 'Coast Guard', id: 'coast-guard' },
  { name: 'Space Force', id: 'space-force' },
];

export const BranchSelection: React.FC<BranchSelectionProps> = ({ onBranchSelect }) => {
  const router = useRouter();

  const handleLearnMore = () => {
    window.open('https://veterantimeline.com/#about', '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <div className="max-w-4xl w-full bg-navy-900/80 backdrop-blur-sm p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Begin Your Transition Journey
        </h1>
        <p className="text-xl text-center mb-4">
          Your path to civilian success starts here.
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
          Your Veteran Timeline
        </h2>
        <p className="text-lg text-center mb-8">
          A proven roadmap for your military transition.
        </p>
        <p className="text-xl text-center mb-8">
          Select your branch to begin
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => onBranchSelect(branch.id)}
              className="p-4 border-2 border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200 text-lg font-semibold"
            >
              {branch.name}
            </button>
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={handleLearnMore}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Learn more about Veteran Timeline
          </button>
        </div>
      </div>
    </div>
  );
};