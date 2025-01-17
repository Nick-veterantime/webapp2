import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { addMonths, format, subMonths } from 'date-fns';
import { SeparationDateInput } from './SeparationDateInput';
import { TimelineBar, TimelineBarData } from './TimelineBar';
import { ShareTimeline } from './ShareTimeline';
import { CalendarIcon } from '@radix-ui/react-icons';

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
    row: 1
  },
  {
    id: 'work',
    name: 'Available to Start Work',
    startDays: 60,
    endDays: 0,
    color: '#EC4899',
    editable: true,
    row: 2
  },
  {
    id: 'skillbridge',
    name: 'SkillBridge',
    startDays: 180,
    endDays: 0,
    color: '#3B82F6',
    editable: true,
    row: 3
  }
];

export function Timeline() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [separationDate, setSeparationDate] = useState<Date>(new Date());
  const [timelineBars, setTimelineBars] = useState<TimelineBarData[]>(defaultBars);
  const [isEditingBars, setIsEditingBars] = useState(false);

  const getMonthsData = () => {
    const months = [];
    
    // Add all months from monthsList
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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tasks');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.details || 'Failed to fetch tasks');
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        setTasks(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching tasks');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

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
      bars.map(bar => bar.id === updatedBar.id ? updatedBar : bar)
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
    <div className="w-full h-full bg-gray-900 text-white p-6">
      <div className="flex justify-end items-start mb-4">
        <div className="flex flex-col items-end gap-2">
          <SeparationDateInput 
            separationDate={separationDate}
            onDateChange={setSeparationDate}
          />
          <ShareTimeline separationDate={separationDate} bars={timelineBars} />
        </div>
      </div>
      <div className="h-[calc(100vh-200px)] bg-[#1A1B1E] text-gray-200">
        <div className="flex justify-end items-start p-4 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingBars(!isEditingBars)}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              {isEditingBars ? 'Done Editing' : 'Edit Timeline Bars'}
            </button>
            {isEditingBars && (
              <button
                onClick={addNewBar}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
              >
                Add Bar
              </button>
            )}
          </div>
        </div>
        <div className="h-full overflow-x-auto overflow-y-auto rounded-lg">
          <div className="relative min-w-[1200px]">
            <table className="w-full border-collapse bg-[#1A1B1E]">
              <thead>
                <tr className="sticky top-0 z-50 bg-[#1A1B1E]">
                  <th className="sticky left-0 z-50 bg-[#1A1B1E] p-2 text-left text-sm font-medium text-gray-400 uppercase tracking-wider border-b border-gray-800"></th>
                  {monthsData.map((month, index) => (
                    <th key={index} className="p-2 text-left font-medium tracking-wider border-b border-gray-800 bg-[#1A1B1E]">
                      <div className="text-sm text-gray-400">{month.monthsLeft} months</div>
                      <div className="text-base text-gray-200 font-semibold whitespace-nowrap">
                        {month.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="sticky left-0 z-10 bg-[#1A1B1E] p-2"></td>
                  <td colSpan={monthsData.length} className="relative p-0 h-32">
                    <div className="timeline-container absolute inset-0">
                      {timelineBars.map(bar => (
                        <TimelineBar
                          key={bar.id}
                          bar={bar}
                          separationDate={separationDate}
                          onUpdate={handleBarUpdate}
                          onDelete={handleBarDelete}
                          isEditing={isEditingBars}
                          allBars={timelineBars}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
                {tracks.map(track => (
                  <tr key={track} className="hover:bg-gray-900/50 transition-colors">
                    <td className="sticky left-0 z-10 bg-[#1A1B1E] p-2 text-sm font-medium text-gray-300 whitespace-nowrap border-r border-gray-800">{track}</td>
                    {monthsData.map((month, index) => (
                      <td 
                        key={`${track}-${index}`} 
                        className={`p-2 min-w-[180px] max-w-[180px] ${month.monthsLeft === 0 ? 'border-l-2 border-l-red-500' : ''}`}
                      >
                        <div className="space-y-1">
                          {getTasksForTrackAndMonth(track, month.monthsLeft).map(task => (
                            <div key={task.id}>
                              <Dialog 
                                open={isDialogOpen && selectedTask?.id === task.id}
                                onOpenChange={(open) => {
                                  setIsDialogOpen(open);
                                  if (!open) setSelectedTask(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <button className="w-full text-left" onClick={() => {
                                    setSelectedTask(task);
                                    setIsDialogOpen(true);
                                  }}>
                                    <div className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer border border-gray-700/50">
                                      <p className="text-sm text-gray-200 line-clamp-2">{task.task}</p>
                                    </div>
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#1A1B1E] text-gray-200 border-gray-700">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold text-gray-200">{task.task}</DialogTitle>
                                    <DialogDescription asChild>
                                      <div className="mt-4 space-y-4">
                                        <p className="text-gray-300">{task.description}</p>
                                        {task.link && (
                                          <a 
                                            href={task.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                                          >
                                            {task.linkedText || 'Learn More'} →
                                          </a>
                                        )}
                                      </div>
                                    </DialogDescription>
                                  </DialogHeader>
                                </DialogContent>
                              </Dialog>
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 