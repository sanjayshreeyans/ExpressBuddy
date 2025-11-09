import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface DemoExpirationDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog shown when the demo timer expires for unauthenticated users
 */
export function DemoExpirationDialog({ open, onClose }: DemoExpirationDialogProps) {
  const handleEmailClick = () => {
    window.location.href = 'mailto:sanjayshreeyans@gmail.com?subject=ExpressBuddy Demo Request';
  };

  const handleSignUpClick = () => {
    window.location.href = '/login';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-['Volkhov',serif] text-[#181e4b]">
            Thanks for Trying ExpressBuddy! 🎉
          </DialogTitle>
          <DialogDescription className="text-base font-['Poppins',sans-serif] text-[#5e6282] space-y-4 pt-4">
            <p>
              <strong className="text-[#181e4b]">ExpressBuddy is under research preview.</strong>
            </p>
            <p>
              Thank you for trying our demo! We hope you enjoyed meeting Pico and experiencing our AI-powered communication tools for children.
            </p>
            <p>
              If you would like to demo the full product with unlimited access, please:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create a free account to continue chatting with Pico</li>
              <li>Or email us at <strong className="text-[#df6951]">sanjayshreeyans@gmail.com</strong> for a full product demo</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button
            onClick={handleSignUpClick}
            className="w-full sm:w-auto bg-[#df6951] hover:bg-[#c85a43] text-white font-['Poppins',sans-serif] rounded-xl"
          >
            Sign Up Free
          </Button>
          <Button
            onClick={handleEmailClick}
            variant="outline"
            className="w-full sm:w-auto border-[#df6951] text-[#df6951] hover:bg-[#df6951] hover:text-white font-['Poppins',sans-serif] rounded-xl"
          >
            Email Us
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full sm:w-auto text-[#5e6282] hover:text-[#181e4b] font-['Poppins',sans-serif]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
