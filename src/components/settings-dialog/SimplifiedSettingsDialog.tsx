/**
 * Simplified Settings Dialog using only Shadcn components
 * Includes: Voice Selection and Background Video Selection
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// Available voice options
const VOICE_OPTIONS = [
  { id: "Puck", name: "Puck (Default)" },
  { id: "Charon", name: "Charon" },
  { id: "Kore", name: "Kore" },
  { id: "Fenrir", name: "Fenrir" },
  { id: "Aoede", name: "Aoede" },
];

interface BackgroundOption {
  id: string;
  name: string;
  path: string;
  thumbnail?: string;
}

interface SimplifiedSettingsDialogProps {
  currentBackground: string;
  onBackgroundChange: (backgroundPath: string) => void;
}

export default function SimplifiedSettingsDialog({
  currentBackground,
  onBackgroundChange,
}: SimplifiedSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { config, setConfig, connected } = useLiveAPIContext();
  const [selectedVoice, setSelectedVoice] = useState<string>("Puck");
  const [selectedBackground, setSelectedBackground] = useState<string>(currentBackground);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundOption[]>([]);

  // Scan for available background videos dynamically
  useEffect(() => {
    const scanBackgrounds = async () => {
      const backgrounds: BackgroundOption[] = [
        {
          id: "none",
          name: "No Background",
          path: "",  // Empty path means no background
        },
      ];

      // Known video files to check - we'll try to fetch them
      // This list will be automatically discovered by checking common naming patterns
      const potentialVideos = [
        'AnimatedVideoBackgroundLooping1',
        'haloweenbackground',
      ];

      console.log('🔍 Scanning for background videos...');

      // Check each potential video
      for (const videoName of potentialVideos) {
        const videoPath = `/Backgrounds/${videoName}.mp4`;
        const thumbnailPath = `/Backgrounds/${videoName}_thumb.jpg`;

        try {
          // Try to fetch the video file to see if it exists
          const videoResponse = await fetch(videoPath, { method: 'HEAD' });
          
          if (videoResponse.ok) {
            console.log(`✅ Found video: ${videoName}`);
            
            // Check if thumbnail exists
            let hasThumbnail = false;
            try {
              const thumbResponse = await fetch(thumbnailPath, { method: 'HEAD' });
              hasThumbnail = thumbResponse.ok;
              if (hasThumbnail) {
                console.log(`  ✅ Found thumbnail: ${videoName}_thumb.jpg`);
              }
            } catch (err) {
              console.log(`  ⚠️ No thumbnail for: ${videoName}`);
            }

            // Generate a friendly display name
            const displayName = videoName
              .replace(/([A-Z])/g, ' $1') // Add space before capitals
              .replace(/background/gi, '') // Remove "background" word
              .replace(/looping/gi, '') // Remove "looping" word
              .replace(/video/gi, '') // Remove "video" word
              .replace(/animated/gi, '') // Remove "animated" word
              .replace(/_/g, ' ') // Replace underscores with spaces
              .replace(/\s+/g, ' ') // Remove extra spaces
              .trim() || videoName; // Fallback to original name

            backgrounds.push({
              id: videoName.toLowerCase(),
              name: displayName.charAt(0).toUpperCase() + displayName.slice(1), // Capitalize first letter
              path: videoPath,
              thumbnail: hasThumbnail ? thumbnailPath : undefined,
            });
          }
        } catch (err) {
          // Video doesn't exist, skip it
        }
      }

      console.log(`🎉 Found ${backgrounds.length - 1} background videos`);
      setAvailableBackgrounds(backgrounds);
    };

    scanBackgrounds();
  }, []);

  // Get current voice from config
  useEffect(() => {
    const voice = config.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName || "Puck";
    setSelectedVoice(voice);
  }, [config]);

  // Update voice in config
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    
    const newConfig = {
      ...config,
      speechConfig: {
        ...config.speechConfig, // Preserve other speech settings
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceId,
          },
        },
      },
    };
    
    console.log('🎙️ Changing voice to:', voiceId);
    console.log('📝 New config:', newConfig);
    setConfig(newConfig);
  };

  // Update background
  const handleBackgroundChange = (backgroundId: string) => {
    const background = availableBackgrounds.find(bg => bg.id === backgroundId);
    if (background) {
      setSelectedBackground(background.path);
      onBackgroundChange(background.path);
    }
  };

  const handleApply = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="action-button">
          <span className="material-symbols-outlined">settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px] bg-white max-h-[85vh] overflow-y-auto" 
        style={{ 
          backgroundColor: 'white', 
          maxHeight: '85vh',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your ExpressBuddy experience. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Voice Selection */}
          <div className="space-y-3">
            <Label htmlFor="voice-select" className="text-base font-semibold">
              Character Voice
            </Label>
            <Select
              value={selectedVoice}
              onValueChange={handleVoiceChange}
              disabled={connected}
            >
              <SelectTrigger id="voice-select" className="w-full bg-white" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent className="bg-white" style={{ backgroundColor: 'white' }}>
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id} className="bg-white hover:bg-gray-100" style={{ backgroundColor: 'white' }}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {connected && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Disconnect to change voice settings
              </p>
            )}
          </div>

          {/* Background Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Background Video
            </Label>
            <RadioGroup
              value={selectedBackground}
              onValueChange={(value) => {
                const background = availableBackgrounds.find(bg => bg.path === value);
                if (background) {
                  handleBackgroundChange(background.id);
                }
              }}
              className="grid grid-cols-2 gap-4"
            >
              {availableBackgrounds.map((background) => (
                <Card
                  key={background.id}
                  className={`cursor-pointer transition-all hover:border-primary bg-white ${
                    selectedBackground === background.path ? 'border-primary border-2' : ''
                  }`}
                  style={{ backgroundColor: 'white' }}
                  onClick={() => handleBackgroundChange(background.id)}
                >
                  <CardContent className="p-4 space-y-2 bg-white" style={{ backgroundColor: 'white' }}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={background.path} id={background.id} />
                      <Label
                        htmlFor={background.id}
                        className="font-medium cursor-pointer flex-1"
                      >
                        {background.name}
                      </Label>
                    </div>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                      {background.id === "none" ? (
                        <div className="text-center p-4">
                          <span className="material-symbols-outlined text-4xl text-muted-foreground">
                            block
                          </span>
                          <p className="text-xs text-muted-foreground mt-2">
                            Solid Color
                          </p>
                        </div>
                      ) : background.thumbnail ? (
                        <img
                          src={background.thumbnail}
                          alt={background.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <span className="material-symbols-outlined text-4xl text-muted-foreground">
                            video_library
                          </span>
                          <p className="text-xs text-muted-foreground mt-2">
                            Video Preview
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              💡 Add more videos to <code className="text-xs bg-muted px-1 py-0.5 rounded">/public/Backgrounds/</code> to see them here
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
