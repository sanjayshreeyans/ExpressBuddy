import React from 'react';
import { Button } from '../ui/button';
import { Lightbulb } from 'lucide-react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

export function SimpleHintButton() {
  const { client, connected } = useLiveAPIContext();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleHintClick = async () => {
    if (!connected || !client || isProcessing) {
      console.log('❌ Cannot send hint - not connected or already processing');
      return;
    }

    setIsProcessing(true);
    
    try {
      const hintMessage = "🎯 HINT: The child might need help or encouragement. Try giving a helpful suggestion or asking a different question to help them continue the conversation. Look at their camera to check their emotion and provide supportive guidance.";
      
      console.log('📤 Sending hint to Gemini:', hintMessage);
      
      // Send hint directly to Gemini
      const textPart = { text: hintMessage };
      client.send(textPart, true);
      
      console.log('✅ Hint sent successfully');
      
      // Show success feedback briefly
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to send hint:', error);
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleHintClick}
      disabled={!connected || isProcessing}
      variant="outline"
      // Use gap-0 to remove all default flex spacing
      className="flex flex-col items-center justify-center gap-0 font-bold hover:bg-yellow-400 transition-all duration-200 transform hover-scale-105"
      style={{
        backgroundColor: '#FFD700',
        color: '#000000',
        border: '2px solid #FFA500',
        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5)',
        borderRadius: '16px',
        width: '80px',
        height: '50px', // Adjusted height for the new layout
        padding: '0', 
      }}
    >
      <Lightbulb 
        className={`h-8 w-8 ${isProcessing ? 'animate-pulse text-orange-600' : 'text-orange-600'}`} 
      />
      {/* KEY CHANGE: Added -mt-1 to pull the text up.
        You can make this value more negative (e.g., -mt-1.5) for an even tighter fit.
      */}
      <span className="text-xs font-semibold leading-none -mt-3.5">
        {isProcessing ? 'Sending...' : 'Get Hint'}
      </span>
    </Button>
  );
}