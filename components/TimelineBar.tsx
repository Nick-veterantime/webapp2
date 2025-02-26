import { useState, useEffect } from 'react';
import { addDays, subDays, differenceInDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, Edit, Info, Move, ChevronRight, Lock, FileText, Briefcase, GraduationCap, Trash2 } from 'lucide-react';

export interface TimelineBarData {
  id: string;
  name: string;
  startDays: number; // Days from separation date
  endDays: number;   // Days from separation date
  color?: string;
  editable?: boolean;
  row?: number;      // Track which row this bar should be in
  hidden?: boolean;  // Whether the bar should be hidden from the timeline
  description?: string; // Description of what this timeline bar represents
  link?: string;      // Optional link to more information
  linkedText?: string; // Text to display for the link
}

interface TimelineBarProps {
  bar: TimelineBarData;
  separationDate: Date;
  onUpdate?: (bar: TimelineBarData) => void;
  onDelete?: (id: string) => void;
  isEditing: boolean;
  allBars: TimelineBarData[]; // Add all bars to check for overlaps
  isPremium?: boolean;
  onSubscribe?: () => void;
}

const BAR_HEIGHT = 24; // Height of each bar
const BAR_GAP = 2;    // Reduced gap between stacked bars

const predefinedColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
  '#EF4444', // red
  '#14B8A6', // teal
];

// Combined modal for both viewing and editing timeline bars
function TimelineBarModal({ 
  bar, 
  isOpen, 
  onClose,
  onUpdate,
  onDelete,
  isPremium = false,
  onSubscribe = () => {} 
}: { 
  bar: TimelineBarData; 
  isOpen: boolean; 
  onClose: () => void;
  onUpdate?: (bar: TimelineBarData) => void;
  onDelete?: (id: string) => void;
  isPremium?: boolean;
  onSubscribe?: () => void;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedBar, setEditedBar] = useState<TimelineBarData>(bar);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedBar(bar);
      setIsEditMode(false);
    }
  }, [isOpen, bar]);

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isPremium && bar.link) {
      onSubscribe();
      return;
    }
    
    if (bar.link) {
      window.open(bar.link, '_blank');
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedBar);
    }
    setIsEditMode(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(bar.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#000000] text-white border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isEditMode ? editedBar.color : bar.color }}></div>
            {isEditMode ? (
              <input
                value={editedBar.name}
                onChange={(e) => setEditedBar({ ...editedBar, name: e.target.value })}
                className="flex-grow bg-transparent border-b border-gray-700 focus:border-blue-500 outline-none"
              />
            ) : (
              bar.name
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400 flex justify-between items-center">
            <span>Timeline bar details and information</span>
            {bar.editable && onUpdate && (
              <button 
                className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? 'Cancel Edit' : (
                  <>
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </>
                )}
              </button>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {isEditMode ? (
            // Edit Mode Content
            <>
              {/* Color Selection */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Color</label>
                <div className="flex flex-wrap gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        editedBar.color === color ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditedBar({ ...editedBar, color })}
                    />
                  ))}
                </div>
              </div>
              
              {/* Start Days */}
              <div className="space-y-2">
                <label htmlFor="startDays" className="text-sm text-gray-400">
                  Start Days (before separation)
                </label>
                <input
                  id="startDays"
                  type="number"
                  value={editedBar.startDays}
                  onChange={(e) => setEditedBar({ ...editedBar, startDays: Math.max(0, parseInt(e.target.value)) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2"
                />
              </div>
              
              {/* End Days */}
              <div className="space-y-2">
                <label htmlFor="endDays" className="text-sm text-gray-400">
                  End Days (before separation, 0 = at separation date)
                </label>
                <input
                  id="endDays"
                  type="number"
                  value={editedBar.endDays}
                  onChange={(e) => setEditedBar({ ...editedBar, endDays: Math.max(0, parseInt(e.target.value)) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2"
                />
              </div>
              
              {/* Description, Resource Link, and Link Text are no longer editable */}
              
              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </>
          ) : (
            // View Mode Content
            <>
              {/* Duration details */}
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span>Starts <strong>{bar.startDays}</strong> days before separation</span>
              </div>
              {bar.endDays > 0 && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Ends <strong>{bar.endDays}</strong> days before separation</span>
                </div>
              )}
              {bar.endDays === 0 && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Runs until your separation date</span>
                </div>
              )}

              {/* Bar Description - Free for all users */}
              {bar.description && (
                <div className="mt-2">
                  <p className="text-gray-300 leading-relaxed">{bar.description}</p>
                </div>
              )}

              {/* Resource Link Section */}
              {bar.link && (
                <div className="mt-4">
                  {isPremium ? (
                    <a
                      href={bar.link}
                      onClick={handleLinkClick}
                      className="w-full sm:w-auto inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:p-0 text-[#007BFF] hover:text-[#0056B3] active:text-[#004494] transition-colors rounded-lg sm:rounded-none hover:bg-[#007BFF]/5 sm:hover:bg-transparent"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bar.linkedText || 'Learn More'} →
                    </a>
                  ) : (
                    <div className="w-full">
                      <button 
                        onClick={onSubscribe}
                        className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-3 px-4 py-3 sm:p-0 text-gray-400 hover:text-[#007BFF] active:text-[#004494] transition-all rounded-lg sm:rounded-none hover:bg-[#007BFF]/5 sm:hover:bg-transparent group"
                      >
                        <Lock className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-grow sm:flex-grow-0">Subscribe to access resource link</span>
                        <span className="text-sm text-[#007BFF] group-hover:translate-x-0.5 transition-transform hidden sm:inline-block">
                          $30/year →
                        </span>
                        <span className="text-sm text-[#007BFF] sm:hidden">
                          $30/year
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TimelineBar({ 
  bar, 
  separationDate, 
  onUpdate, 
  onDelete, 
  isEditing, 
  allBars, 
  isPremium = false,
  onSubscribe = () => {}
}: TimelineBarProps) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Timeline constants
  const totalWidth = 100;  // Total width of the timeline area as percentage
  const daysPerMonth = 30;
  const totalMonths = 12;  // We have 12 months in the timeline (from 11 to 0)
  
  // Each month has equal width in the timeline
  const monthWidth = totalWidth / totalMonths;
  
  // Position of the separation date (red line) - exactly at the left edge of the 0-month column
  // The monthsList is [60, 24, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  // Since we have 15 months shown, with 0 being the last one, the red line is at position:
  // The column positions are at 0, 1/15, 2/15, ..., 14/15 of the total width
  // The 0-month column is the 15th column (index 14), so its left edge is at 14/15 of the way
  const redLinePosition = totalWidth * (14/15);  // This aligns with left edge of 0-month column
  
  // Calculate the position scale factor
  // The 6-month column is at index 8 in the monthsList (counting from 0)
  // So its left edge is at 8/15 of the total width
  const sixMonthColumnPosition = totalWidth * (8.5/15);
  
  // A bar that spans 180 days (6 months) should start at the left edge of the 6-month column
  // and end at the red line (separation date)
  const pixelsFor180Days = redLinePosition - sixMonthColumnPosition;
  
  // Calculate the scale: how many pixels per day
  const pixelsPerDay = pixelsFor180Days / 180;
  
  // Calculate the width of this specific bar
  const duration = bar.startDays - bar.endDays;
  const width = duration * pixelsPerDay;
  
  // Calculate the left position of the bar
  // For bars ending at separation date (endDays = 0), the right edge should align with the red line
  // For other bars, we need to shift them left based on their endDays
  let leftPosition;
  
  if (bar.endDays === 0) {
    // Align the right edge with the red line (separation date)
    leftPosition = redLinePosition - width;
  } else {
    // For bars ending before separation, calculate their distance from the red line
    const endDistanceFromRedLine = bar.endDays * pixelsPerDay;
    leftPosition = redLinePosition - width - endDistanceFromRedLine;
  }

  // Ensure bars don't extend beyond the timeline
  leftPosition = Math.max(0, leftPosition);

  const barStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${leftPosition}%`,
    width: `${width}%`,
    backgroundColor: bar.color,
    height: '32px',
    top: bar.row ? `${bar.row * 40}px` : '0',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
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

  // Icon to show based on the bar ID
  const getBarIcon = () => {
    switch(bar.id) {
      case 'bdd':
        return <div className="w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full mr-1.5"><Info className="w-3 h-3" /></div>;
      case 'disability':
        return <div className="w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full mr-1.5"><FileText className="w-3 h-3" /></div>;
      case 'terminal':
        return <div className="w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full mr-1.5"><Calendar className="w-3 h-3" /></div>;
      case 'work':
        return <div className="w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full mr-1.5"><Briefcase className="w-3 h-3" /></div>;
      case 'skillbridge':
        return <div className="w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full mr-1.5"><GraduationCap className="w-3 h-3" /></div>;
      default:
        return <div className="w-5 h-5 flex items-center justify-center bg-white bg-opacity-20 rounded-full mr-1.5"><Info className="w-3 h-3" /></div>;
    }
  };

  return (
    <>
      <div 
        className="absolute h-8 hover:opacity-90 group"
        style={barStyle}
        onClick={() => setIsInfoModalOpen(true)}
      >
        {/* Bar content with icon */}
        <div className="flex items-center px-2 py-1 text-sm text-white truncate">
          {getBarIcon()}
          <span>{bar.name}</span>
        </div>
        
        {/* Info icon that appears on hover */}
        <div className="hidden group-hover:flex items-center justify-center h-5 w-5 bg-white bg-opacity-20 rounded-full">
          {bar.editable ? <Edit className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
      </div>
      
      {/* Combined info and edit modal */}
      <TimelineBarModal
        bar={bar}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isPremium={isPremium}
        onSubscribe={onSubscribe}
      />
    </>
  );
} 