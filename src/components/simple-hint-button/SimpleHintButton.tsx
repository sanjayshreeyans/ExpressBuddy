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
      style={{
        backgroundColor: '#FFD700', // Bright yellow
        color: '#000000', // Black text for contrast
        border: '2px solid #FFA500', // Orange border
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5)', // Yellow glow
        fontSize: '14px',
        padding: '8px 20px', // Increased horizontal padding
        borderRadius: '12px',
        minWidth: '120px' // Increased minimum width
      }}
      className="flex items-center gap-2 hover:bg-yellow-400 transition-all duration-200 transform hover:scale-105"
    >
      <Lightbulb className={`h-4 w-4 ${isProcessing ? 'animate-pulse text-orange-600' : 'text-orange-600'}`} />
      <span className="font-semibold">
        {isProcessing ? 'Sending...' : 'Get Hint'}
      </span>
    </Button>
  );
}
