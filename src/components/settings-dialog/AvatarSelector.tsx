import { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

const avatarOptions = [
  { value: "panda", label: "Piko (Panda)" },
  { value: "pebbles", label: "Pebbles" },
];

export default function AvatarSelector() {
  const { config, setConfig } = useLiveAPIContext();

  const [selectedOption, setSelectedOption] = useState<{ value: string; label: string } | null>(avatarOptions[0]);

  const updateConfig = useCallback(
    (avatarName: string) => {
      // setConfig expects LiveConnectConfig; store our small avatar info using a safe cast
      setConfig((prev: any) => ({
        ...(prev || {}),
        avatar: {
          ...((prev || {}).avatar || {}),
          name: avatarName,
        },
      }));
    },
    [setConfig]
  );

  useEffect(() => {
    // ensure a default avatar is set on mount
    const currentAvatar = (config as any)?.avatar?.name || (config as any)?.avatarName;
    if (!currentAvatar) {
      updateConfig("panda");
    }
  }, []);

  // keep dropdown in sync with global config
  useEffect(() => {
    const avatarName = (config as any)?.avatar?.name || (config as any)?.avatarName;
    const avatarOption = avatarOptions.find((opt) => opt.value === avatarName);
    if (avatarOption) setSelectedOption(avatarOption);
  }, [config]);

  return (
    <div className="select-group">
      <label htmlFor="avatar-selector">Avatar</label>
      <Select
        id="avatar-selector"
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
        options={avatarOptions}
        onChange={(e) => {
          if (e) {
            updateConfig(e.value);
          }
        }}
      />
    </div>
  );
}
