import { useState, useEffect, useRef } from 'react';
import { format, subDays, differenceInMonths } from 'date-fns';
import { TimelineBarData } from './TimelineBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Check } from 'lucide-react';

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
  const [isCopied, setIsCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
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

  const handleQuickShare = async () => {
    try {
      const shareText = compileShareText();
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleShare = async () => {
    try {
      const shareText = compileShareText();
      if (navigator.share) {
        await navigator.share({
          title: 'My Veteran Timeline',
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleQuickShare}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
          className={`h-9 px-4 text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-2.5 ${
            isCopied 
              ? 'bg-[#4CCEAD] text-white min-w-[100px]' 
              : 'bg-[#4CCEAD]/10 text-[#4CCEAD] hover:bg-[#4CCEAD]/20 min-w-[90px]'
          }`}
        >
          {isCopied ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Copied</span>
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </motion.div>
            </AnimatePresence>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-start justify-center z-[200] backdrop-blur-sm">
          <div 
            ref={popupRef}
            className="bg-[#1A1B1E] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800/60 shadow-xl mt-[20vh] relative"
          >
            <h2 className="text-xl font-medium text-gray-100 mb-4">Customize Share Options</h2>
            
            <div className="space-y-3 mb-6">
              {shareOptions.map((option) => (
                <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOptions.has(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-[#4CCEAD] focus:ring-[#4CCEAD] focus:ring-offset-gray-900"
                  />
                  <span className="text-gray-200 text-sm">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 text-sm font-medium bg-[#4CCEAD] text-white rounded-lg hover:bg-[#4CCEAD]/90 transition-colors"
              >
                Share Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 