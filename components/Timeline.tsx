'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SeparationDateInput } from './SeparationDateInput';
import { ShareTimeline } from './ShareTimeline';
import { NavigationMenu } from './NavigationMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { addMonths, format, subMonths, differenceInMonths } from 'date-fns';
import { TimelineBar, TimelineBarData } from './TimelineBar';
import { Brain, FileText, Stethoscope, Briefcase, MoreHorizontal, Share2, Lock } from 'lucide-react';
import { State } from '../lib/constants';
import { toast } from 'sonner';
import { PaywallModal } from './PaywallModal';
import { auth } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { TaskModal } from './TaskModal';
import { updateUserData, UserData } from '../lib/user-data';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  linkedText: string;
  link: string;
  description: string;
  trackIds: string[];
  whenMonthsLeft: number[];
  branchIds: string[];
}

interface UserInfo {
  userAgent: string;
  timestamp: string;
  source: string;
  anonymous: boolean;
  email?: string;
  userId?: string;
  [key: string]: any; // Allow additional properties
}

const tracks = ['Mindset', 'Admin', 'Health', 'Job', 'Misc'];
const monthsList = [60, 24, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const defaultBars: TimelineBarData[] = [
  {
    id: 'bdd',
    name: 'BDD',
    startDays: 180,
    endDays: 90,
    color: '#10B981',
    editable: false,
    row: 0
  },
  {
    id: 'disability',
    name: 'File Standard Disability',
    startDays: 90,
    endDays: 0,
    color: '#F59E0B',
    editable: false,
    row: 0
  },
  {
    id: 'terminal',
    name: 'Terminal Leave',
    startDays: 60,
    endDays: 0,
    color: '#8B5CF6',
    editable: true,
    row: 0
  },
  {
    id: 'work',
    name: 'Available to Start Work',
    startDays: 60,
    endDays: 0,
    color: '#EC4899',
    editable: true,
    row: 1
  },
  {
    id: 'skillbridge',
    name: 'SkillBridge',
    startDays: 180,
    endDays: 0,
    color: '#3B82F6',
    editable: true,
    row: 2
  }
];

const defaultTasks: Task[] = [
  {
    id: 'default-1',
    title: 'Begin Benefits Delivery at Discharge (BDD)',
    priority: 'medium',
    completed: false,
    linkedText: 'Learn more about BDD',
    link: 'https://www.va.gov/disability/how-to-file-claim/when-to-file/pre-discharge-claim/',
    description: 'Start your VA disability claim process',
    trackIds: ['Admin'],
    whenMonthsLeft: [6],
    branchIds: ['All']
  },
  {
    id: 'default-2',
    title: 'Schedule TAP Workshop',
    priority: 'medium',
    completed: false,
    linkedText: 'TAP Information',
    link: 'https://www.tapevents.org/courses',
    description: 'Mandatory transition workshop',
    trackIds: ['Admin'],
    whenMonthsLeft: [12],
    branchIds: ['All']
  },
  {
    id: 'default-3',
    title: 'Begin Job Search',
    priority: 'medium',
    completed: false,
    linkedText: 'Job Search Resources',
    link: 'https://www.dol.gov/agencies/vets',
    description: 'Start looking for post-service employment',
    trackIds: ['Job'],
    whenMonthsLeft: [12],
    branchIds: ['All']
  }
];

const getTrackIcon = (track: string) => {
  switch (track) {
    case 'Mindset':
      return <Brain className="w-4 h-4" />;
    case 'Admin':
      return <FileText className="w-4 h-4" />;
    case 'Health':
      return <Stethoscope className="w-4 h-4" />;
    case 'Job':
      return <Briefcase className="w-4 h-4" />;
    case 'Misc':
      return <MoreHorizontal className="w-4 h-4" />;
    default:
      return null;
  }
};

interface TimelineProps {
  visibleTracks?: {
    admin: boolean;
    mindset: boolean;
    health: boolean;
    job: boolean;
    misc: boolean;
  };
  separationDate?: Date;
  userData?: UserData;
  onUpdateUserData?: (newData: UserData) => void;
  isPremium?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({ 
  visibleTracks, 
  separationDate: propSeparationDate,
  userData,
  onUpdateUserData,
  isPremium = false
}) => {
  const searchParams = useSearchParams();
  const subscriptionAttemptRef = useRef<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [separationDate, setSeparationDate] = useState<Date>(propSeparationDate || new Date());
  const [timelineBars, setTimelineBars] = useState<TimelineBarData[]>([]);
  const [currentDate] = useState(new Date());
  const [isEditingBars, setIsEditingBars] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPersonalizationDialog, setShowPersonalizationDialog] = useState(false);
  const [editingUserData, setEditingUserData] = useState<UserData | undefined>(userData);
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    userData?.separationDate ? new Date(userData.separationDate) : new Date()
  );
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const resetSubscriptionState = useCallback(() => {
    console.log('Resetting subscription state completely');
    toast.dismiss('subscription');
    setIsLoading(false);
    subscriptionAttemptRef.current = false;
    
    if (isTaskModalOpen && searchParams.get('canceled') === 'true') {
      setTimeout(() => {
        setIsTaskModalOpen(false);
        setSelectedTask(null);
      }, 100);
    }
  }, [isTaskModalOpen, searchParams]);

  useEffect(() => {
    resetSubscriptionState();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible again, resetting subscription state');
        resetSubscriptionState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetSubscriptionState]);

  useEffect(() => {
    const canceled = searchParams.get('canceled');
    const success = searchParams.get('success');
    
    if (canceled === 'true') {
      console.log('User returned from Stripe after canceling');
      resetSubscriptionState();
      toast.info('Subscription process was canceled', { duration: 3000 });
    } else if (success === 'true') {
      console.log('User returned from Stripe after successful payment');
      resetSubscriptionState();
      toast.success('Thank you for subscribing!', { duration: 5000 });
    }
  }, [searchParams, resetSubscriptionState]);

  const handleSubscribe = async () => {
    // Prevent multiple clicks
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Create a short-lived toast that will be automatically dismissed
      // when redirect happens without needing to manually dismiss it
      toast.loading('Preparing checkout...', { 
        id: 'checkout',
        duration: 3000 // Auto-dismiss after 3 seconds if redirect doesn't happen
      });
      
      // Basic user info for tracking
      const userData: {
        timestamp: string;
        source: string;
        returnUrl: string;
        email?: string;
        userId?: string;
      } = {
        timestamp: new Date().toISOString(),
        source: 'timeline_component',
        returnUrl: window.location.href // Return to the current page
      };
      
      // Add auth data if available - but don't await this if it takes too long
      const authPromise = auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          userData.email = session.user.email;
          userData.userId = session.user.id;
        }
      }).catch(err => {
        console.warn('Could not get session data:', err);
        // Continue without auth data
      });
      
      // Set a timeout to ensure we don't wait too long for auth
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1000));
      
      // Wait for auth data but not more than 1 second
      await Promise.race([authPromise, timeoutPromise]);
      
      // Make the API request immediately
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      // Handle the response
      const result = await response.json();
      
      if (!response.ok) {
        // Log the detailed error for debugging
        console.error('API error response:', result);
        
        // Check if it's a server configuration error
        if (result.error && result.error.includes('configuration')) {
          throw new Error('Server configuration issue. Please contact support.');
        }
        
        // Check if it's a Stripe API error
        if (result.error && result.error.includes('Stripe error')) {
          throw new Error(result.error);
        }
        
        throw new Error(result.error || 'Failed to create checkout session');
      }
      
      if (!result.url) {
        throw new Error('No checkout URL received');
      }
      
      // Immediate redirect to Stripe without waiting
      toast.dismiss('checkout'); // Dismiss the loading toast
      toast.success('Redirecting to checkout...', { duration: 1500 });
      
      // Redirect with a very short timeout to allow the success toast to be seen briefly
      setTimeout(() => {
        window.location.href = result.url;
      }, 300);
      
    } catch (error) {
      console.error('Subscription error:', error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // More user-friendly error messages
      if (errorMessage.includes('configuration')) {
        errorMessage = 'Configuration issue. Our team has been notified.';
      } else if (errorMessage.includes('price')) {
        errorMessage = 'Pricing configuration issue. Our team has been notified.';
      }
      
      toast.error(`Checkout failed: ${errorMessage}`, { 
        id: 'checkout',
        duration: 5000
      });
      
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchTasks = async () => {
      try {
        // Check if we should fetch based on cache duration
        const now = Date.now();
        if (lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
          return;
        }

        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        
        if (mounted) {
          setTasks(data.length > 0 ? data : defaultTasks);
          setLastFetchTime(now);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        if (mounted) {
          setError('Failed to fetch tasks. Using default timeline.');
          setLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setTimelineBars(defaultBars);
  }, []);

  useEffect(() => {
    if (propSeparationDate) {
      setSeparationDate(propSeparationDate);
      setSelectedDate(propSeparationDate);
      
      setTimelineBars(prevBars => {
        return defaultBars.map(bar => {
          const existingBar = prevBars.find(existing => existing.id === bar.id);
          if (existingBar) {
            return {
              ...bar,
              hidden: existingBar.hidden,
              startDays: existingBar.startDays,
              endDays: existingBar.endDays
            };
          }
          return bar;
        });
      });
    }
  }, [propSeparationDate]);

  useEffect(() => {
    if (userData?.separationDate) {
      const newDate = new Date(userData.separationDate);
      setSeparationDate(newDate);
      setSelectedDate(newDate);
      
      // Reset timeline bars with default values when separation date changes
      setTimelineBars(defaultBars.map(bar => {
        // Keep existing bar state if it exists
        const existingBar = timelineBars.find(existing => existing.id === bar.id);
        if (existingBar) {
          return {
            ...bar,
            hidden: existingBar.hidden,
            startDays: existingBar.startDays,
            endDays: existingBar.endDays
          };
        }
        return bar;
      }));
    }
  }, [userData]);

  useEffect(() => {
    setEditingUserData(userData);
  }, [userData]);

  const updateEditingUserData = (field: keyof UserData, value: any) => {
    setHasUserMadeChanges(true);
    setEditingUserData(prev => prev ? {
      ...prev,
      [field]: value
    } : undefined);
  };

  const handleSaveChanges = async () => {
    if (!editingUserData || !hasUserMadeChanges) return;

    setIsSaving(true);
    try {
      // Ensure we have the latest separation date
      const updatedUserData = {
        ...editingUserData,
        separationDate: selectedDate.toISOString()
      };

      // Call updateUserData function to persist the changes to the database
      await updateUserData(updatedUserData);
      
      // Update parent components
      onUpdateUserData?.(updatedUserData);
      
      // Clear task cache to force a refresh of tasks with new branch filtering
      setLastFetchTime(null);
      
      setShowPersonalizationDialog(false);
      setHasUserMadeChanges(false);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getMonthsData = () => {
    const months = [];
    
    // Show all months without premium restrictions
    for (const monthsLeft of monthsList) {
      const date = subMonths(separationDate, monthsLeft);
      months.push({
        monthsLeft,
        date,
        label: format(date, 'MMMM yyyy')
      });
    }
    
    // Add Post Separation
    months.push({
      monthsLeft: 0,
      date: separationDate,
      label: 'Post Separation'
    });
    
    return months;
  };

  const calculateDatePosition = useCallback((monthDate: Date, nextMonthDate: Date | undefined) => {
    if (!nextMonthDate || monthDate > currentDate || nextMonthDate <= currentDate) {
      return null;
    }

    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1);
    const totalMillisInMonth = monthEnd.getTime() - monthStart.getTime();
    const elapsedMillis = currentDate.getTime() - monthStart.getTime();
    const percentage = (elapsedMillis / totalMillisInMonth) * 100;
    
    return `${Math.max(0, Math.min(100, percentage))}%`;
  }, [currentDate]);

  const getTasksForTrackAndMonth = (tasks: Task[], track: string, monthsLeft: number): Task[] => {
    // Debug logging for branch filtering
    console.log('Filtering tasks with user branch:', {
      userBranch: userData?.branch,
      availableTasks: tasks.length,
      trackFilter: track,
      monthFilter: monthsLeft
    });

    return tasks.filter(task => {
      // First filter by track
      const trackMatch = task.trackIds?.includes(track);
      
      // Then filter by month
      const monthMatch = task.whenMonthsLeft?.includes(monthsLeft);
      
      // Then filter by branch - show tasks that are either for "All" branches or the user's specific branch
      const branchMatch = 
        // Check for "All" branch (case insensitive)
        task.branchIds?.some(branch => branch.toLowerCase() === 'all') || 
        // Check if user's branch matches any branch in the task (case insensitive)
        (userData?.branch ? 
          task.branchIds?.some(branch => 
            branch.toLowerCase() === userData.branch.toLowerCase()
          ) 
        : false);
      
      // Add debug logging for rejected tasks
      if (trackMatch && monthMatch && !branchMatch && userData?.branch) {
        console.log('Task filtered out by branch:', {
          taskTitle: task.title,
          taskBranches: task.branchIds, 
          userBranch: userData.branch
        });
      }
      
      return trackMatch && monthMatch && branchMatch;
    });
  };

  const handleBarUpdate = (updatedBar: TimelineBarData) => {
    setTimelineBars(bars => 
      bars.map(bar => {
        if (bar.id === updatedBar.id) {
          return {
            ...bar,
            ...updatedBar,
            // Ensure we maintain the row property
            row: bar.row
          };
        }
        return bar;
      })
    );
  };

  const handleBarDelete = (barId: string) => {
    setTimelineBars(bars => bars.filter(bar => bar.id !== barId));
  };

  const addNewBar = () => {
    const newBar: TimelineBarData = {
      id: `bar-${Date.now()}`,
      name: 'New Timeline Bar',
      startDays: 90,
      endDays: 0,
      color: '#6B7280',
      editable: true
    };
    setTimelineBars(prevBars => [...prevBars, newBar]);
  };

  const isTrackVisible = (track: string) => {
    if (!visibleTracks) return true;
    switch (track.toLowerCase()) {
      case 'admin': return visibleTracks.admin;
      case 'mindset': return visibleTracks.mindset;
      case 'health': return visibleTracks.health;
      case 'job': return visibleTracks.job;
      case 'misc': return visibleTracks.misc;
      default: return false;
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: 'Veteran Timeline',
          text: 'Check out my veteran transition timeline!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // You might want to add a toast notification here to indicate successful copy
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleLinkClick = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isPremium) {
      setShowPaywallModal(true);
      return;
    }
    
    if (task.link) {
      window.open(task.link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)] text-gray-200">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  const monthsData = getMonthsData();

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 bg-[#1A1B1E] border-b border-gray-800">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <img 
            src="/veteran-timeline-logo.png" 
            alt="Veteran Timeline" 
            className="h-[36px] sm:h-[48px] w-auto object-contain" 
          />
        </div>

        {/* Center - Feedback text (hidden on mobile) */}
        <div className="hidden md:block text-gray-300 mx-8">
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

        {/* Right side - Share button and Navigation */}
        <div className="flex items-center gap-6 relative z-[60]">
          <div className="hidden md:block">
            <ShareTimeline 
              separationDate={separationDate}
              bars={timelineBars}
            />
          </div>
          <NavigationMenu 
            userData={userData} 
            onUpdateUserData={onUpdateUserData} 
            timelineBars={timelineBars}
            onUpdateTimelineBars={setTimelineBars}
            separationDate={separationDate}
            showMobileMenu={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="min-w-[1200px] h-full overflow-x-scroll scrollbar-visible">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-50">
                <tr className="bg-[#1A1B1E]">
                  <th className="sticky left-0 z-50 bg-[#1A1B1E] p-2 text-left text-sm font-medium text-gray-400 uppercase tracking-wider border-b border-gray-800 w-[200px]">
                    {/* Track header cell */}
                  </th>
                  {monthsData.map((month, index) => (
                    <th 
                      key={index} 
                      className="p-2 text-left font-medium tracking-wider border-b border-gray-800 bg-[#1A1B1E] min-w-[180px]"
                    >
                      <div className="text-sm text-gray-400 md:block hidden">
                        {month.monthsLeft} months
                      </div>
                      <div className="text-base text-gray-200 font-semibold whitespace-nowrap pb-1">
                        {month.monthsLeft === 0 ? (
                          <span className="text-red-400">Post Separation</span>
                        ) : (
                          <>
                            <span className="md:inline hidden">{month.label}</span>
                            <span className="md:hidden">{format(month.date, 'MMM yyyy')}</span>
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="relative divide-y divide-gray-800">
                {/* Vertical Lines Container */}
                <tr className="sticky top-[6.5rem] z-20 pointer-events-none">
                  <td className="sticky left-0 z-50 bg-[#1A1B1E]"></td>
                  {monthsData.map((month, index) => {
                    const currentDatePosition = calculateDatePosition(month.date, monthsData[index + 1]?.date);

                    return (
                      <td key={index} className="relative">
                        {/* Separation Date Line (Red) */}
                        {month.monthsLeft === 1 && (
                          <div className="absolute top-0 right-0 w-px h-screen bg-red-500" style={{ zIndex: 25 }} />
                        )}
                        
                        {/* Current Date Line (Blue) */}
                        {currentDatePosition !== null && (
                          <div 
                            className="absolute top-0 w-px h-screen bg-blue-500" 
                            style={{ 
                              zIndex: 25,
                              left: currentDatePosition
                            }} 
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>

                {tracks.map((track, trackIndex) => {
                  const isVisible = isTrackVisible(track);
                  const isFirstTrack = trackIndex === 0;
                  const trackPadding = isFirstTrack ? "pt-4" : "";

                  const trackRow = (
                    <tr key={`${track}-${trackIndex}`} className={`hover:bg-gray-900/50 transition-colors ${trackPadding}`}>
                      <td className="sticky left-0 z-40 bg-[#1A1B1E] p-2 text-sm font-medium text-gray-300 whitespace-nowrap border-r border-gray-800">
                        <div className={`flex items-center gap-2 px-3 py-1.5 bg-gray-800/90 rounded-md border border-gray-700/50 w-fit ${!isVisible ? 'opacity-50' : ''}`}>
                          <div className="md:flex hidden items-center gap-2">
                            {getTrackIcon(track)}
                            <span className="uppercase tracking-wide">{track}</span>
                          </div>
                          <div className="md:hidden flex items-center justify-center h-[100px] w-[24px]">
                            <div className="flex items-center gap-2 -rotate-90 origin-center whitespace-nowrap">
                              {getTrackIcon(track)}
                              <span className="uppercase tracking-wide">{track}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {monthsData.map((month, monthIndex) => (
                        <td 
                          key={`${track}-${month.monthsLeft}-${monthIndex}`} 
                          className={`relative min-w-[180px] max-w-[180px] ${
                            !isVisible ? 'opacity-50' : ''
                          }`}
                        >
                          {isVisible && (
                            <div className="p-2 space-y-1">
                              {getTasksForTrackAndMonth(tasks, track, month.monthsLeft).map(task => (
                                <button 
                                  key={`${task.id}-${month.monthsLeft}`}
                                  className="w-full text-left"
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <div className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer border border-gray-700/50">
                                    <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed">{task.title}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );

                  // Special handling for tracks with bars
                  if (track === 'Admin' && isVisible) {
                    return (
                      <React.Fragment key={`${track}-container`}>
                        <tr key="terminal-leave-timeline" className="hover:bg-gray-900/50 transition-colors">
                          <td className="sticky left-0 z-40 bg-[#1A1B1E] border-r border-gray-800"></td>
                          <td colSpan={monthsData.length} className="relative p-0 h-8">
                            <div className="timeline-container absolute inset-0">
                              {timelineBars
                                .filter(bar => bar.id === 'terminal' && !bar.hidden)
                                .map(bar => (
                                  <TimelineBar
                                    key={`${bar.id}-${bar.row}`}
                                    bar={{...bar, row: 0}}
                                    separationDate={separationDate}
                                    onUpdate={handleBarUpdate}
                                    onDelete={handleBarDelete}
                                    isEditing={isEditingBars}
                                    allBars={timelineBars.filter(b => b.id === 'terminal')}
                                  />
                                ))}
                            </div>
                          </td>
                        </tr>
                        {trackRow}
                      </React.Fragment>
                    );
                  }

                  if (track === 'Job' && isVisible) {
                    return (
                      <React.Fragment key={`${track}-container`}>
                        <tr key="job-timeline-bars" className="hover:bg-gray-900/50 transition-colors">
                          <td className="sticky left-0 z-40 bg-[#1A1B1E] border-r border-gray-800"></td>
                          <td colSpan={monthsData.length} className="relative p-0 h-16">
                            <div className="timeline-container absolute inset-0">
                              {timelineBars
                                .filter(bar => (bar.id === 'work' || bar.id === 'skillbridge') && !bar.hidden)
                                .map(bar => (
                                  <TimelineBar
                                    key={`${bar.id}-${bar.row}`}
                                    bar={{...bar, row: bar.id === 'work' ? 0 : 1}}
                                    separationDate={separationDate}
                                    onUpdate={handleBarUpdate}
                                    onDelete={handleBarDelete}
                                    isEditing={isEditingBars}
                                    allBars={timelineBars.filter(b => b.id === 'work' || b.id === 'skillbridge')}
                                  />
                                ))}
                            </div>
                          </td>
                        </tr>
                        {trackRow}
                      </React.Fragment>
                    );
                  }

                  if (track === 'Health' && isVisible) {
                    return (
                      <React.Fragment key={`${track}-container`}>
                        <tr key="health-timeline-bars" className="hover:bg-gray-900/50 transition-colors">
                          <td className="sticky left-0 z-40 bg-[#1A1B1E] border-r border-gray-800"></td>
                          <td colSpan={monthsData.length} className="relative p-0 h-8">
                            <div className="timeline-container absolute inset-0">
                              {timelineBars
                                .filter(bar => (bar.id === 'bdd' || bar.id === 'disability') && !bar.hidden)
                                .map(bar => (
                                  <TimelineBar
                                    key={`${bar.id}-${bar.row}`}
                                    bar={{...bar, row: bar.id === 'bdd' ? 0 : 0}}
                                    separationDate={separationDate}
                                    onUpdate={handleBarUpdate}
                                    onDelete={handleBarDelete}
                                    isEditing={isEditingBars}
                                    allBars={timelineBars.filter(b => b.id === 'bdd' || b.id === 'disability')}
                                  />
                                ))}
                            </div>
                          </td>
                        </tr>
                        {trackRow}
                      </React.Fragment>
                    );
                  }

                  return trackRow;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Only show edit dialog when tracks are visible */}
      {Object.values(visibleTracks || {}).some(v => v) && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-[#1A1B1E] text-gray-200 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-200">Edit Timeline Bars</DialogTitle>
              <DialogDescription className="text-gray-400">
                Manage visibility and customize timeline bars
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {timelineBars
                .filter(bar => bar.editable)
                .map(bar => (
                <div key={`${bar.id}-edit`} className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
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
                          onChange={(e) => handleBarUpdate({
                            ...bar,
                            startDays: parseInt(e.target.value)
                          })}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">End Days:</label>
                        <input
                          type="number"
                          value={bar.endDays}
                          onChange={(e) => handleBarUpdate({
                            ...bar,
                            endDays: parseInt(e.target.value)
                          })}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBarUpdate({
                        ...bar,
                        hidden: !bar.hidden
                      })}
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
      )}

      {/* Personalization Settings Dialog */}
      <Dialog open={showPersonalizationDialog} onOpenChange={setShowPersonalizationDialog}>
        <DialogContent className="bg-[#1A1B1E] text-gray-200 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-200">Personalization Settings</DialogTitle>
            <DialogDescription className="text-gray-400">
              Review and update your transition preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Branch of Service</label>
                <select
                  value={editingUserData?.branch}
                  onChange={(e) => updateEditingUserData('branch', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  {['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force'].map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rank</label>
                <select
                  value={editingUserData?.rank}
                  onChange={(e) => updateEditingUserData('rank', e.target.value)}
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
                  value={editingUserData?.location}
                  onChange={(e) => updateEditingUserData('location', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  {['Stay Current Location', 'Return to Home of Record', 'New Location', 'Undecided'].map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
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
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSubscribe={handleSubscribe}
        isPremium={isPremium}
      />
    </div>
  );
};

export { Timeline };
export default Timeline; 