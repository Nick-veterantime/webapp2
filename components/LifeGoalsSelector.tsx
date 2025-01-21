import React, { useState } from 'react';

interface LifeGoalsSelectorProps {
  onSelect: (goal: string, educationLevel?: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function LifeGoalsSelector({ onSelect, onBack, onNext }: LifeGoalsSelectorProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('');

  const goals = [
    { id: 'Private Sector Job', label: 'Private Sector Job', description: 'Find employment in the private sector' },
    { id: 'Further Education', label: 'Further Education', description: 'Pursue additional education or certifications' },
    { id: 'Government/Federal Job', label: 'Government/Federal Job', description: 'Continue serving in a civilian role' },
    { id: 'Entrepreneurship', label: 'Entrepreneurship', description: 'Start your own business' },
    { id: 'Still Exploring', label: 'Still Exploring', description: 'Explore different opportunities' }
  ];

  const educationLevels = [
    { id: 'trade-school', label: 'Trade School', description: 'Vocational or technical training' },
    { id: 'undergrad', label: 'Undergraduate', description: 'Bachelor\'s degree' },
    { id: 'masters', label: 'Masters (MBA, JD, MD, etc.)', description: 'Advanced professional degree' },
    { id: 'phd', label: 'PhD', description: 'Doctoral degree' }
  ];

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    if (goalId !== 'Further Education') {
      onSelect(goalId);
    }
  };

  const handleEducationLevelSelect = (level: string) => {
    setEducationLevel(level);
    onSelect('Further Education', level);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">What are your post-military goals?</h2>
        <p className="text-gray-400">
          Select your primary goal to help us customize your transition timeline.
        </p>
      </div>

      {!selectedGoal || (selectedGoal === 'Further Education' && !educationLevel) ? (
        <div className="grid grid-cols-1 gap-3">
          {(selectedGoal !== 'Further Education' ? goals : educationLevels).map((item) => (
            <button
              key={item.id}
              onClick={() => selectedGoal === 'Further Education' ? handleEducationLevelSelect(item.id) : handleGoalSelect(item.id)}
              className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                (selectedGoal === item.id || educationLevel === item.id)
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col">
                <span className={`font-medium ${
                  (selectedGoal === item.id || educationLevel === item.id) ? 'text-blue-400' : 'text-white'
                }`}>
                  {item.label}
                </span>
                <span className="text-sm text-gray-400">{item.description}</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex justify-between mt-8">
        <button
          onClick={() => {
            if (selectedGoal === 'Further Education' && educationLevel) {
              setEducationLevel('');
            } else {
              setSelectedGoal('');
              setEducationLevel('');
              onBack();
            }
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {selectedGoal === 'Further Education' && educationLevel ? '← Change education level' : 'Back'}
        </button>
        {selectedGoal && selectedGoal !== 'Further Education' && (
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
} 