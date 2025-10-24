import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface ChallengeIntroCardProps {
  onStart: () => void;
  onLearnMore: () => void;
  onClose?: () => void;
}

export function ChallengeIntroCard({ onStart, onLearnMore, onClose }: ChallengeIntroCardProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Piko Needs Your Help!
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Piko is at a restaurant and wants to order food, but he's not sure what to say.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Your Mission:</h3>
            <p className="text-sm text-blue-800">
              Teach Piko how to order food politely at a restaurant! Help him learn what to say 
              when the waiter comes over. Can you show him the right way to ask for food?
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Level 1: Help Piko</h3>
            <p className="text-sm text-green-800">
              Piko is nervous and confused. Give him advice and teach him what to do. 
              You'll see a checklist on the right showing what Piko needs to learn!
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              onClick={onStart} 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
              size="lg"
            >
              Start Challenge
            </Button>
            <Button 
              onClick={onLearnMore} 
              variant="outline" 
              className="flex-1 py-6 text-lg font-semibold"
              size="lg"
            >
              Learn More
            </Button>
          </div>

          {onClose && (
            <Button 
              onClick={onClose} 
              variant="ghost" 
              className="w-full text-gray-500"
            >
              Maybe Later
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
