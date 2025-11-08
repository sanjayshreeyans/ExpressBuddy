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
import { Slider } from "../ui/slider";

// Available voice options
const VOICE_OPTIONS = [
  { id: "Puck", name: "Puck (Default)" },
  { id: "Charon", name: "Charon" },
  { id: "Kore", name: "Kore" },
  { id: "Fenrir", name: "Fenrir" },
  { id: "Aoede", name: "Aoede" },
];

const LANGUAGE_OPTIONS = [
  { code: "en-US", name: "English (United States)" },
  { code: "en-GB", name: "English (United Kingdom)" },
  { code: "en-AU", name: "English (Australia)" },
  { code: "en-IN", name: "English (India)" },
  { code: "es-US", name: "Español (Estados Unidos)" },
  { code: "es-ES", name: "Español (España)" },
  { code: "fr-FR", name: "Français (France)" },
  { code: "fr-CA", name: "Français (Canada)" },
  { code: "de-DE", name: "Deutsch (Deutschland)" },
  { code: "pt-BR", name: "Português (Brasil)" },
  { code: "hi-IN", name: "हिन्दी - Hindi" },
  { code: "bn-IN", name: "বাংলা - Bengali" },
  { code: "gu-IN", name: "ગુજરાતી - Gujarati" },
  { code: "kn-IN", name: "ಕನ್ನಡ - Kannada" },
  { code: "mr-IN", name: "मराठी - Marathi" },
  { code: "ml-IN", name: "മലയാളം - Malayalam" },
  { code: "ta-IN", name: "தமிழ் - Tamil" },
  { code: "te-IN", name: "తెలుగు - Telugu" },
  { code: "ja-JP", name: "日本語 - Japanese" },
  { code: "ko-KR", name: "한국어 - Korean" },
  { code: "cmn-CN", name: "普通话 - Mandarin" },
  { code: "th-TH", name: "ไทย - Thai" },
  { code: "vi-VN", name: "Tiếng Việt - Vietnamese" },
  { code: "id-ID", name: "Bahasa Indonesia" },
  { code: "it-IT", name: "Italiano - Italian" },
  { code: "nl-NL", name: "Nederlands - Dutch" },
  { code: "pl-PL", name: "Polski - Polish" },
  { code: "ru-RU", name: "Русский - Russian" },
  { code: "tr-TR", name: "Türkçe - Turkish" },
  { code: "ar-XA", name: "العربية - Arabic" },
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
  audioRecorder?: any; // Optional: AudioRecorder instance to update settings
}

const STORAGE_AUDIO_SETTINGS_KEY = "expressbuddy_audio_preprocessor_settings_v1";

export default function SimplifiedSettingsDialog({
  currentBackground,
  onBackgroundChange,
  audioRecorder,
}: SimplifiedSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { config, setConfig, connected } = useLiveAPIContext();
  const [selectedVoice, setSelectedVoice] = useState<string>("Puck");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-US");
  const [selectedBackground, setSelectedBackground] = useState<string>(currentBackground);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundOption[]>([]);
  const [isUserChangingSettings, setIsUserChangingSettings] = useState(false);

  // Audio preprocessing settings
  const [audioSettings, setAudioSettings] = useState<{
    gainBoost: number;
    noiseGateThreshold: number;
    compressionThreshold: number;
  }>({
    gainBoost: 2.5,
    noiseGateThreshold: 0.4,
    compressionThreshold: 0.38,
  });
  const { gainBoost, noiseGateThreshold, compressionThreshold } = audioSettings;
  const [showAdvancedAudio, setShowAdvancedAudio] = useState(false);

  // Load persisted audio settings once audio recorder is available
  useEffect(() => {
    if (!audioRecorder) return;

    let applied = false;
    try {
      const stored = localStorage.getItem(STORAGE_AUDIO_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAudioSettings((prev) => ({
          gainBoost: parsed.gainBoost ?? prev.gainBoost,
          noiseGateThreshold: parsed.noiseGateThreshold ?? prev.noiseGateThreshold,
          compressionThreshold: parsed.compressionThreshold ?? prev.compressionThreshold,
        }));
        applied = true;
      }
    } catch (error) {
      console.warn("Could not load audio preprocessing settings:", error);
    }

    if (!applied && typeof audioRecorder.getPreprocessorSettings === "function") {
      const recorderSettings = audioRecorder.getPreprocessorSettings();
      if (recorderSettings) {
        setAudioSettings((prev) => ({
          gainBoost: recorderSettings.gainBoost ?? prev.gainBoost,
          noiseGateThreshold: recorderSettings.noiseGateThreshold ?? prev.noiseGateThreshold,
          compressionThreshold: recorderSettings.compressionThreshold ?? prev.compressionThreshold,
        }));
      }
    }
  }, [audioRecorder]);

  // Persist audio settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
    } catch (error) {
      console.warn("Could not persist audio preprocessing settings:", error);
    }
  }, [audioSettings]);

  // Push settings to active audio recorder
  useEffect(() => {
    if (!audioRecorder || typeof audioRecorder.updatePreprocessorSettings !== "function") {
      return;
    }
    audioRecorder.updatePreprocessorSettings(audioSettings);
  }, [audioRecorder, audioSettings]);

  // Storage keys for preferences
  const STORAGE_VOICE_KEY = "expresbuddy_preferred_voice";
  const STORAGE_LANGUAGE_KEY = "expresbuddy_preferred_language";

  // Load preferences from local storage on mount
  useEffect(() => {
    try {
      const storedVoice = localStorage.getItem(STORAGE_VOICE_KEY);
      const storedLanguage = localStorage.getItem(STORAGE_LANGUAGE_KEY);

      if (storedVoice) {
        console.log('📦 Loaded voice from storage:', storedVoice);
        setSelectedVoice(storedVoice);
      }

      if (storedLanguage) {
        console.log('📦 Loaded language from storage:', storedLanguage);
        setSelectedLanguage(storedLanguage);
      }
    } catch (err) {
      console.error('❌ Error loading preferences from storage:', err);
    }
  }, []);

  // Scan for available background videos dynamically from manifest
  useEffect(() => {
    const scanBackgrounds = async () => {
      const backgrounds: BackgroundOption[] = [
        {
          id: "none",
          name: "No Background",
          path: "",  // Empty path means no background
        },
      ];

      console.log('🔍 Loading background videos from manifest...');

      try {
        // Load the manifest file that lists all available backgrounds
        const manifestResponse = await fetch('/Backgrounds/manifest.json');
        if (!manifestResponse.ok) {
          console.error('❌ Failed to load manifest:', manifestResponse.status);
          setAvailableBackgrounds(backgrounds);
          return;
        }

        const manifest = await manifestResponse.json();
        console.log('📋 Manifest loaded:', manifest);

        // Process each background entry from the manifest
        for (const bgEntry of manifest.backgrounds || []) {
          const videoName = bgEntry.filename;
          const displayName = bgEntry.displayName || videoName;
          const videoPath = `/Backgrounds/${videoName}.mp4`;
          const thumbnailPath = bgEntry.thumbnail;

          try {
            // Verify the video file exists
            const videoResponse = await fetch(videoPath, { method: 'HEAD' });
            if (!videoResponse.ok) {
              console.warn(`⚠️ Video not found: ${videoPath}`);
              continue;
            }

            console.log(`✅ Found video: ${videoName}`);
            if (thumbnailPath) {
              console.log(`  ✅ Using thumbnail: ${thumbnailPath}`);
            }

            backgrounds.push({
              id: videoName.toLowerCase(),
              name: displayName,
              path: videoPath,
              thumbnail: thumbnailPath,
            });
          } catch (err) {
            console.error(`❌ Error processing video ${videoName}:`, err);
          }
        }

        console.log(`🎉 Found ${backgrounds.length - 1} background videos`);
        setAvailableBackgrounds(backgrounds);
      } catch (err) {
        console.error('❌ Error scanning backgrounds:', err);
        setAvailableBackgrounds(backgrounds);
      }
    };

    scanBackgrounds();
  }, []);

  // Get current voice and language from config (only when not actively changing)
  useEffect(() => {
    if (isUserChangingSettings) {
      console.log('⏭️ Skipping config sync - user is actively changing settings');
      return;
    }

    const voice = config.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName || "Puck";
    const lang = (config as any)?.speechConfig?.language_code || "en-US";

    console.log('🔄 Syncing UI from config:', { voice, lang });
    setSelectedVoice(voice);
    setSelectedLanguage(lang);
  }, [config, isUserChangingSettings]);

  // Reset user changing flag when dialog closes
  useEffect(() => {
    if (!open) {
      setIsUserChangingSettings(false);
    }
  }, [open]);

  // Update voice in config
  const handleVoiceChange = (voiceId: string) => {
    setIsUserChangingSettings(true);
    setSelectedVoice(voiceId);

    // Save to local storage
    try {
      localStorage.setItem(STORAGE_VOICE_KEY, voiceId);
      console.log('💾 Saved voice preference to storage:', voiceId);
    } catch (err) {
      console.error('❌ Error saving voice to storage:', err);
    }

    const newConfig = {
      ...config,
      speechConfig: {
        ...config.speechConfig,
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceId,
          },
        },
      },
    };

    console.log('🎙️ Changing voice to:', voiceId);
    setConfig(newConfig);
  };

  const handleLanguageChange = (langCode: string) => {
    console.log('🌐 User selected language:', langCode);
    setIsUserChangingSettings(true);
    setSelectedLanguage(langCode);

    // Save to local storage
    try {
      localStorage.setItem(STORAGE_LANGUAGE_KEY, langCode);
      console.log('💾 Saved language preference to storage:', langCode);
    } catch (err) {
      console.error('❌ Error saving language to storage:', err);
    }

    const newConfig: any = {
      ...config,
      speechConfig: {
        ...config.speechConfig,
        language_code: langCode,
      },
      inputAudioTranscription: {
        ...(config as any).inputAudioTranscription,
        language: langCode,
        languageCode: langCode,
      },
      outputAudioTranscription: {
        ...(config as any).outputAudioTranscription,
        language: langCode,
        languageCode: langCode,
      },
    };

    console.log("✅ Language config updated to:", langCode);
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
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        }}
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your ExpressBuddy experience. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="language-select" className="text-base font-semibold">
              Language
            </Label>
            <Select
              value={selectedLanguage}
              onValueChange={handleLanguageChange}
              disabled={connected}
            >
              <SelectTrigger id="language-select" className="w-full bg-white" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent
                className="bg-white max-h-[300px] overflow-y-auto"
                style={{ backgroundColor: 'white', zIndex: 10001 }}
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="bg-white hover:bg-gray-100" style={{ backgroundColor: 'white' }}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {connected && (
              <p className="text-sm text-muted-foreground">
                Disconnect to change language
              </p>
            )}
          </div>

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
              <SelectContent
                className="bg-white"
                style={{ backgroundColor: 'white', zIndex: 10001 }}
              >
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id} className="bg-white hover:bg-gray-100" style={{ backgroundColor: 'white' }}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {connected && (
              <p className="text-sm text-muted-foreground">
                Disconnect to change voice
              </p>
            )}
          </div>

          {/* Audio Preprocessing Settings */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">equalizer</span>
                <Label className="text-base font-semibold">Audio Presets</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedAudio((val) => !val)}
                className="text-xs"
              >
                <span className="material-symbols-outlined text-sm mr-1">
                  {showAdvancedAudio ? 'expand_less' : 'expand_more'}
                </span>
                {showAdvancedAudio ? 'Hide advanced' : 'Show advanced'}
              </Button>
            </div>

            {/* Preset Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setAudioSettings((prev) => ({
                    ...prev,
                    gainBoost: 2.8,
                    noiseGateThreshold: 0.015,
                    compressionThreshold: 0.45,
                  }));
                }}
                className="flex-1 bg-rose-500 text-white hover:bg-rose-500/90 shadow-sm"
              >
                <span className="material-symbols-outlined text-lg mr-2">hearing</span>
                Quiet Voice
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setAudioSettings((prev) => ({
                    ...prev,
                    gainBoost: 2.5,
                    noiseGateThreshold: 0.4,
                    compressionThreshold: 0.38,
                  }));
                }}
                className="flex-1 bg-teal-500 text-white hover:bg-teal-500/90 shadow-sm"
              >
                <span className="material-symbols-outlined text-lg mr-2">check_circle</span>
                Default
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setAudioSettings((prev) => ({
                    ...prev,
                    gainBoost: 2.2,
                    noiseGateThreshold: 0.035,
                    compressionThreshold: 0.55,
                  }));
                }}
                className="flex-1 bg-amber-600 text-white hover:bg-amber-600/90 shadow-sm"
              >
                <span className="material-symbols-outlined text-lg mr-2">noise_control_off</span>
                Noisy Room
              </Button>
            </div>

            {showAdvancedAudio && (
              <div className="space-y-4 border-t border-dashed border-gray-200 pt-4 mt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Voice Amplification</Label>
                    <span className="text-sm font-medium">{gainBoost.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[gainBoost]}
                    onValueChange={(value: number[]) => {
                      const newGain = Number(value[0]);
                      setAudioSettings((prev) => ({
                        ...prev,
                        gainBoost: Math.max(1, Math.min(3, newGain)),
                      }));
                    }}
                    min={1.0}
                    max={3.0}
                    step={0.1}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amplifies quiet children's voices (2.5× recommended).
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Noise Gate Threshold</Label>
                    <span className="text-sm font-medium">{(noiseGateThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[noiseGateThreshold * 100]}
                    onValueChange={(value: number[]) => {
                      const newThreshold = Number(value[0]) / 100;
                      setAudioSettings((prev) => ({
                        ...prev,
                        noiseGateThreshold: Math.max(0, Math.min(0.1, newThreshold)),
                      }));
                    }}
                    min={0}
                    max={10}
                    step={0.5}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Filters background noise below this level (2% recommended).
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Compression Threshold</Label>
                    <span className="text-sm font-medium">{(compressionThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[compressionThreshold * 100]}
                    onValueChange={(value: number[]) => {
                      const newThreshold = Number(value[0]) / 100;
                      setAudioSettings((prev) => ({
                        ...prev,
                        compressionThreshold: Math.max(0.3, Math.min(0.8, newThreshold)),
                      }));
                    }}
                    min={30}
                    max={80}
                    step={5}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Evens out volume variations (50% recommended).
                  </p>
                </div>
              </div>
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
                  className={`cursor-pointer transition-all hover:border-primary bg-white ${selectedBackground === background.path ? 'border-primary border-2' : ''
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
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
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
                          className="w-full h-full object-contain bg-gray-900 rounded-md"
                          style={{
                            objectFit: 'contain',
                            backgroundColor: '#111827',
                            maxWidth: '100%',
                            maxHeight: '100%',
                          }}
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
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Close
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 hover:border-blue-700 transition-colors font-medium"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
