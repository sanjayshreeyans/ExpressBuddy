import { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { Modality } from "@google/genai";

const responseOptions = [
  { value: "audio", label: "audio" },
  { value: "text", label: "text" },
];

export default function ResponseModalitySelector() {
  const { config, setConfig } = useLiveAPIContext();

  // Hardcode to text modality
  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(responseOptions[1]); // Index 1 is "text"

  const updateConfig = useCallback(
    (modality: "audio" | "text") => {
      setConfig({
        ...config,
        responseModalities: [
          modality === "audio" ? Modality.AUDIO : Modality.TEXT,
        ],
      });
    },
    [config, setConfig]
  );

  // Force text modality on component mount
  useEffect(() => {
    updateConfig("text");
  }, [updateConfig]);

  return (
    <div className="select-group">
      <label htmlFor="response-modality-selector">Response modality</label>
      <Select
        id="response-modality-selector"
        className="react-select"
        classNamePrefix="react-select"
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            background: "var(--Neutral-25)",
            color: "var(--Neutral-70)",
            minHeight: "33px",
            maxHeight: "33px",
            border: 0,
            opacity: 0.7,
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
        value={responseOptions[1]} // Always text
        options={responseOptions}
        isDisabled={true} // Disable the selector
        onChange={() => {
          // Do nothing - it's hardcoded to text
        }}
      />
      <small style={{ color: "var(--gray-500)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
        Hardcoded to text responses only
      </small>
    </div>
  );
}
