import React, { useEffect, useRef } from 'react';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { useRiveInputs } from '../../utils/riveInputs';
import { SpeakerIcon, SpeakerButton } from './SpeakerIcon';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

/**
 * Example component demonstrating TTS integration with Pico avatar
 * This shows how the emotion detective components will use TTS with lip-sync
 */
export const TTSExample: React.FC = () => {
  const [ttsState, ttsActions] = useTTSPlayback({ autoConnect: true });
  const [visemes, setVisemes] = React.useState<any[]>([]);
  const [subtitles, setSubtitles] = React.useState<any[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = React.useState('');
  const riveRef = useRef<any>(null);

  // Example texts for different question types
  const exampleTexts = {
    question1: "What emotion is this person showing?",
    question2: "Which face shows someone who is feeling happy?",
    question3: "How would someone feel in this situation: I got a new toy today!",
    question4: "What situation might make someone feel this way?",
    intro: "Welcome to Emotion Detective! I'm Pico, and I'll help you learn about emotions. Let's start by looking at some faces and figuring out how people are feeling!",
    encouragement: "Great job! You're getting really good at recognizing emotions. Let's try another one!",
    mirroring: "Now it's your turn! Can you make the same face as the person in the picture? Look at the camera and try to copy their expression."
  };

  // Update TTS callbacks to capture visemes and subtitles
  useEffect(() => {
    // This would normally be handled by the useTTSPlayback hook
    // but we're demonstrating the integration here
  }, []);

  const handleSpeak = async (text: string) => {
    try {
      await ttsActions.speak({ text });
    } catch (error) {
      console.error('Error speaking:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            TTS + Pico Avatar Integration Demo
            <Badge variant={ttsState.isConnected ? 'default' : 'secondary'}>
              {ttsState.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pico Avatar */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pico Avatar</h3>
              <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                <VideoExpressBuddyAvatar
                  className="w-full h-full"
                  onCurrentSubtitleChange={setCurrentSubtitle}
                />
              </div>
              
              {/* Subtitle Display */}
              <div className="min-h-[3rem] p-3 bg-gray-50 rounded-lg border">
                <p className="text-center text-sm">
                  {currentSubtitle || ttsState.currentSubtitle || 'Subtitles will appear here...'}
                </p>
              </div>

              {/* TTS Status */}
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={ttsState.isPlaying ? 'default' : 'outline'}>
                  {ttsState.isPlaying ? 'Speaking' : 'Ready'}
                </Badge>
                <Badge variant={ttsState.isSupported ? 'default' : 'destructive'}>
                  {ttsState.isSupported ? 'TTS Supported' : 'TTS Not Supported'}
                </Badge>
              </div>

              {ttsState.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{ttsState.error}</p>
                </div>
              )}
            </div>

            {/* Control Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Example Texts</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SpeakerIcon text={exampleTexts.intro} />
                  <span className="text-sm flex-1">Lesson Introduction</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SpeakerIcon text={exampleTexts.question1} />
                  <span className="text-sm flex-1">Question Type 1</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SpeakerIcon text={exampleTexts.question2} />
                  <span className="text-sm flex-1">Question Type 2</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SpeakerIcon text={exampleTexts.question3} />
                  <span className="text-sm flex-1">Question Type 3</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SpeakerIcon text={exampleTexts.question4} />
                  <span className="text-sm flex-1">Question Type 4</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SpeakerIcon text={exampleTexts.encouragement} />
                  <span className="text-sm flex-1">Encouragement</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <SpeakerIcon text={exampleTexts.mirroring} />
                  <span className="text-sm flex-1">Mirroring Instructions</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Speaker Button Examples</h4>
                <div className="space-y-2">
                  <SpeakerButton 
                    text="This is a speaker button with text!" 
                    variant="outline"
                  />
                  <SpeakerButton 
                    text="This button uses a different voice speed." 
                    ttsOptions={{ speed: 0.8 }}
                    variant="secondary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => ttsActions.stop()} 
                    variant="outline"
                    disabled={!ttsState.isPlaying}
                  >
                    Stop All Speech
                  </Button>
                  <Button 
                    onClick={() => handleSpeak("Hello! This is a test of the TTS system with Pico avatar integration.")}
                    disabled={ttsState.isPlaying}
                  >
                    Test Speech
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TTSExample;