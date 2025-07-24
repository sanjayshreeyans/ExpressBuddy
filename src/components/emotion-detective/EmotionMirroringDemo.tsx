import React, { useState } from 'react';
import { EmotionMirroring } from './EmotionMirroring';
import { FaceImageData } from '../../types/emotion-detective';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Camera, Sparkles, Heart, Star } from 'lucide-react';

export const EmotionMirroringDemo: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState('happy');
  const [lastResult, setLastResult] = useState<{ score: number; success: boolean } | null>(null);

  // Reference images for emotion mirroring (using the correct /Faces/ directory path)
  const sampleImages: Record<string, FaceImageData> = {
    happy: {
      id: '1',
      filename: '140_y_f_h_a.jpg',
      age: 25,
      gender: 'female',
      emotion: 'happy',
      variant: 1,
      path: '/Faces/140_y_f_h_a.jpg'
    },
    sad: {
      id: '2',
      filename: '066_y_m_s_a.jpg',
      age: 30,
      gender: 'male',
      emotion: 'sad',
      variant: 1,
      path: '/Faces/066_y_m_s_a.jpg'
    },
    angry: {
      id: '3',
      filename: '079_o_f_a_a.jpg',
      age: 28,
      gender: 'female',
      emotion: 'angry',
      variant: 1,
      path: '/Faces/079_o_f_a_a.jpg'
    },
    surprised: {
      id: '4',
      filename: '116_m_m_h_a.jpg',
      age: 35,
      gender: 'male',
      emotion: 'surprised',
      variant: 1,
      path: '/Faces/116_m_m_h_a.jpg'
    },
    neutral: {
      id: '5',
      filename: '168_m_f_n_a.jpg',
      age: 22,
      gender: 'female',
      emotion: 'neutral',
      variant: 1,
      path: '/Faces/168_m_f_n_a.jpg'
    }
  };

  const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral'];

  const handleMirroringComplete = (score: number, success: boolean) => {
    console.log('Mirroring completed:', { score, success });
    setLastResult({ score, success });
    setIsActive(false);
  };

  const handleRetry = () => {
    console.log('Retrying mirroring...');
  };

  const startMirroring = () => {
    setLastResult(null);
    setIsActive(true);
  };

  const stopMirroring = () => {
    setIsActive(false);
  };

  if (isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="container mx-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Emotion Detective
              </h1>
            </div>
            <Button
              onClick={stopMirroring}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm"
            >
              Back to Menu
            </Button>
          </div>

          <EmotionMirroring
            targetEmotion={selectedEmotion}
            referenceImage={sampleImages[selectedEmotion] || sampleImages.happy}
            onMirroringComplete={handleMirroringComplete}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Fun Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-purple-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Emotion Detective
            </h1>
            <Heart className="w-10 h-10 text-pink-500" />
          </div>
          <p className="text-xl text-gray-700 font-medium">
            Choose an emotion and practice making that face!
          </p>
        </div>

        {/* Emotion Selection - Fun Style */}
        <Card className="mb-8 border-4 border-purple-200 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Star className="w-6 h-6 text-yellow-500" />
              <CardTitle className="text-2xl text-purple-600">Pick Your Emotion!</CardTitle>
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center items-center gap-4 flex-wrap">
              <label className="text-lg font-bold text-gray-700">I want to practice:</label>
              <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                <SelectTrigger className="w-48 h-12 text-lg border-2 border-purple-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emotions.map(emotion => (
                    <SelectItem key={emotion} value={emotion} className="text-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {emotion === 'happy' && '😊'}
                          {emotion === 'sad' && '😢'}
                          {emotion === 'angry' && '😠'}
                          {emotion === 'surprised' && '😲'}
                          {emotion === 'neutral' && '😐'}
                        </span>
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={startMirroring}
                size="lg"
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold text-xl px-8 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Camera className="w-8 h-8 mr-3" />
                Let's Play!
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Result - Fun Style */}
        {lastResult && (
          <Card className="mb-8 border-4 border-green-200 shadow-2xl bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-600">Your Last Score!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center items-center gap-4 flex-wrap">
                <Badge
                  variant={lastResult.success ? "default" : "secondary"}
                  className="text-lg px-4 py-2"
                >
                  {lastResult.success ? '🎉 Success!' : '👍 Good Try!'}
                </Badge>
                <div className="text-3xl font-bold text-purple-600">
                  {lastResult.score}/100 points!
                </div>
              </div>
              <div className="mt-4 text-6xl">
                {lastResult.score >= 80 ? '⭐⭐⭐' : lastResult.score >= 60 ? '⭐⭐' : '⭐'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions - Kid Friendly */}
        <Card className="border-4 border-blue-200 shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Heart className="w-6 h-6 text-pink-500" />
              <CardTitle className="text-2xl text-blue-600">How to Play</CardTitle>
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <span>Pick an emotion you want to practice</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <span>Click "Let's Play!" to start</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <span>Allow the camera to see your face</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                  <span>Look at the example picture</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                  <span>Make the same face as the picture</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">6</div>
                  <span>Click "Take Photo!" when ready</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-100 rounded-2xl border-2 border-yellow-300">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <h4 className="font-bold text-yellow-800">Fun Tip!</h4>
              </div>
              <p className="text-yellow-800">
                You get 3 tries for each emotion. The better you copy the face, the more points you earn! 🌟
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmotionMirroringDemo;