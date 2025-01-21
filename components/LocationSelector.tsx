import React, { useState } from 'react';
import { states, State } from '@/lib/constants';

interface LocationSelectorProps {
  onSelect: (locationData: {
    preference: string;
    locationType?: 'CONUS' | 'OCONUS';
    location?: string;
    consideringAreas?: State[];
    additionalInfo?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function LocationSelector({ onSelect, onNext, onBack }: LocationSelectorProps) {
  const [preference, setPreference] = useState<string>('');
  const [locationType, setLocationType] = useState<'CONUS' | 'OCONUS' | undefined>(undefined);
  const [location, setLocation] = useState<string>('');
  const [consideringAreas, setConsideringAreas] = useState<State[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<string>('');

  const handlePreferenceSelect = (selectedPreference: string) => {
    setPreference(selectedPreference);
    if (selectedPreference === 'open to suggestions' || selectedPreference === 'not sure yet') {
      onSelect({ preference: selectedPreference });
      onNext();
    }
  };

  const handleSubmit = () => {
    onSelect({
      preference,
      locationType,
      location,
      consideringAreas,
      additionalInfo
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Where are you planning to live after transition?</h2>
        <p className="text-gray-400">
          This helps us provide location-specific resources and opportunities.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {[
            'I have a specific location in mind',
            'I\'m considering a few options',
            'I\'m open to suggestions',
            'I\'m not sure yet'
          ].map((option) => (
            <button
              key={option}
              onClick={() => handlePreferenceSelect(option.toLowerCase())}
              className={`p-4 text-left rounded-lg border transition-colors ${
                preference === option.toLowerCase()
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:border-gray-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {preference === 'i have a specific location in mind' && (
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Location Type</label>
              <div className="grid grid-cols-2 gap-3">
                {['CONUS', 'OCONUS'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setLocationType(type as 'CONUS' | 'OCONUS')}
                    className={`p-3 rounded-lg border transition-colors ${
                      locationType === type
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {locationType === 'CONUS' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select State</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a state</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            )}

            {locationType === 'OCONUS' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Enter Country</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter country name"
                  className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {preference === 'i\'m considering a few options' && (
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Areas you're considering</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {states.map((state) => (
                  <label
                    key={state}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-gray-700 bg-gray-800/80"
                  >
                    <input
                      type="checkbox"
                      checked={consideringAreas.includes(state as State)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConsideringAreas([...consideringAreas, state as State]);
                        } else {
                          setConsideringAreas(consideringAreas.filter(s => s !== state as State));
                        }
                      }}
                      className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">{state}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Additional Information</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Tell us more about the areas you're considering..."
                className="w-full p-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
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
        {(preference === 'i have a specific location in mind' || preference === 'i\'m considering a few options') && (
          <button
            onClick={handleSubmit}
            disabled={
              (preference === 'i have a specific location in mind' && (!locationType || !location)) ||
              (preference === 'i\'m considering a few options' && consideringAreas.length === 0)
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
} 