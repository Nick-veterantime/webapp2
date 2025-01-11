import { useState } from 'react';
import { format, subDays, differenceInMonths } from 'date-fns';
import { TimelineBarData } from './TimelineBar';

interface ShareTimelineProps {
  separationDate: Date;
  bars: TimelineBarData[];
}

interface ShareOption {
  id: string;
  label: string;
  key: string;
}

export function ShareTimeline({ separationDate, bars }: ShareTimelineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set(['separationDate', 'terminalLeave', 'availableToWork', 'skillBridge']));

  const shareOptions: ShareOption[] = [
    { id: 'separationDate', label: 'Separation Date', key: 'separationDate' },
    { id: 'terminalLeave', label: 'Terminal Leave', key: 'Terminal Leave' },
    { id: 'availableToWork', label: 'Available to Work Date', key: 'Available to Start Work' },
    { id: 'skillBridge', label: 'SkillBridge Timeline', key: 'SkillBridge' },
  ];

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
  };

  const compileShareText = () => {
    const lines: string[] = [];

    if (selectedOptions.has('separationDate')) {
      const monthsUntil = differenceInMonths(separationDate, new Date());
      lines.push(`Separation Date: ${format(separationDate, 'MMMM do, yyyy')} (${monthsUntil} months until separation)`);
    }

    bars.forEach(bar => {
      const option = shareOptions.find(opt => opt.key === bar.name);
      if (option && selectedOptions.has(option.id)) {
        const startDate = format(subDays(separationDate, bar.startDays), 'MMMM do, yyyy');
        const endDate = format(subDays(separationDate, bar.endDays), 'MMMM do, yyyy');
        lines.push(`${bar.name}: ${startDate} to ${endDate}`);
      }
    });

    lines.push('\nTimeline Built on VeteranTimeline.com');

    return lines.join('\n');
  };

  const handleShare = async () => {
    const text = compileShareText();
    try {
      await navigator.clipboard.writeText(text);
      // Show success message
      alert('Timeline copied to clipboard!');
      setIsOpen(false);
    } catch (err) {
      // Show error message
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Share Timeline
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl text-white mb-4">Share Timeline</h2>
            
            <div className="space-y-3 mb-6">
              {shareOptions.map((option) => (
                <label key={option.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedOptions.has(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-white">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 