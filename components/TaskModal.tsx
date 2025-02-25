import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lock, AlertTriangle } from 'lucide-react';

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

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  isPremium: boolean;
  isStripeBlocked?: boolean;
}

export function TaskModal({ task, isOpen, onClose, onSubscribe, isPremium, isStripeBlocked = false }: TaskModalProps) {
  if (!task) return null;

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isPremium) {
      onSubscribe();
      return;
    }
    
    if (task.link) {
      window.open(task.link, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#000000] text-white border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">{task.task}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Task details and resources
          </DialogDescription>
        </DialogHeader>

        {isStripeBlocked && !isPremium && (
          <div className="mt-4 p-3 bg-amber-950/50 border border-amber-800/50 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-medium">Ad blocker detected</p>
              <p className="text-amber-400/80 text-sm mt-1">
                Please disable your ad blocker or privacy extensions to access premium content.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Task Description - Free for all users */}
          <div>
            <p className="text-gray-300 leading-relaxed">{task.description}</p>
          </div>

          {/* Resource Link Section */}
          {task.link && (
            <div className="mt-4">
              {isPremium ? (
                <a
                  href={task.link}
                  onClick={handleLinkClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center sm:justify-start px-4 py-3 sm:p-0 text-[#007BFF] hover:text-[#0056B3] active:text-[#004494] transition-colors rounded-lg sm:rounded-none hover:bg-[#007BFF]/5 sm:hover:bg-transparent"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-describedby="resource-link-description"
                >
                  {task.linkedText || 'Learn More'} →
                </a>
              ) : (
                <div className="w-full">
                  <button 
                    onClick={onSubscribe}
                    className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-3 px-4 py-3 sm:p-0 text-gray-400 hover:text-[#007BFF] active:text-[#004494] transition-all rounded-lg sm:rounded-none hover:bg-[#007BFF]/5 sm:hover:bg-transparent group"
                    aria-describedby="subscription-description"
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
                  <div id="subscription-description" className="sr-only">
                    Subscribe to access premium resource links and content
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 