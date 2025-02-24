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

interface Task {
  id: string;
  task: string;
  month: string;
  track: string;
  branch: string;
  linkedText: string;
  link: string;
  description: string;
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
    task: 'Begin Benefits Delivery at Discharge (BDD)',
    month: '6',
    track: 'Admin',
    branch: 'All',
    linkedText: 'Learn more about BDD',
    link: 'https://www.va.gov/disability/how-to-file-claim/when-to-file/pre-discharge-claim/',
    description: 'Start your VA disability claim process'
  },
  {
    id: 'default-2',
    task: 'Schedule TAP Workshop',
    month: '12',
    track: 'Admin',
    branch: 'All',
    linkedText: 'TAP Information',
    link: 'https://www.tapevents.org/courses',
    description: 'Mandatory transition workshop'
  },
  {
    id: 'default-3',
    task: 'Begin Job Search',
    month: '12',
    track: 'Job',
    branch: 'All',
    linkedText: 'Job Search Resources',
    link: 'https://www.dol.gov/agencies/vets',
    description: 'Start looking for post-service employment'
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

interface UserData {
  branch: string;
  rankCategory: string;
  rank: string;
  jobCode: string;
  locationPreference: string;
  locationType?: 'CONUS' | 'OCONUS';
  location?: string;
  consideringAreas?: State[];
  locationAdditionalInfo?: string;
  careerGoal: string;
  separationDate: string;
  createdAt?: string;
  updatedAt?: string;
}

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
    if (subscriptionAttemptRef.current) {
      console.log('Subscription already in progress, canceling current attempt');
      resetSubscriptionState();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    subscriptionAttemptRef.current = true;
    
    setIsLoading(false);
    
    toast.dismiss('subscription');
    
    console.log('Starting new subscription attempt');
    
    requestAnimationFrame(() => {
      setIsLoading(true);
      toast.loading('Preparing your subscription...', { id: 'subscription' });
      
      initiateSubscriptionProcess().catch(err => {
        console.error('Unhandled error in subscription process:', err);
        resetSubscriptionState();
      });
    });
  };
  
  const initiateSubscriptionProcess = async () => {
    try {
      let userInfo: UserInfo = {
        // Capture browser info for better tracking
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        source: 'timeline_component',
        anonymous: true
      };
      
      // Try to get authentication but proceed even if it fails
      try {
        console.log('Attempting to refresh session before subscription...');
        await auth.refreshSession();
        console.log('Session refreshed successfully');
      } catch (refreshError) {
        console.warn('Session refresh failed, will proceed with limited data:', refreshError);
      }
      
      // Get session info if available
      const { data: { session }, error: sessionError } = await auth.getSession();
      
      if (sessionError) {
        console.warn('Session error but proceeding anyway:', sessionError);
      }
      
      if (!session) {
        console.warn('No active session found, proceeding with anonymous checkout');
      } else {
        console.log('Session found, proceeding with user data');
        userInfo = {
          ...userInfo,
          email: session?.user?.email,
          userId: session?.user?.id,
          anonymous: false
        };
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      console.log('Making API request with user data...');
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers,
        body: JSON.stringify(userInfo)
      });
      
      // Log response status for debugging
      console.log(`API response status: ${response.status}`);
      
      // Handle both successful and error responses
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Subscription request failed with status:', response.status, 'Response:', data);
        
        // Special handling for auth errors - offer to sign in
        if (response.status === 401 && data.error?.includes('authentication')) {
          console.log('Authentication error detected, offering sign-in option');
          
          toast.error(`Authentication required. Please sign in first.`, {
            id: 'subscription',
            action: {
              label: 'Sign In',
              onClick: () => router.push('/login')
            },
          });
          
          return;
        }
        
        throw new Error(data.error || `Error ${response.status}`);
      }
      
      console.log('Subscription API request succeeded');
      
      if (!data) {
        console.error('Empty response data received from API');
        throw new Error('No data received from subscription API');
      }
      
      console.log('API response data available:', Object.keys(data).join(', '));
      
      if (data.url) {
        console.log('Received Stripe checkout URL:', data.url.substring(0, 60) + '...');
        toast.success('Redirecting to checkout...', { id: 'subscription' });
        
        // Clear subscription attempt flag immediately
        subscriptionAttemptRef.current = false;
        
        try {
          // More reliable approach - direct window location change
          console.log('Redirecting to Stripe checkout page...');
          window.location.href = data.url;
          
          // As a fallback, also try form submission after a short delay
          setTimeout(() => {
            try {
              if (document.location.href.indexOf('stripe.com') === -1) {
                console.log('Fallback: Using form submission for redirection');
                const form = document.createElement('form');
                form.method = 'GET';
                form.action = data.url;
                form.target = '_self'; // Ensure it opens in the same tab
                document.body.appendChild(form);
                form.submit();
              }
            } catch (formError) {
              console.error('Form submission fallback failed:', formError);
              // Last resort fallback
              window.open(data.url, '_self');
            }
          }, 300);
        } catch (navigationError) {
          console.error('Navigation error:', navigationError);
          // If direct navigation fails, try alternative approach
          window.open(data.url, '_self');
        }
        
        return;
      }
      
      throw new Error('No checkout URL received');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(`Subscription failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'subscription' });
    } finally {
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

      // Update parent components
      onUpdateUserData?.(updatedUserData);
      
      setShowPersonalizationDialog(false);
      setHasUserMadeChanges(false);
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

  const getTasksForTrackAndMonth = (track: string, monthsLeft: number) => {
    if (!Array.isArray(tasks)) return [];
    
    return tasks.filter(task => 
      task && 
      task.track && 
      task.month && 
      task.track.toLowerCase() === track.toLowerCase() && 
      task.month.toString() === monthsLeft.toString()
    );
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
                              {getTasksForTrackAndMonth(track, month.monthsLeft).map(task => (
                                <button 
                                  key={`${task.id}-${month.monthsLeft}`}
                                  className="w-full text-left"
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <div className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer border border-gray-700/50">
                                    <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed">{task.task}</p>
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