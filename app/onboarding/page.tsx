"use client";

export const dynamicRendering = 'force-dynamic';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Timeline } from '@/components/Timeline';
import { Metadata } from 'next';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    branch: '',
    separationDate: new Date(),
    rank: '',
    location: '',
    careerGoal: '',
    email: '',
    password: ''
  });

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to Veteran Timeline",
      description: "Let's start building your personal timeline. Answer a few quick questions to get started.",
      component: (
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-100">Welcome to Veteran Timeline</h1>
          <p className="text-xl text-gray-300">Your personalized military transition journey starts here.</p>
          <button
            onClick={() => setCurrentStep(1)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Get Started
          </button>
          <a href="#" className="block text-blue-400 hover:text-blue-300">Learn more about the app</a>
        </div>
      )
    },
    {
      id: 2,
      title: "Select Your Branch",
      description: "Which branch of the military are you serving in?",
      component: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force'].map((branch) => (
            <button
              key={branch}
              onClick={() => {
                setFormData(prev => ({ ...prev, branch }));
                setCurrentStep(2);
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
      )
    },
    {
      id: 3,
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
            onClick={() => setCurrentStep(3)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Continue
          </button>
        </div>
      )
    },
    {
      id: 4,
      title: "What's Your Rank?",
      description: "Select your current rank category.",
      component: (
        <div className="space-y-4">
          {['Enlisted', 'Officer', 'Warrant Officer'].map((rankType) => (
            <button
              key={rankType}
              onClick={() => {
                setFormData(prev => ({ ...prev, rank: rankType }));
                setCurrentStep(4);
              }}
              className={`w-full p-4 rounded-lg border ${
                formData.rank === rankType 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              } transition-colors text-left`}
            >
              <p className="text-lg font-medium text-gray-200">{rankType}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 5,
      title: "Where Are You Planning to Live?",
      description: "Select your post-military location.",
      component: (
        <div className="space-y-4">
          {['Stay Current Location', 'Return to Home of Record', 'New Location', 'Undecided'].map((location) => (
            <button
              key={location}
              onClick={() => {
                setFormData(prev => ({ ...prev, location }));
                setCurrentStep(5);
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
      id: 6,
      title: "What Are Your Career Goals?",
      description: "Select your primary post-military career goal.",
      component: (
        <div className="space-y-4">
          {['Further Education', 'Private Sector Job', 'Government/Federal Job', 'Entrepreneurship', 'Undecided'].map((goal) => (
            <button
              key={goal}
              onClick={() => {
                setFormData(prev => ({ ...prev, careerGoal: goal }));
                setCurrentStep(6);
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
      id: 7,
      title: "Create Your Account",
      description: "Save your timeline and get started.",
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                placeholder="Create a password"
              />
            </div>
          </div>
          <button
            onClick={() => {
              // Handle account creation and redirect to timeline
              console.log('Create account with:', formData);
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Create Account & View Timeline
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#1A1B1E]">
      <div className="max-w-4xl mx-auto px-4 py-12">
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Skip
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Preview Timeline */}
        {currentStep > 0 && (
          <div className="mt-12 opacity-50">
            <Timeline />
          </div>
        )}
      </div>
    </div>
  );
} 