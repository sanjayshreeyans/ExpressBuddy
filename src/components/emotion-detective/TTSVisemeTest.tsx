import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';

/**
 * Simple TTS Viseme Test Component
 * Used to debug and verify that visemes are working correctly
 */
export const TTSVisemeTest: React.FC = () => {
    const [ttsState, ttsActions] = useTTSPlayback({
        autoConnect: true,
        transitionDuration: 21,
        setSpeakingState: true,
        manualSpeakingStateControl: false
    });
    const [riveInputs, setRiveInputs] = useState<any>(null);

    const testPhrases = [
        "Hello! I am your emotion detective helper.",
        "What emotion is this person showing?",
        "Great job! You got it right!",
        "Let's try another one together."
    ];

    const handleTestSpeak = async (text: string) => {
        try {
            console.log('🎵 Testing TTS with:', text);
            await ttsActions.speak({
                text,
                voiceId: 'en-US-JennyNeural',
                speed: 0.9
            });
        } catch (error) {
            console.error('❌ TTS Test Error:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>TTS Viseme Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Avatar */}
                        <div>
                            <Card className="h-[400px]">
                                <CardContent className="p-4 h-full flex flex-col">
                                    <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-blue-50 to-purple-50">
                                        <div className="w-[250px] h-[350px] flex items-center justify-center">
                                            <VideoExpressBuddyAvatar
                                                className="w-full h-full"
                                                onCurrentSubtitleChange={(subtitle: string) => {
                                                    console.log('🎯 Test: Current subtitle changed:', subtitle);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {ttsState.currentSubtitle && (
                                        <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-center text-blue-800 font-medium">
                                            {ttsState.currentSubtitle}
                                        </div>
                                    )}
                                    <div className="text-center text-xs text-muted-foreground mt-1">
                                        {ttsState.isPlaying ? '🎵 Speaking...' : '👋 Ready to test!'}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Controls */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Test Controls</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* TTS State Info */}
                                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                        <div><strong>TTS Connected:</strong> {ttsState.isConnected ? '✅ Yes' : '❌ No'}</div>
                                        <div><strong>Is Playing:</strong> {ttsState.isPlaying ? '🎵 Yes' : '⏸️ No'}</div>
                                        <div><strong>Visemes:</strong> {ttsState.visemes?.length || 0}</div>
                                        <div><strong>Subtitles:</strong> {ttsState.subtitles?.length || 0}</div>
                                        <div><strong>Rive Inputs:</strong> {riveInputs ? '✅ Ready' : '⏳ Loading'}</div>
                                        {ttsState.error && (
                                            <div className="text-red-600"><strong>Error:</strong> {ttsState.error}</div>
                                        )}
                                    </div>

                                    {/* Test Buttons */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Test Phrases:</h4>
                                        {testPhrases.map((phrase, index) => (
                                            <Button
                                                key={index}
                                                onClick={() => handleTestSpeak(phrase)}
                                                disabled={ttsState.isPlaying}
                                                className="w-full text-left justify-start"
                                                variant="outline"
                                            >
                                                {phrase}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Stop Button */}
                                    <Button
                                        onClick={() => ttsActions.stop()}
                                        disabled={!ttsState.isPlaying}
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        Stop Speaking
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TTSVisemeTest;