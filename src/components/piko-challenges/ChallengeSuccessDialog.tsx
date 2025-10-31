import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface ChallengeSuccessDialogProps {
  onContinue: () => void;
  onRestart: () => void;
}

export function ChallengeSuccessDialog({ onContinue, onRestart }: ChallengeSuccessDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center space-y-3">
          <CardTitle className="text-3xl font-bold text-green-600">
            Amazing Job!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <p className="text-lg text-green-900 font-semibold mb-3">
              "Thank you SO much! You taught me exactly what to do!"
            </p>
            <p className="text-base text-green-800">
              - Piko the Panda
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 font-medium mb-2">
              My panda confidence is growing!
            </p>
            <p className="text-sm text-yellow-800">
              Now I know how to order food at a restaurant! You're an amazing teacher!
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={onContinue} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg"
              size="lg"
            >
              Unlock Level 2
            </Button>
            <Button 
              onClick={onRestart} 
              variant="outline" 
              className="w-full py-4"
            >
              Try Again
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Level 2 coming soon! You can restart this challenge to practice more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
