import { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

const voiceOptions = [
  { value: "Puck", label: "Puck" },
  { value: "Charon", label: "Charon" },
  { value: "Kore", label: "Kore" },
  { value: "Fenrir", label: "Fenrir" },
  { value: "Aoede", label: "Aoede" },
];

export default function VoiceSelector() {
  const { config, setConfig } = useLiveAPIContext();

  // Set the initial displayed option to Kore.
  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(voiceOptions[2]);

  const updateConfig = useCallback(
    (voiceName: string) => {
      setConfig({
        ...config,
        speechConfig: {
          ...config.speechConfig, // Preserve other speech settings
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
        },
      });
    },
    [config, setConfig]
  );

  // NEW: This effect runs ONLY ONCE when the component mounts.
  // It checks the global config and sets our desired default if it's not already set.
  useEffect(() => {
    const currentVoice = config.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName;
    if (currentVoice !== "Kore") {
      updateConfig("Kore");
    }
  }, []); // The empty array [] ensures this runs only once on mount.

  // This effect keeps the dropdown display in sync with the global config.
  useEffect(() => {
    const voiceName = config.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName;
    const voiceOption = voiceOptions.find(opt => opt.value === voiceName);
    if (voiceOption) {
      setSelectedOption(voiceOption);
    }
  }, [config]);


  return (
    <div className="select-group">
      <label htmlFor="voice-selector">Voice</label>
      <Select
        id="voice-selector"
        className="react-select"
        classNamePrefix="react-select"
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            background: "var(--Neutral-15)",
            color: "var(--Neutral-90)",
            minHeight: "33px",
            maxHeight: "33px",
            border: 0,
          }),
          option: (styles, { isFocused, isSelected }) => ({
            ...styles,
            backgroundColor: isFocused
              ? "var(--Neutral-30)"
              : isSelected
              ? "var(--Neutral-20)"
              : undefined,
          }),
        }}
        value={selectedOption}
        defaultValue={selectedOption}
        options={voiceOptions}
        onChange={(e) => {
          // The onChange handler can be simplified now since effects handle the state
          if (e) {
            updateConfig(e.value);
          }
        }}
      />
    </div>
  );
}