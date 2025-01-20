'use client'

import { useState, useEffect } from 'react';
import { Timeline } from '@/components/Timeline';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    branch: '',
    separationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    rankCategory: '',
    rank: '',
    jobCode: '',
    location: '',
    careerGoal: '',
    email: '',
    password: ''
  });

  // Track visibility states
  const [visibleTracks, setVisibleTracks] = useState({
    admin: false,
    mindset: false,
    health: false,
    job: false,
    misc: false
  });

  // Add state to track if onboarding is complete
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Begin Your Transition Journey",
      description: "Your path to civilian success starts here.",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-gray-100">Your Veteran Timeline</h1>
            <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
              A proven roadmap for your military transition.
            </p>
            <p className="text-xl text-gray-400 mt-2">
              Select your branch to begin
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force'].map((branch) => (
              <button
                key={branch}
                onClick={() => {
                  setFormData(prev => ({ ...prev, branch }));
                  setVisibleTracks(prev => ({ ...prev, admin: true }));
                  setCurrentStep(1);
                }}
                className={`p-6 rounded-lg border ${
                  formData.branch === branch 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                } transition-colors`}
              >
                <p className="text-lg font-medium text-gray-200">{branch}</p>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "When Are You Separating?",
      description: "Select your expected separation date.",
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
              <select 
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                value={formData.separationDate.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(formData.separationDate);
                  newDate.setFullYear(parseInt(e.target.value));
                  setFormData(prev => ({ ...prev, separationDate: newDate }));
                }}
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Month</label>
              <select 
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                value={formData.separationDate.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(formData.separationDate);
                  newDate.setMonth(parseInt(e.target.value));
                  setFormData(prev => ({ ...prev, separationDate: newDate }));
                }}
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                  .map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Day</label>
              <select 
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                value={formData.separationDate.getDate()}
                onChange={(e) => {
                  const newDate = new Date(formData.separationDate);
                  newDate.setDate(parseInt(e.target.value));
                  setFormData(prev => ({ ...prev, separationDate: newDate }));
                }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => {
              setVisibleTracks(prev => ({ ...prev, mindset: true }));
              setCurrentStep(2);
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Continue
          </button>
        </div>
      )
    },
    {
      id: 3,
      title: "What's Your Rank?",
      description: "Select your rank category and specific rank.",
      component: (
        <div className="space-y-6">
          {/* Rank Category Selection */}
          <div className="grid grid-cols-3 gap-4">
            {['Enlisted', 'Officer', 'Warrant Officer'].map((category) => (
              <button
                key={category}
                onClick={() => setFormData(prev => ({ ...prev, rankCategory: category, rank: '' }))}
                className={`p-4 rounded-lg border ${
                  formData.rankCategory === category 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                } transition-colors text-center`}
              >
                <p className="text-lg font-medium text-gray-200">{category}</p>
              </button>
            ))}
          </div>

          {/* Specific Rank Selection - Only shown after category is selected */}
          {formData.rankCategory && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">Select Your Specific Rank</label>
              <div className="grid grid-cols-3 gap-3">
                {formData.rankCategory === 'Enlisted' && 
                  ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9'].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setFormData(prev => ({ ...prev, rank }))}
                      className={`p-3 rounded-lg border ${
                        formData.rank === rank 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <p className="text-base font-medium text-gray-200">{rank}</p>
                    </button>
                  ))
                }
                {formData.rankCategory === 'Officer' && 
                  ['O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setFormData(prev => ({ ...prev, rank }))}
                      className={`p-3 rounded-lg border ${
                        formData.rank === rank 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <p className="text-base font-medium text-gray-200">{rank}</p>
                    </button>
                  ))
                }
                {formData.rankCategory === 'Warrant Officer' && 
                  ['W-1', 'W-2', 'W-3', 'W-4', 'W-5'].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setFormData(prev => ({ ...prev, rank }))}
                      className={`p-3 rounded-lg border ${
                        formData.rank === rank 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <p className="text-base font-medium text-gray-200">{rank}</p>
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Job Code Input - Only shown after rank is selected */}
          {formData.rank && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {formData.branch === 'Air Force' ? 'Air Force Specialty Code' :
                 formData.branch === 'Navy' ? (formData.rankCategory === 'Warrant Officer' || formData.rank?.startsWith('O') ? 'Designator' : 'Rating') :
                 formData.branch === 'Army' && formData.rankCategory === 'Warrant Officer' ? 'Warrant Officer Military Occupational Specialty (WOMOS)' :
                 formData.branch === 'Coast Guard' && formData.rankCategory === 'Warrant Officer' ? 'Specialty' :
                 formData.branch === 'Coast Guard' ? 'Rating' :
                 formData.branch === 'Space Force' ? 'Space Force Specialty Code' :
                 'Military Occupational Specialty (MOS)'}
              </label>
              <input
                type="text"
                value={formData.jobCode || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, jobCode: e.target.value }))}
                placeholder="Enter your code"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
              />
            </div>
          )}

          {/* Continue Button - Only enabled when both rank and job code are selected */}
          <button
            onClick={() => {
              if (formData.rank && formData.jobCode) {
                setVisibleTracks(prev => ({ ...prev, health: true }));
                setCurrentStep(3);
              }
            }}
            disabled={!formData.rank || !formData.jobCode}
            className={`w-full py-3 rounded-lg transition-colors ${
              formData.rank && formData.jobCode
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      )
    },
    {
      id: 4,
      title: "Where Are You Planning to Live?",
      description: "Select your post-military location.",
      component: (
        <div className="space-y-4">
          {['Stay Current Location', 'Return to Home of Record', 'New Location', 'Undecided'].map((location) => (
            <button
              key={location}
              onClick={() => {
                setFormData(prev => ({ ...prev, location }));
                setCurrentStep(4);
              }}
              className={`w-full p-4 rounded-lg border ${
                formData.location === location 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              } transition-colors text-left`}
            >
              <p className="text-lg font-medium text-gray-200">{location}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 5,
      title: "What Are Your Career Goals?",
      description: "Select your primary post-military career goal.",
      component: (
        <div className="space-y-4">
          {['Further Education', 'Private Sector Job', 'Government/Federal Job', 'Entrepreneurship', 'Undecided'].map((goal) => (
            <button
              key={goal}
              onClick={() => {
                setFormData(prev => ({ ...prev, careerGoal: goal }));
                setVisibleTracks(prev => ({ ...prev, job: true }));
                setCurrentStep(5);
              }}
              className={`w-full p-4 rounded-lg border ${
                formData.careerGoal === goal 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              } transition-colors text-left`}
            >
              <p className="text-lg font-medium text-gray-200">{goal}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 6,
      title: "View Your Timeline",
      description: "Your personalized military transition timeline is ready.",
      component: (
        <div className="space-y-6">
          <button
            onClick={() => {
              setVisibleTracks(prev => ({ ...prev, misc: true }));
              setIsOnboardingComplete(true);
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            View Timeline
          </button>
        </div>
      )
    }
  ];

  // If onboarding is complete, show only the timeline
  if (isOnboardingComplete) {
    return (
      <div className="min-h-screen bg-[#1A1B1E]">
        <Timeline 
          visibleTracks={visibleTracks}
          separationDate={formData.separationDate}
          userData={{
            branch: formData.branch,
            rankCategory: formData.rankCategory,
            rank: formData.rank,
            jobCode: formData.jobCode,
            location: formData.location,
            careerGoal: formData.careerGoal
          }}
          onUpdateUserData={(newData) => {
            setFormData(prev => ({
              ...prev,
              ...newData
            }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1B1E] relative">
      {/* Background Timeline */}
      <div className={`absolute inset-0 opacity-20 transition-opacity duration-500`}>
        <Timeline 
          visibleTracks={visibleTracks}
          separationDate={formData.separationDate}
          userData={{
            branch: formData.branch,
            rankCategory: formData.rankCategory,
            rank: formData.rank,
            jobCode: formData.jobCode,
            location: formData.location,
            careerGoal: formData.careerGoal
          }}
          onUpdateUserData={(newData) => {
            setFormData(prev => ({
              ...prev,
              ...newData
            }));
          }}
        />
      </div>

      {/* Centered Onboarding Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-900/95 p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-4">
          {/* Progress bar */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="mb-8">
              <div className="h-1 w-full bg-gray-800 rounded-full">
                <div 
                  className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / (steps.length - 2)) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">Step {currentStep} of {steps.length - 2}</p>
            </div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-100">{steps[currentStep].title}</h2>
                <p className="text-gray-400">{steps[currentStep].description}</p>
              </div>
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex justify-start mt-8">
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}