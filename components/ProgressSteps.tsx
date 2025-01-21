import React from 'react';

interface ProgressStepsProps {
  currentStep: number;
  steps: Array<{
    id: number;
    label: string;
  }>;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-1/2" />
        
        {/* Progress Bar Fill */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((step) => (
          <div
            key={step.id}
            className={`relative flex flex-col items-center ${
              step.id <= currentStep ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10 ${
                step.id <= currentStep
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-700 bg-gray-900 text-gray-500'
              }`}
            >
              {step.id}
            </div>
            <span className="absolute top-10 text-sm font-medium whitespace-nowrap">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}; 