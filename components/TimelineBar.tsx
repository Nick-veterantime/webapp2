import { useState, useEffect } from 'react';
import { addDays, subDays, differenceInDays } from 'date-fns';
import { TimelineBarEditor } from './TimelineBarEditor';

export interface TimelineBarData {
  id: string;
  name: string;
  startDays: number; // Days from separation date
  endDays: number;   // Days from separation date
  color?: string;
  editable?: boolean;
  row?: number;      // Track which row this bar should be in
}

interface TimelineBarProps {
  bar: TimelineBarData;
  separationDate: Date;
  onUpdate?: (bar: TimelineBarData) => void;
  onDelete?: (id: string) => void;
  isEditing: boolean;
  allBars: TimelineBarData[]; // Add all bars to check for overlaps
}

const BAR_HEIGHT = 24; // Height of each bar
const BAR_GAP = 4;    // Gap between stacked bars

export function TimelineBar({ bar, separationDate, onUpdate, onDelete, isEditing, allBars }: TimelineBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Timeline constants
  const totalWidth = 93; // Total width in percentage (excluding post-separation)
  const postSepWidth = 7; // Width of the "Post Separation" column as percentage
  const daysPerMonth = 30;
  const totalMonths = 12;
  const totalDays = totalMonths * daysPerMonth;
  
  // Calculate width
  const scaleFactor = 0.85; // Increased from 0.75 to shift bars right
  
  const duration = bar.startDays - bar.endDays;
  const rawWidth = (duration / totalDays) * totalWidth;
  const width = rawWidth * scaleFactor;
  
  // Calculate position from the right edge
  const daysFromEnd = bar.startDays;
  const rawPosition = (daysFromEnd / totalDays) * totalWidth;
  const leftPosition = totalWidth - (rawPosition * scaleFactor);

  // Fixed overlap detection for vertical stacking
  const doBarsOverlap = (bar1: TimelineBarData, bar2: TimelineBarData) => {
    // For timeline bars, we need to check if their ranges overlap
    const start1 = bar1.startDays;
    const end1 = bar1.endDays;
    const start2 = bar2.startDays;
    const end2 = bar2.endDays;
    
    // Two ranges overlap if one starts before the other ends
    return (start1 > end2 && end1 < start2);
  };

  // Stabilized row calculation for vertical stacking
  const calculateRow = () => {
    // If the bar has a fixed row position, use it
    if (bar.row !== undefined) {
      return bar.row;
    }

    // Get all bars that overlap with the current bar
    const overlappingBars = allBars
      .filter(otherBar => otherBar.id !== bar.id)
      .filter(otherBar => {
        // Check if bars overlap in time
        const start1 = bar.startDays;
        const end1 = bar.endDays;
        const start2 = otherBar.startDays;
        const end2 = otherBar.endDays;
        
        // Bars overlap if they share any time period
        return (
          (start1 >= end2 && start1 <= start2) || // Current bar starts during other bar
          (end1 >= end2 && end1 <= start2) ||     // Current bar ends during other bar
          (start2 >= end1 && start2 <= start1) || // Other bar starts during current bar
          (end2 >= end1 && end2 <= start1)        // Other bar ends during current bar
        );
      });

    // If no overlapping bars, use row 0
    if (overlappingBars.length === 0) {
      return 0;
    }

    // Find the first available row
    let row = 0;
    const usedRows = new Set(overlappingBars.map(b => b.row || 0));
    
    while (usedRows.has(row)) {
      row++;
    }

    return row;
  };

  // Only update row when necessary and not dragging
  useEffect(() => {
    if (onUpdate && !isDragging) {
      const newRow = calculateRow();
      if (newRow !== bar.row) {
        onUpdate({ ...bar, row: newRow });
      }
    }
  }, [allBars.map(b => `${b.id}-${b.startDays}-${b.endDays}`).join(',')]);

  const handleDragStart = (e: React.MouseEvent, type: 'start' | 'end' | 'move') => {
    if (!isEditing || !bar.editable) return;
    setIsDragging(true);
    setDragType(type);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !dragType || !onUpdate) return;

    // Get the timeline element and its bounds
    const timeline = document.querySelector('.timeline-container');
    if (!timeline) return;
    const bounds = timeline.getBoundingClientRect();
    
    // Calculate position relative to the timeline's right edge (red line)
    const redLineX = bounds.right - (bounds.width * (postSepWidth / 100));
    const relativeX = redLineX - e.clientX;
    
    // Convert to months then to days
    const monthsFromEnd = (relativeX / bounds.width) * 7;
    const newDays = Math.round(monthsFromEnd * 30);
    
    let updatedBar = { ...bar };
    
    switch (dragType) {
      case 'start':
        updatedBar.startDays = Math.max(Math.min(snapToDay(newDays), 180), bar.endDays);
        break;
      case 'end':
        updatedBar.endDays = Math.max(Math.min(snapToDay(newDays), bar.startDays), 0);
        break;
      case 'move':
        const barLength = bar.startDays - bar.endDays;
        const newEnd = snapToDay(newDays);
        const newStart = newEnd + barLength;
        
        if (newEnd >= 0 && newStart <= 180) {
          updatedBar.startDays = newStart;
          updatedBar.endDays = newEnd;
        }
        break;
    }

    onUpdate(updatedBar);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragType(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Handle drag snapping
  const snapToDay = (days: number) => {
    return Math.max(0, Math.min(180, days));
  };

  return (
    <>
      <div 
        className={`absolute h-6 ${isEditing && bar.editable ? 'cursor-move' : ''}`}
        style={{
          left: `${leftPosition}%`,
          width: `${width}%`,
          backgroundColor: bar.color || '#3B82F6',
          opacity: isDragging ? 0.7 : 1,
          top: `${(bar.row || 0) * (BAR_HEIGHT + BAR_GAP)}px`,
          height: `${BAR_HEIGHT}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease-out',
          zIndex: isDragging ? 50 : 1,
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        onMouseDown={e => handleDragStart(e, 'move')}
        onDoubleClick={() => isEditing && bar.editable && onUpdate && setIsEditorOpen(true)}
      >
        {isEditing && bar.editable && (
          <>
            <div 
              className="absolute left-0 top-0 w-2 h-full bg-white/20 hover:bg-white/40 cursor-ew-resize rounded-l-md transition-colors"
              onMouseDown={e => {
                e.stopPropagation();
                handleDragStart(e, 'start');
              }}
            />
            <div 
              className="absolute right-0 top-0 w-2 h-full bg-white/20 hover:bg-white/40 cursor-ew-resize rounded-r-md transition-colors"
              onMouseDown={e => {
                e.stopPropagation();
                handleDragStart(e, 'end');
              }}
            />
            <div className="absolute -top-2 -right-2 flex gap-1">
              <button
                className="w-5 h-5 bg-blue-500 hover:bg-blue-400 rounded-full text-white text-xs flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditorOpen(true);
                }}
              >
                ✎
              </button>
              {onDelete && (
                <button
                  className="w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(bar.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </>
        )}
        <div className="px-2 py-1 text-sm text-white truncate">
          {bar.name}
        </div>
      </div>
      
      {isEditing && onUpdate && (
        <TimelineBarEditor
          bar={bar}
          onUpdate={onUpdate}
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
        />
      )}
    </>
  );
} 