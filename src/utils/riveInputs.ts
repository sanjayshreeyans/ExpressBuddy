import { useState, useEffect } from 'react';
import { RiveInputs, SUPPORTED_VISEME_IDS } from '../types/avatar';

/**
 * Hook to manage Rive inputs for ExpressBuddy avatar
 * Adapted from PandabotLipsync system
 */
export function useRiveInputs(rive: any): RiveInputs | null {
  const [riveInputs, setRiveInputs] = useState<RiveInputs | null>(null);

  useEffect(() => {
    if (!rive) {
      setRiveInputs(null);
      return;
    }

    try {
      const stateMachine = rive.stateMachineInputs('InLesson');
      if (!stateMachine) {
        console.warn('State machine "InLesson" not found');
        return;
      }

      // Build mouth inputs for all supported viseme IDs
      const mouth: { [key: number]: any } = {};
      for (const visemeId of SUPPORTED_VISEME_IDS) {
        const input = stateMachine.find((input: any) => input.name === visemeId.toString());
        if (input) {
          mouth[visemeId] = input;
        } else {
          console.warn(`Viseme input ${visemeId} not found in Rive file`);
        }
      }

      // Find emotion inputs
      const is_speaking = stateMachine.find((input: any) => input.name === 'is_speaking');
      const eyes_smile = stateMachine.find((input: any) => input.name === 'eyes_smile');

      // Find stress input (optional)
      const stress = stateMachine.find((input: any) => input.name === 'stress');

      const inputs: RiveInputs = {
        mouth,
        emotions: {
          is_speaking: is_speaking || { value: false },
          eyes_smile: eyes_smile || { value: false }
        }
      };

      if (stress) {
        inputs.stress = { stress };
      }

      setRiveInputs(inputs);
      console.log('Rive inputs initialized successfully');
    } catch (error) {
      console.error('Error initializing Rive inputs:', error);
      setRiveInputs(null);
    }
  }, [rive]);

  return riveInputs;
}
