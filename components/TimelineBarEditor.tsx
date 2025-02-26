import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TimelineBarData } from './TimelineBar';

interface TimelineBarEditorProps {
  bar: TimelineBarData;
  onUpdate: (bar: TimelineBarData) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function TimelineBarEditor({ bar, onUpdate, open, onOpenChange }: TimelineBarEditorProps) {
  const [editedBar, setEditedBar] = useState<TimelineBarData>(bar);

  const handleSave = () => {
    onUpdate(editedBar);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-gray-200">
        <DialogHeader>
          <DialogTitle>Edit Timeline Bar</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Name
            </label>
            <input
              id="name"
              value={editedBar.name}
              onChange={(e) => setEditedBar({ ...editedBar, name: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-700 rounded-md p-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right">Color</label>
            <div className="col-span-3 flex flex-wrap gap-2">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="startDays" className="text-right">
              Start Days
            </label>
            <input
              id="startDays"
              type="number"
              value={editedBar.startDays}
              onChange={(e) => setEditedBar({ ...editedBar, startDays: Math.max(0, parseInt(e.target.value)) })}
              className="col-span-3 bg-gray-800 border border-gray-700 rounded-md p-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="endDays" className="text-right">
              End Days
            </label>
            <input
              id="endDays"
              type="number"
              value={editedBar.endDays}
              onChange={(e) => setEditedBar({ ...editedBar, endDays: Math.max(0, parseInt(e.target.value)) })}
              className="col-span-3 bg-gray-800 border border-gray-700 rounded-md p-2"
            />
          </div>
          
          {/* Description field */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label htmlFor="description" className="text-right">
              Description
            </label>
            <textarea
              id="description"
              value={editedBar.description || ''}
              onChange={(e) => setEditedBar({ ...editedBar, description: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-700 rounded-md p-2 min-h-[80px]"
              placeholder="Enter a description of this timeline bar"
            />
          </div>
          
          {/* Link field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="link" className="text-right">
              Resource Link
            </label>
            <input
              id="link"
              type="url"
              value={editedBar.link || ''}
              onChange={(e) => setEditedBar({ ...editedBar, link: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-700 rounded-md p-2"
              placeholder="https://example.com"
            />
          </div>
          
          {/* Link text field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="linkedText" className="text-right">
              Link Text
            </label>
            <input
              id="linkedText"
              type="text"
              value={editedBar.linkedText || ''}
              onChange={(e) => setEditedBar({ ...editedBar, linkedText: e.target.value })}
              className="col-span-3 bg-gray-800 border border-gray-700 rounded-md p-2"
              placeholder="Learn more"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 