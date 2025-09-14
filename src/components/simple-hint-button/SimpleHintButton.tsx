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
      size="sm"
      className="flex items-center gap-2"
    >
      <Lightbulb className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
      {isProcessing ? 'Sending Hint...' : 'Get Hint'}
    </Button>
  );
}
