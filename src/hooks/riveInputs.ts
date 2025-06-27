import { useStateMachineInput } from '@rive-app/react-canvas';
import { RiveInputs, RiveInput, STATE_MACHINE_NAME } from './index';

/**
 * Safe wrapper for useStateMachineInput that returns a fallback when input is not found
 */
const useSafeStateMachineInput = (
  rive: any,
  stateMachineName: string,
  inputName: string,
  initialValue?: number | boolean
): RiveInput => {
  const input = useStateMachineInput(rive, stateMachineName, inputName, initialValue);
  
  // Return actual input or fallback
  return input ?? { value: initialValue ?? false, fire: () => {} };
};

/**
 * Create all Rive inputs needed for viseme animation
 * Based on the input mapping from the analyzed codebase
 */
export const useRiveInputs = (rive: any): RiveInputs => {
  return {
    mouth: {
      // Viseme inputs (mapped from VISEME_MAP)
      100: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "100"),
      101: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "101"),
      102: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "102"),
      103: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "103"),
      104: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "104"),
      105: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "105"),
      107: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "107"),
      108: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "108"),
      109: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "109"),
      110: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "110"),
      112: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "112"),
      113: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "113"),
      114: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "114"),
      115: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "115"),
      116: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "116"),
      118: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "118"),
    },
    emotions: {
      is_speaking: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "is_speaking"),
      eyes_smile: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "eyes_smile"),
    },
    stress: {
      stress: useSafeStateMachineInput(rive, STATE_MACHINE_NAME, "stress", 0),
    }
  };
};
