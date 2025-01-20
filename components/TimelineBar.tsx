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
  hidden?: boolean;  // Whether the bar should be hidden from the timeline
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
const BAR_GAP = 2;    // Reduced gap between stacked bars

export function TimelineBar({ bar, separationDate, onUpdate, onDelete, isEditing, allBars }: TimelineBarProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Timeline constants
  const totalWidth = 93;
  const postSepWidth = 7;
  const daysPerMonth = 30;
  const totalMonths = 12;
  const totalDays = totalMonths * daysPerMonth;
  
  // Calculate width
  const scaleFactor = 0.85;
  
  const duration = bar.startDays - bar.endDays;
  const rawWidth = (duration / totalDays) * totalWidth;
  const width = rawWidth * scaleFactor;
  
  // Calculate position from the right edge
  const daysFromEnd = bar.startDays;
  const rawPosition = (daysFromEnd / totalDays) * totalWidth;
  const leftPosition = totalWidth - (rawPosition * scaleFactor);

  const barStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${leftPosition}%`,
    width: `${width}%`,
    backgroundColor: bar.color,
    height: '32px',
    top: bar.row ? `${bar.row * 40}px` : '0',
    borderRadius: '4px',
    cursor: isEditing ? 'grab' : 'default',
    transition: 'background-color 0.2s',
    border: '1px solid rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    fontSize: '14px',
    color: 'white',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  };

  return (
    <>
      <div 
        className="absolute h-6"
        style={barStyle}
        onDoubleClick={() => isEditing && bar.editable && onUpdate && setIsEditorOpen(true)}
      >
        {isEditing && bar.editable && (
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