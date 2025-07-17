import React from 'react';
import { Button } from '../ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { TTSRequest } from '../../types/emotion-detective';
import { cn } from '../../lib/utils';

export interface SpeakerIconProps {
  text: string;
  ttsOptions?: Partial<TTSRequest>;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Speaker Icon Component
 * Provides a clickable speaker icon that uses TTS to read text aloud
 * Integrates with Pico avatar for lip-sync animation
 */
export const SpeakerIcon: React.FC<SpeakerIconProps> = ({
  text,
  ttsOptions = {},
  variant = 'ghost',
  size = 'icon',
  className,
  showText = false,
  disabled = false,
  'aria-label': ariaLabel
}) => {
  const [ttsState, ttsActions] = useTTSPlayback({ autoConnect: true });

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (ttsState.isPlaying) {
        ttsActions.stop();
      } else {
        await ttsActions.speak({
          text,
          ...ttsOptions
        });
      }
    } catch (error) {
      console.error('❌ SpeakerIcon: Error during speech:', error);
    }
  };

  const isDisabled = disabled || !ttsState.isSupported;
  const isLoading = ttsState.isPlaying;

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (!ttsState.isSupported) {
      return <VolumeX className="h-4 w-4" />;
    }
    
    return <Volume2 className="h-4 w-4" />;
  };

  const getTitle = () => {
    if (!ttsState.isSupported) {
      return 'Text-to-speech not supported in this browser';
    }
    
    if (isLoading) {
      return 'Currently speaking... Click to stop';
    }
    
    return `Click to read aloud: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`;
  };

  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    
    if (!ttsState.isSupported) {
      return 'Text-to-speech not supported';
    }
    
    if (isLoading) {
      return 'Stop reading';
    }
    
    return `Read aloud: ${text}`;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'transition-colors',
        isLoading && 'text-blue-600',
        !ttsState.isSupported && 'text-gray-400 cursor-not-allowed',
        className
      )}
      title={getTitle()}
      aria-label={getAriaLabel()}
    >
      {getIcon()}
      {showText && (
        <span className="ml-2">
          {isLoading ? 'Speaking...' : 'Read Aloud'}
        </span>
      )}
    </Button>
  );
};

/**
 * Inline Speaker Icon
 * A smaller version for inline use within text or cards
 */
export const InlineSpeakerIcon: React.FC<Omit<SpeakerIconProps, 'size' | 'variant'>> = (props) => {
  return (
    <SpeakerIcon
      {...props}
      variant="ghost"
      size="sm"
      className={cn('h-6 w-6 p-1', props.className)}
    />
  );
};

/**
 * Speaker Button with Text
 * A button that shows both icon and text
 */
export const SpeakerButton: React.FC<Omit<SpeakerIconProps, 'showText'>> = (props) => {
  return (
    <SpeakerIcon
      {...props}
      showText={true}
      size="default"
      variant={props.variant || 'outline'}
    />
  );
};

export default SpeakerIcon;