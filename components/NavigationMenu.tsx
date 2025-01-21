import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getUserData, updateUserData, UserData } from '@/lib/firebase-user';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { states, State } from '@/lib/constants';
import { TimelineBarData } from './TimelineBar';
import { ShareTimeline } from './ShareTimeline';

interface NavigationMenuProps {
  userData?: UserData;
  onUpdateUserData?: (newData: UserData) => void;
  timelineBars?: TimelineBarData[];
  onUpdateTimelineBars?: (bars: TimelineBarData[]) => void;
  separationDate?: Date;
  showMobileMenu?: boolean;
}

export function NavigationMenu({ 
  userData: propUserData, 
  onUpdateUserData,
  timelineBars,
  onUpdateTimelineBars,
  separationDate,
  showMobileMenu = false
}: NavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPersonalizationDialog, setShowPersonalizationDialog] = useState(false);
  const [showTimelineBarsDialog, setShowTimelineBarsDialog] = useState(false);
  const [editingUserData, setEditingUserData] = useState<UserData | undefined>(propUserData);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    propUserData?.separationDate ? new Date(propUserData.separationDate) : new Date()
  );
  const router = useRouter();

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        if (data) {
          setEditingUserData(data);
          onUpdateUserData?.(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (auth.currentUser) {
      fetchUserData();
    }
  }, [onUpdateUserData]);

  // Update local state when prop changes
  useEffect(() => {
    setEditingUserData(propUserData);
    if (propUserData?.separationDate) {
      setSelectedDate(new Date(propUserData.separationDate));
    }
  }, [propUserData]);

  // Update selectedDate when editingUserData changes
  useEffect(() => {
    if (editingUserData?.separationDate) {
      setSelectedDate(new Date(editingUserData.separationDate));
    }
  }, [editingUserData?.separationDate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateEditingUserData = (field: keyof UserData, value: any) => {
    setEditingUserData(prev => prev ? {
      ...prev,
      [field]: value
    } : undefined);
  };

  const handleSaveChanges = async () => {
    if (!editingUserData) return;

    setIsSaving(true);
    try {
      // Ensure we have the latest separation date
      const updatedUserData = {
        ...editingUserData,
        separationDate: selectedDate.toISOString()
      };

      // Save to Firebase
      await updateUserData(updatedUserData);
      
      // Update parent components
      onUpdateUserData?.(updatedUserData);
      
      setShowPersonalizationDialog(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2024, i, 1);
    return {
      value: i,
      label: format(date, 'MMMM')
    };
  });
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(e.target.value));
    handleDateSelect(newDate);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(e.target.value));
    handleDateSelect(newDate);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(parseInt(e.target.value));
    handleDateSelect(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (editingUserData) {
      const updatedUserData = {
        ...editingUserData,
        separationDate: date.toISOString()
      };
      setEditingUserData(updatedUserData);
      // Immediately update the parent component to trigger timeline refresh
      onUpdateUserData?.(updatedUserData);
    }
  };

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1a1a1a] ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => {
                setShowTimelineBarsDialog(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2a2a2a] transition-colors"
              role="menuitem"
            >
              Edit Timeline Bars
            </button>
            <button
              onClick={() => {
                setShowPersonalizationDialog(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2a2a2a] transition-colors"
              role="menuitem"
            >
              Personalization Settings
            </button>
            {showMobileMenu && (
              <>
                <div className="md:hidden">
                  {separationDate && timelineBars && (
                    <div className="px-4 py-2">
                      <ShareTimeline 
                        separationDate={separationDate}
                        bars={timelineBars}
                      />
                    </div>
                  )}
                  <div className="px-4 py-2 text-sm text-gray-300 border-t border-gray-800">
                    Have feedback? Book a chat with founder{' '}
                    <a 
                      href="https://www.linkedin.com/in/nicholas-co/" 
                      className="text-blue-400 hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Nick Co
                    </a>
                    {' '}→{' '}
                    <a 
                      href="https://cal.com/nickco/feedback"
                      className="text-blue-400 hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      here
                    </a>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2a2a2a] transition-colors border-t border-gray-800"
              role="menuitem"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Timeline Bars Dialog */}
      <Dialog open={showTimelineBarsDialog} onOpenChange={setShowTimelineBarsDialog}>
        <DialogContent className="bg-[#1A1B1E] text-gray-200 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-200">Edit Timeline Bars</DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage visibility and customize timeline bars
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {timelineBars?.filter(bar => bar.editable)
              .map(bar => (
                <div key={bar.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bar.color }}></div>
                      <h3 className="font-medium text-gray-200">{bar.name}</h3>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Start Days:</label>
                        <input
                          type="number"
                          value={bar.startDays}
                          onChange={(e) => onUpdateTimelineBars?.(
                            timelineBars.map(b => 
                              b.id === bar.id 
                                ? { ...b, startDays: parseInt(e.target.value) }
                                : b
                            )
                          )}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">End Days:</label>
                        <input
                          type="number"
                          value={bar.endDays}
                          onChange={(e) => onUpdateTimelineBars?.(
                            timelineBars.map(b => 
                              b.id === bar.id 
                                ? { ...b, endDays: parseInt(e.target.value) }
                                : b
                            )
                          )}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateTimelineBars?.(
                        timelineBars.map(b => 
                          b.id === bar.id 
                            ? { ...b, hidden: !b.hidden }
                            : b
                        )
                      )}
                      className={`h-8 px-3 text-sm font-medium rounded transition-all duration-200 border ${
                        bar.hidden
                          ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                          : 'border-blue-500/30 bg-blue-600/90 text-blue-50 hover:bg-blue-500/90'
                      }`}
                    >
                      {bar.hidden ? 'Show' : 'Hide'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Personalization Dialog */}
      <Dialog open={showPersonalizationDialog} onOpenChange={setShowPersonalizationDialog}>
        <DialogContent className="bg-[#1A1B1E] text-gray-200 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#1A1B1E] pt-6 pb-2 z-10 px-6 mr-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-200">Personalization Settings</DialogTitle>
              <DialogDescription className="text-gray-400">
                Review and update your transition preferences
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-6 px-6 pb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Separation Date</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Year
                    </label>
                    <select
                      value={selectedDate.getFullYear()}
                      onChange={handleYearChange}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Month
                    </label>
                    <select
                      value={selectedDate.getMonth()}
                      onChange={handleMonthChange}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Day
                    </label>
                    <select
                      value={selectedDate.getDate()}
                      onChange={handleDayChange}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Branch of Service</label>
                <select
                  value={editingUserData?.branch}
                  onChange={(e) => updateEditingUserData('branch', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  <option value="army">Army</option>
                  <option value="navy">Navy</option>
                  <option value="air-force">Air Force</option>
                  <option value="marines">Marines</option>
                  <option value="coast-guard">Coast Guard</option>
                  <option value="space-force">Space Force</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rank</label>
                <select
                  value={editingUserData?.rank}
                  onChange={(e) => {
                    const rank = e.target.value;
                    updateEditingUserData('rank', rank);
                    // Update rankCategory based on the selected rank
                    if (rank.startsWith('E')) {
                      updateEditingUserData('rankCategory', 'Enlisted');
                    } else if (rank.startsWith('W')) {
                      updateEditingUserData('rankCategory', 'Warrant Officer');
                    } else if (rank.startsWith('O')) {
                      updateEditingUserData('rankCategory', 'Officer');
                    }
                  }}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  <option value="">Select Rank</option>
                  <optgroup label="Enlisted">
                    {['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9'].map((rank) => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Warrant Officer">
                    {['W-1', 'W-2', 'W-3', 'W-4', 'W-5'].map((rank) => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Officer">
                    {['O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10'].map((rank) => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {editingUserData?.branch === 'Air Force' ? 'Air Force Specialty Code' :
                   editingUserData?.branch === 'Navy' ? (editingUserData?.rankCategory === 'Warrant Officer' || editingUserData?.rank?.startsWith('O') ? 'Designator' : 'Rating') :
                   editingUserData?.branch === 'Army' && editingUserData?.rankCategory === 'Warrant Officer' ? 'Warrant Officer Military Occupational Specialty (WOMOS)' :
                   editingUserData?.branch === 'Coast Guard' && editingUserData?.rankCategory === 'Warrant Officer' ? 'Specialty' :
                   editingUserData?.branch === 'Coast Guard' ? 'Rating' :
                   editingUserData?.branch === 'Space Force' ? 'Space Force Specialty Code' :
                   'Military Occupational Specialty (MOS)'}
                </label>
                <input
                  type="text"
                  value={editingUserData?.jobCode || ''}
                  onChange={(e) => updateEditingUserData('jobCode', e.target.value)}
                  placeholder="Enter your code"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Post-Military Location</label>
                <select
                  value={editingUserData?.locationPreference}
                  onChange={(e) => updateEditingUserData('locationPreference', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  <option value="i have a specific location in mind">I have a specific location in mind</option>
                  <option value="i'm considering a few options">I'm considering a few options</option>
                  <option value="i'm open to suggestions">I'm open to suggestions</option>
                  <option value="i'm not sure yet">I'm not sure yet</option>
                </select>

                {editingUserData?.locationPreference === 'i have a specific location in mind' && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Location Type</label>
                      <select
                        value={editingUserData?.locationType}
                        onChange={(e) => updateEditingUserData('locationType', e.target.value as 'CONUS' | 'OCONUS')}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                      >
                        <option value="">Select type</option>
                        <option value="CONUS">CONUS</option>
                        <option value="OCONUS">OCONUS</option>
                      </select>
                    </div>

                    {editingUserData?.locationType === 'CONUS' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
                        <select
                          value={editingUserData?.location}
                          onChange={(e) => updateEditingUserData('location', e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                        >
                          <option value="">Select state</option>
                          {states.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editingUserData?.locationType === 'OCONUS' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                        <input
                          type="text"
                          value={editingUserData?.location || ''}
                          onChange={(e) => updateEditingUserData('location', e.target.value)}
                          placeholder="Enter country name"
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}

                {editingUserData?.locationPreference === 'i\'m considering a few options' && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Areas you're considering</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {states.map((state) => (
                          <label
                            key={state}
                            className="flex items-center space-x-2 p-2 rounded-lg border border-gray-700 bg-gray-800/80"
                          >
                            <input
                              type="checkbox"
                              checked={editingUserData?.consideringAreas?.includes(state)}
                              onChange={(e) => {
                                const currentAreas = editingUserData?.consideringAreas || [];
                                if (e.target.checked) {
                                  updateEditingUserData('consideringAreas', [...currentAreas, state]);
                                } else {
                                  updateEditingUserData(
                                    'consideringAreas',
                                    currentAreas.filter(s => s !== state)
                                  );
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
                        value={editingUserData?.locationAdditionalInfo || ''}
                        onChange={(e) => updateEditingUserData('locationAdditionalInfo', e.target.value)}
                        placeholder="Tell us more about the areas you're considering..."
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 min-h-[100px]"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Career Goal</label>
                <select
                  value={editingUserData?.careerGoal}
                  onChange={(e) => updateEditingUserData('careerGoal', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  {['Further Education', 'Private Sector Job', 'Government/Federal Job', 'Entrepreneurship', 'Undecided'].map((goal) => (
                    <option key={goal} value={goal}>{goal}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPersonalizationDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 