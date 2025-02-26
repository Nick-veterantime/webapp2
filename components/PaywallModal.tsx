import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, X } from 'lucide-react';
import { HeartPulse } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export function PaywallModal({ isOpen, onClose, onSubscribe }: PaywallModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] text-white border border-gray-800 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Unlock Premium Resources</DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            You're trying to access a resource link. Upgrade to Premium to unlock all links and save time on your transition journey.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 bg-[#007bff] rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 w-full mb-6">
            <h3 className="font-semibold mb-3 text-left">Premium Features:</h3>
            <ul className="text-left space-y-2">
              <li className="flex items-center">
                <span className="text-[#007bff] mr-2">✓</span>
                Instant access to all resource links
              </li>
              <li className="flex items-center">
                <span className="text-[#007bff] mr-2">✓</span>
                VA forms and documentation
              </li>
              <li className="flex items-center">
                <span className="text-[#007bff] mr-2">✓</span>
                Job search services
              </li>
              <li className="flex items-center">
                <span className="text-[#007bff] mr-2">✓</span>
                Medical and benefits tools
              </li>
            </ul>
          </div>

          <div className="space-y-4 w-full">
            <button 
              onClick={(e) => {
                e.preventDefault();
                onSubscribe();
              }}
              className="w-full bg-[#007bff] hover:bg-[#0056b3] text-white py-3 rounded-lg transition-colors font-medium"
            >
              Subscribe for $30/year
            </button>
            <button
              onClick={onClose}
              className="w-full text-[#007bff] hover:text-[#0056b3] transition-colors font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 