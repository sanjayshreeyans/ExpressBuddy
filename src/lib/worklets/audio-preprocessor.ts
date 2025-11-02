/**
 * Audio Preprocessing Worklet
 * 
 * This worklet applies gain amplification and noise gating to improve
 * Voice Activity Detection (VAD) for quiet voices and noisy environments.
 * 
 * Features:
 * 1. Adaptive Gain Control - Amplifies quiet voices 2-3x
 * 2. Noise Gate - Filters low-amplitude background noise
 * 3. Peak Limiting - Prevents distortion from over-amplification
 * 4. Dynamic Range Compression - Evens out volume variations
 */

const AudioPreprocessorWorklet = `
class AudioPreprocessorProcessor extends AudioWorkletProcessor {
  static GAIN_BOOST = 2.5;
  static MAX_GAIN = 3.0;
  static MIN_GAIN = 1.0;
  static NOISE_GATE_THRESHOLD = 0.02;
  static NOISE_GATE_ATTACK = 0.001;
  static NOISE_GATE_RELEASE = 0.05;
  static LIMITER_THRESHOLD = 0.95;
  static LIMITER_KNEE = 0.05;
  static COMPRESSION_THRESHOLD = 0.5;
  static COMPRESSION_RATIO = 2.0;
  static COMPRESSION_ATTACK = 0.003;
  static COMPRESSION_RELEASE = 0.25;

  constructor(options) {
    super();

    this.sampleRate = options.processorOptions?.sampleRate || sampleRate;
    this.gateEnvelope = 0;
    this.gateAttackCoeff = Math.exp(-1.0 / (AudioPreprocessorProcessor.NOISE_GATE_ATTACK * this.sampleRate));
    this.gateReleaseCoeff = Math.exp(-1.0 / (AudioPreprocessorProcessor.NOISE_GATE_RELEASE * this.sampleRate));
    this.compressorEnvelope = 0;
    this.compressorAttackCoeff = Math.exp(-1.0 / (AudioPreprocessorProcessor.COMPRESSION_ATTACK * this.sampleRate));
    this.compressorReleaseCoeff = Math.exp(-1.0 / (AudioPreprocessorProcessor.COMPRESSION_RELEASE * this.sampleRate));
    this.inputRMS = 0;
    this.outputRMS = 0;
    this.gateReduction = 0;
    this.compressorReduction = 0;
    this.statsCounter = 0;
    this.hasProcessedFirstBuffer = false;

    this.port.onmessage = (event) => {
      if (event.data.type === 'updateSettings') {
        this.updateSettings(event.data.settings);
      }
    };

    this.port.postMessage({ type: 'ready' });
  }

  updateSettings(settings) {
    if (settings.gainBoost !== undefined) {
      AudioPreprocessorProcessor.GAIN_BOOST = Math.max(
        AudioPreprocessorProcessor.MIN_GAIN,
        Math.min(AudioPreprocessorProcessor.MAX_GAIN, settings.gainBoost)
      );
    }
    if (settings.noiseGateThreshold !== undefined) {
      AudioPreprocessorProcessor.NOISE_GATE_THRESHOLD = Math.max(0.0, Math.min(0.1, settings.noiseGateThreshold));
    }
    if (settings.compressionThreshold !== undefined) {
      AudioPreprocessorProcessor.COMPRESSION_THRESHOLD = Math.max(0.3, Math.min(0.8, settings.compressionThreshold));
    }
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input.length || !output || !output.length) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const numSamples = inputChannel.length;

    let inputSum = 0;
    let outputSum = 0;

    for (let i = 0; i < numSamples; i++) {
      let sample = inputChannel[i];
      inputSum += sample * sample;

      const sampleLevel = Math.abs(sample);

      if (sampleLevel > this.gateEnvelope) {
        this.gateEnvelope = sampleLevel + this.gateAttackCoeff * (this.gateEnvelope - sampleLevel);
      } else {
        this.gateEnvelope = sampleLevel + this.gateReleaseCoeff * (this.gateEnvelope - sampleLevel);
      }

      let gateGain = 1.0;
      if (this.gateEnvelope < AudioPreprocessorProcessor.NOISE_GATE_THRESHOLD) {
        gateGain = Math.max(
          0.05,
          this.gateEnvelope / Math.max(0.0001, AudioPreprocessorProcessor.NOISE_GATE_THRESHOLD)
        );
        this.gateReduction = 1.0 - gateGain;
      } else {
        this.gateReduction = 0;
      }

      sample *= gateGain;
      sample *= AudioPreprocessorProcessor.GAIN_BOOST;

      const compressorLevel = Math.abs(sample);

      if (compressorLevel > this.compressorEnvelope) {
        this.compressorEnvelope = compressorLevel + this.compressorAttackCoeff * (this.compressorEnvelope - compressorLevel);
      } else {
        this.compressorEnvelope = compressorLevel + this.compressorReleaseCoeff * (this.compressorEnvelope - compressorLevel);
      }

      let compressorGain = 1.0;
      if (this.compressorEnvelope > AudioPreprocessorProcessor.COMPRESSION_THRESHOLD) {
        const overThreshold = this.compressorEnvelope - AudioPreprocessorProcessor.COMPRESSION_THRESHOLD;
        const compressed = overThreshold / AudioPreprocessorProcessor.COMPRESSION_RATIO;
        const targetLevel = AudioPreprocessorProcessor.COMPRESSION_THRESHOLD + compressed;
        compressorGain = targetLevel / Math.max(0.001, this.compressorEnvelope);
        this.compressorReduction = 1.0 - compressorGain;
      } else {
        this.compressorReduction = 0;
      }

      sample *= compressorGain;

      if (Math.abs(sample) > AudioPreprocessorProcessor.LIMITER_THRESHOLD) {
        const excess = Math.abs(sample) - AudioPreprocessorProcessor.LIMITER_THRESHOLD;
        const limited = AudioPreprocessorProcessor.LIMITER_THRESHOLD +
          (excess * AudioPreprocessorProcessor.LIMITER_KNEE);
        sample = Math.sign(sample) * Math.min(limited, 1.0);
      }

      outputChannel[i] = sample;
      outputSum += sample * sample;
    }

    this.inputRMS = Math.sqrt(inputSum / numSamples);
    this.outputRMS = Math.sqrt(outputSum / numSamples);

    if (!this.hasProcessedFirstBuffer) {
      this.hasProcessedFirstBuffer = true;
      this.port.postMessage({
        type: 'first-buffer',
        data: {
          inputRMS: this.inputRMS,
          outputRMS: this.outputRMS,
        }
      });
    }

    this.statsCounter++;
    if (this.statsCounter >= 120) {
      this.statsCounter = 0;
      this.port.postMessage({
        type: 'stats',
        data: {
          inputRMS: this.inputRMS,
          outputRMS: this.outputRMS,
          gateReduction: this.gateReduction,
          compressorReduction: this.compressorReduction,
          gainBoost: AudioPreprocessorProcessor.GAIN_BOOST,
          effectiveGain: this.outputRMS / Math.max(0.001, this.inputRMS)
        }
      });
    }

    return true;
  }
}
`;

export default AudioPreprocessorWorklet;
