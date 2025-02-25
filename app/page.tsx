'use client';

export const dynamicRendering = 'force-dynamic';

import { useState, useEffect } from 'react';
import { BranchSelection } from '@/components/BranchSelection';
import { AuthForm } from '@/components/AuthForm';
import { Timeline } from '@/components/Timeline';
import { ProgressSteps } from '@/components/ProgressSteps';
import { SeparationDatePicker } from '@/components/SeparationDatePicker';
import { PaygradeSelector } from '@/components/PaygradeSelector';
import { LifeGoalsSelector } from '@/components/LifeGoalsSelector';
import { SpecialtySelector } from '@/components/SpecialtySelector';
import { SignIn } from '@/components/SignIn';
import { useRouter } from 'next/navigation';
import { updateUserData } from '@/lib/user-data';
import { toast } from 'sonner';
import { LocationSelector } from '@/components/LocationSelector';
import { State, states } from '@/lib/constants';
import dynamic from 'next/dynamic';

// Dynamically import Timeline with no SSR
const DynamicTimeline = dynamic(() => import('@/components/Timeline').then(mod => ({ default: mod.Timeline })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
});

interface UserData {
  branch: string;
  rankCategory: string;
  rank: string;
  jobCode: string;
  location: string;
  careerGoal: string;
  educationLevel?: string;
  locationPreference: string;
  separationDate: string;
}

interface Branch {
  name: string;
  id: string;
}

const branches: Branch[] = [
  { name: 'Army', id: 'army' },
  { name: 'Navy', id: 'navy' },
  { name: 'Air Force', id: 'air-force' },
  { name: 'Marines', id: 'marines' },
  { name: 'Coast Guard', id: 'coast-guard' },
  { name: 'Space Force', id: 'space-force' },
];

const steps = [
  { id: 1, label: 'Start' },
  { id: 2, label: 'Branch' },
  { id: 3, label: 'Separation Date' },
  { id: 4, label: 'Paygrade' },
  { id: 5, label: 'Specialty' },
  { id: 6, label: 'Location' },
  { id: 7, label: 'Life Goals' },
  { id: 8, label: 'Account' },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [separationDate, setSeparationDate] = useState<Date>(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [paygrade, setPaygrade] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [lifeGoal, setLifeGoal] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    branch: '',
    rankCategory: '',
    rank: '',
    jobCode: '',
    locationPreference: 'not sure yet',
    location: '',
    careerGoal: '',
    separationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
  });
  const [locationData, setLocationData] = useState<{
    preference: string;
    locationType?: 'CONUS' | 'OCONUS';
    location?: string;
    consideringAreas?: State[];
    additionalInfo?: string;
  } | null>(null);
  const router = useRouter();

  // Default timeline data for the landing page
  const defaultTimelineData = {
    branch: 'Army',
    separationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    visibleTracks: {
      admin: true,
      mindset: true,
      health: true,
      job: true,
      misc: true
    },
    userData: {
      branch: 'Army',
      rankCategory: 'Officer',
      rank: 'O-3',
      jobCode: '11A',
      location: 'Current Location',
      careerGoal: 'Private Sector Job',
      locationPreference: 'Stay Current Location',
      separationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
    } as UserData
  };

  // Empty timeline data for the onboarding background
  const getOnboardingTimelineData = () => {
    const visibleTracks = {
      mindset: currentStep >= 2, // Show after branch selection
      admin: currentStep >= 4,   // Show after paygrade selection
      health: currentStep >= 6,  // Show after location selection
      job: currentStep >= 7,     // Show after life goals selection
      misc: false
    };

    return {
      branch: selectedBranch || '',
      separationDate,
      visibleTracks,
      userData: {
        branch: selectedBranch || '',
        rankCategory: paygrade.startsWith('E') ? 'Enlisted' : 
                     paygrade.startsWith('W') ? 'Warrant Officer' : 
                     paygrade.startsWith('O') ? 'Officer' : '',
        rank: paygrade,
        jobCode: specialty,
        location: locationData?.location || '',
        careerGoal: lifeGoal,
        locationPreference: locationData?.preference || '',
        separationDate: separationDate.toISOString()
      } as UserData
    };
  };

  const handleBranchSelect = (branch: string) => {
    setSelectedBranch(branch);
    setUserData(prev => ({
      ...prev,
      branch,
    }));
    setCurrentStep(3);
  };

  const handleDateSelect = (date: Date) => {
    setSeparationDate(date);
    setUserData(prev => ({
      ...prev,
      separationDate: date.toISOString(),
    }));
    setCurrentStep(4);
  };

  const handlePaygradeSelect = (selectedPaygrade: string) => {
    setPaygrade(selectedPaygrade);
    setUserData(prev => ({
      ...prev,
      rank: selectedPaygrade,
      rankCategory: selectedPaygrade.startsWith('E') ? 'Enlisted' : 
                   selectedPaygrade.startsWith('W') ? 'Warrant Officer' : 
                   selectedPaygrade.startsWith('O') ? 'Officer' : '',
    }));
    setCurrentStep(5);
  };

  const handleSpecialtySelect = (selectedSpecialty: string) => {
    setSpecialty(selectedSpecialty);
    setUserData(prev => ({
      ...prev,
      jobCode: selectedSpecialty,
    }));
    setCurrentStep(6);
  };

  const handleLocationSelect = (data: {
    preference: string;
    locationType?: 'CONUS' | 'OCONUS';
    location?: string;
    consideringAreas?: State[];
    additionalInfo?: string;
  }) => {
    setLocationData(data);
    setUserData(prev => ({
      ...prev,
      locationPreference: data.preference,
      locationType: data.locationType,
      location: data.location || '',
      consideringAreas: data.consideringAreas,
      locationAdditionalInfo: data.additionalInfo,
    }));
    setCurrentStep(7);
  };

  const handleLifeGoalSelect = (selectedGoal: string, selectedEducationLevel?: string) => {
    setLifeGoal(selectedGoal);
    if (selectedEducationLevel) {
      setEducationLevel(selectedEducationLevel);
    }
    setUserData(prev => ({
      ...prev,
      careerGoal: selectedGoal,
      educationLevel: selectedEducationLevel,
    }));
    setCurrentStep(8);
  };

  const handleAuthComplete = async () => {
    try {
      // Save all user data after successful authentication
      const finalData = {
        ...userData,
        branch: selectedBranch || '',
        rankCategory: paygrade.startsWith('E') ? 'Enlisted' : 
                     paygrade.startsWith('W') ? 'Warrant Officer' : 
                     paygrade.startsWith('O') ? 'Officer' : '',
        rank: paygrade,
        jobCode: specialty,
        locationPreference: locationData?.preference || 'not sure yet',
        locationType: locationData?.locationType,
        location: locationData?.location || '',
        consideringAreas: locationData?.consideringAreas,
        locationAdditionalInfo: locationData?.additionalInfo,
        careerGoal: lifeGoal,
        educationLevel: educationLevel || undefined,
        separationDate: separationDate.toISOString(),
      };
      await updateUserData(finalData);
      
      router.push('/timeline');
    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error('Failed to save your preferences');
    }
  };

  const handleLearnMore = () => {
    window.open('https://veterantimeline.com/#about', '_blank');
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  if (showSignIn) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
        <SignIn />
        <button
          onClick={() => setShowSignIn(false)}
          className="mt-4 text-gray-400 hover:text-white transition-colors"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Timeline */}
      <div className="absolute inset-0 -z-10 hidden sm:block">
        <div className={`transition-opacity duration-500 ${currentStep > 1 ? 'opacity-20' : 'opacity-40'}`}>
          <DynamicTimeline 
            visibleTracks={currentStep > 1 ? getOnboardingTimelineData().visibleTracks : defaultTimelineData.visibleTracks}
            separationDate={currentStep > 1 ? getOnboardingTimelineData().separationDate : defaultTimelineData.separationDate}
            userData={currentStep > 1 ? getOnboardingTimelineData().userData : defaultTimelineData.userData}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20">
        {currentStep === 1 ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 text-white">
            <div className="w-full max-w-5xl">
              <div className="bg-gradient-to-b from-[#1a1a1a]/80 to-[#121212]/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
                <div className="flex flex-col items-center space-y-8">
                  {/* Logo and Headline Section */}
                  <div className="text-center space-y-6 w-full max-w-3xl">
                    <div className="relative flex justify-center items-center">
                      <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 to-transparent blur-3xl transform scale-150"></div>
                      <img 
                        src="/veteran-timeline-logo.png" 
                        alt="Veteran Timeline" 
                        className="h-[56px] sm:h-[72px] relative z-10" 
                      />
                    </div>
                    
                    <p className="text-xl sm:text-2xl text-blue-400 font-semibold leading-relaxed px-4">
                      Don't miss a step in your military transition journey
                    </p>
                  </div>

                  {/* Main Value Proposition */}
                  <div className="text-center max-w-2xl px-4">
                    <p className="text-base sm:text-lg text-gray-300">
                      Your personalized roadmap to a successful transition, with proven milestones and resources tailored to your unique journey.
                    </p>
                  </div>

                  {/* Value Propositions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/10 transform transition-all duration-300 hover:scale-105 hover:bg-white/10">
                      <div className="text-blue-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mb-1 text-center">Complete Checklist</h3>
                      <p className="text-xs sm:text-sm text-gray-400 text-center">Never miss critical deadlines or requirements</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/10 transform transition-all duration-300 hover:scale-105 hover:bg-white/10">
                      <div className="text-blue-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mb-1 text-center">Maximum Benefits</h3>
                      <p className="text-xs sm:text-sm text-gray-400 text-center">Discover every resource available</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/10 transform transition-all duration-300 hover:scale-105 hover:bg-white/10">
                      <div className="text-blue-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mb-1 text-center">Save Time</h3>
                      <p className="text-xs sm:text-sm text-gray-400 text-center">Access resources when needed</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/10 transform transition-all duration-300 hover:scale-105 hover:bg-white/10">
                      <div className="text-blue-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mb-1 text-center">Personalized Path</h3>
                      <p className="text-xs sm:text-sm text-gray-400 text-center">Tailored to your journey</p>
                    </div>
                  </div>

                  {/* Action and Trust Section */}
                  <div className="flex flex-col space-y-8 md:flex-row md:space-y-0 items-center justify-between w-full gap-4 mt-4">
                    {/* CTA */}
                    <div className="w-full md:max-w-sm">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="w-full bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-500 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
                      >
                        Build Your Timeline
                      </button>
                      
                      <div className="text-center mt-3">
                        <button
                          onClick={() => setShowSignIn(true)}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          Already have a timeline? Sign in →
                        </button>
                      </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="w-full md:flex-1">
                      <p className="text-gray-400 text-sm mb-3 text-center md:text-right">Trusted by veterans from all branches</p>
                      <div className="flex flex-wrap justify-center md:justify-end gap-2">
                        {branches.map((branch) => (
                          <div 
                            key={branch.id} 
                            className="text-gray-500 text-xs bg-white/5 px-3 py-1 rounded-full whitespace-nowrap"
                          >
                            {branch.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
            {/* Progress Steps - Simplified for Mobile */}
            <div className="w-full max-w-4xl mb-6">
              <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-lg p-4">
                <div className="hidden md:block">
                  <ProgressSteps currentStep={currentStep} steps={steps} />
                </div>
                {/* Mobile Progress Indicator */}
                <div className="md:hidden flex items-center justify-between px-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400 font-medium">Step {currentStep}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-400">8</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {steps.find(step => step.id === currentStep)?.label}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="max-w-4xl w-full">
              <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl p-4 sm:p-8 shadow-2xl border border-white/10">
                {currentStep === 2 && (
                  <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4">
                      Let's Personalize Your Timeline
                    </h1>
                    <p className="text-lg sm:text-xl text-center mb-8 text-gray-300">
                      Each branch has unique requirements and timelines. Select yours to get started.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
                      {branches.map((branch) => (
                        <button
                          key={branch.id}
                          onClick={() => handleBranchSelect(branch.id)}
                          className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                        >
                          {branch.name}
                        </button>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <button
                        onClick={handleLearnMore}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                      >
                        Learn more about how Veteran Timeline works →
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="max-w-xl mx-auto">
                    <SeparationDatePicker 
                      date={separationDate}
                      onChange={setSeparationDate}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
                      What is your paygrade?
                    </h2>
                    <p className="text-center text-gray-300 mb-6">
                      Select your current rank to help personalize your timeline.
                    </p>
                    
                    {!paygrade ? (
                      // Category Selection
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {['Enlisted', 'Warrant Officer', 'Officer'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              if (type === 'Enlisted') {
                                setPaygrade('E');
                              } else if (type === 'Warrant Officer') {
                                setPaygrade('W');
                              } else {
                                setPaygrade('O');
                              }
                            }}
                            className="flex items-center justify-center min-h-[60px] p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    ) : (
                      // Specific Paygrade Selection
                      <div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          {paygrade.startsWith('E') && 
                            Array.from({ length: 9 }, (_, i) => (
                              <button
                                key={`E-${i + 1}`}
                                onClick={() => {
                                  handlePaygradeSelect(`E-${i + 1}`);
                                }}
                                className="flex items-center justify-center min-h-[60px] p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                              >
                                E-{i + 1}
                              </button>
                            ))
                          }
                          {paygrade.startsWith('W') && 
                            Array.from({ length: 5 }, (_, i) => (
                              <button
                                key={`W-${i + 1}`}
                                onClick={() => {
                                  handlePaygradeSelect(`W-${i + 1}`);
                                }}
                                className="flex items-center justify-center min-h-[60px] p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                              >
                                W-{i + 1}
                              </button>
                            ))
                          }
                          {paygrade.startsWith('O') && 
                            Array.from({ length: 10 }, (_, i) => (
                              <button
                                key={`O-${i + 1}`}
                                onClick={() => {
                                  handlePaygradeSelect(`O-${i + 1}`);
                                }}
                                className="flex items-center justify-center min-h-[60px] p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                              >
                                O-{i + 1}
                              </button>
                            ))
                          }
                        </div>
                        <button
                          onClick={() => setPaygrade('')}
                          className="mt-4 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          ← Change rank category
                        </button>
                      </div>
                    )}
                    
                    <div className="flex justify-start mt-8">
                      <button
                        onClick={handleBack}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
                      What is your specialty?
                    </h2>
                    <p className="text-center text-gray-300 mb-6">
                      Enter your specialty code to help us tailor your timeline.
                    </p>
                    <SpecialtySelector 
                      branch={selectedBranch || ''} 
                      paygrade={paygrade}
                      onSelect={handleSpecialtySelect}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
                      Where do you want to be post-service?
                    </h2>
                    <p className="text-center text-gray-300 mb-6">
                      We'll customize your timeline with location-specific resources and opportunities.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        'I have a specific location in mind',
                        'I\'m considering a few options',
                        'I\'m open to suggestions',
                        'I\'m not sure yet'
                      ].map((option) => (
                        <button
                          key={option}
                          onClick={() => setLocationData({ 
                            preference: option.toLowerCase(),
                            consideringAreas: []
                          })}
                          className={`p-4 text-left rounded-lg border transition-colors ${
                            locationData?.preference === option.toLowerCase()
                              ? 'border-blue-500 bg-blue-500/10 text-white'
                              : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {locationData?.preference === 'i have a specific location in mind' && (
                      <div className="space-y-4 mt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Location Type</label>
                          <div className="grid grid-cols-2 gap-3">
                            {['CONUS', 'OCONUS'].map((type) => (
                              <button
                                key={type}
                                onClick={() => setLocationData({
                                  ...locationData,
                                  locationType: type as 'CONUS' | 'OCONUS'
                                })}
                                className={`p-3 rounded-lg border transition-colors ${
                                  locationData?.locationType === type
                                    ? 'border-blue-500 bg-blue-500/10 text-white'
                                    : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:border-gray-600'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {locationData?.locationType === 'CONUS' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Select State</label>
                            <select
                              value={locationData?.location || ''}
                              onChange={(e) => setLocationData({
                                ...locationData,
                                location: e.target.value
                              })}
                              className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select a state</option>
                              {states.map((state) => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {locationData?.locationType === 'OCONUS' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Enter Country</label>
                            <input
                              type="text"
                              value={locationData?.location || ''}
                              onChange={(e) => setLocationData({
                                ...locationData,
                                location: e.target.value
                              })}
                              placeholder="Enter country name"
                              className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {locationData?.preference === 'i\'m considering a few options' && (
                      <div className="space-y-4 mt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Select states you're considering</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {states.map((state) => (
                              <label
                                key={state}
                                className="flex items-center space-x-2 p-2 rounded-lg border border-gray-700 bg-gray-800/80"
                              >
                                <input
                                  type="checkbox"
                                  checked={locationData?.consideringAreas?.includes(state as State)}
                                  onChange={(e) => {
                                    const areas = locationData?.consideringAreas || [];
                                    if (e.target.checked) {
                                      setLocationData({
                                        ...locationData,
                                        consideringAreas: [...areas, state as State]
                                      });
                                    } else {
                                      setLocationData({
                                        ...locationData,
                                        consideringAreas: areas.filter(s => s !== state as State)
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-300">{state}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between mt-8">
                      <button
                        onClick={handleBack}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Back
                      </button>
                      {locationData && (
                        <button
                          onClick={() => handleLocationSelect(locationData)}
                          disabled={
                            (locationData.preference === 'i have a specific location in mind' && (!locationData.locationType || !locationData.location)) ||
                            (locationData.preference === 'i\'m considering a few options' && (!locationData.consideringAreas || locationData.consideringAreas.length === 0))
                          }
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <LifeGoalsSelector
                    onSelect={handleLifeGoalSelect}
                    onNext={() => {}}
                    onBack={handleBack}
                  />
                )}

                {currentStep === 8 && (
                  <div className="max-w-md mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-2">
                      Create Your Account
                    </h2>
                    <p className="text-center text-gray-300 mb-6">
                      Your personalized timeline is just moments away.
                    </p>
                    <AuthForm 
                      onComplete={handleAuthComplete} 
                      userData={{
                        branch: selectedBranch || '',
                        rankCategory: paygrade.startsWith('E') ? 'Enlisted' : 
                                     paygrade.startsWith('W') ? 'Warrant Officer' : 
                                     paygrade.startsWith('O') ? 'Officer' : '',
                        rank: paygrade,
                        jobCode: specialty,
                        locationPreference: locationData?.preference || '',
                        locationType: locationData?.locationType,
                        location: locationData?.location,
                        consideringAreas: locationData?.consideringAreas,
                        locationAdditionalInfo: locationData?.additionalInfo,
                        careerGoal: lifeGoal,
                        educationLevel: educationLevel,
                        separationDate: separationDate.toISOString(),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}