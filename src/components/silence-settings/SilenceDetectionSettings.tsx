/**
 * Silence Detection Settings Component
 * 
 * Allows users to configure the silence detection and nudge system
 */

import React, { useState } from 'react';
import cn from 'classnames';
import { SilenceDetectionConfig, SilenceAnalytics } from '../../hooks/use-silence-detection';
import './silence-settings.scss';

interface SilenceDetectionSettingsProps {
  config: SilenceDetectionConfig;
  analytics: SilenceAnalytics;
  onConfigUpdate: (updates: Partial<SilenceDetectionConfig>) => void;
  onManualNudge: () => void;
  className?: string;
  isVisible: boolean;
  onClose: () => void;
}

const PRESET_CONFIGS = {
  gentle: {
    silenceThresholdSeconds: 15,
    speechVolumeThreshold: 0.03,
    nudgeMessage: "Pico is here when you're ready to talk. Take your time!",
    minTimeBetweenNudges: 45,
  },
  standard: {
    silenceThresholdSeconds: 10,
    speechVolumeThreshold: 0.05,
    nudgeMessage: "It looks like your friend is quiet. Let's try a new story or ask a fun question!",
    minTimeBetweenNudges: 30,
  },
  responsive: {
    silenceThresholdSeconds: 7,
    speechVolumeThreshold: 0.08,
    nudgeMessage: "Let's try something new to keep the chat going!",
    minTimeBetweenNudges: 20,
  },
};

export const SilenceDetectionSettings: React.FC<SilenceDetectionSettingsProps> = ({
  config,
  analytics,
  onConfigUpdate,
  onManualNudge,
  className = "",
  isVisible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'analytics'>('settings');

  if (!isVisible) return null;

  const handlePresetSelect = (presetName: keyof typeof PRESET_CONFIGS) => {
    const preset = PRESET_CONFIGS[presetName];
    onConfigUpdate(preset);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  return (
    <div className={cn("silence-settings-overlay", className)}>
      <div className="silence-settings-modal">
        <div className="settings-header">
          <h2>Pico's Listening Settings</h2>
          <button className="close-button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={cn("tab-button", { active: activeTab === 'settings' })}
            onClick={() => setActiveTab('settings')}
          >
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
          <button
            className={cn("tab-button", { active: activeTab === 'analytics' })}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="material-symbols-outlined">analytics</span>
            Analytics
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'settings' && (
            <div className="settings-panel">
              {/* Enable/Disable Toggle */}
              <div className="setting-group">
                <div className="setting-header">
                  <h3>System Status</h3>
                </div>
                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => onConfigUpdate({ enabled: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Help Pico know when to listen or talk
                  </label>
                </div>
              </div>

              {/* Preset Configurations */}
              <div className="setting-group">
                <div className="setting-header">
                  <h3>Quick Presets</h3>
                  <p>How patient should Pico be?</p>
                </div>
                <div className="preset-buttons">
                  <button
                    className="preset-button"
                    onClick={() => handlePresetSelect('gentle')}
                    title="Pico will wait a long time for you to talk."
                  >
                    <span className="preset-icon">🐢</span>
                    <span className="preset-name">Patient</span>
                    <span className="preset-desc">Pico waits a bit</span>
                  </button>
                  <button
                    className="preset-button"
                    onClick={() => handlePresetSelect('standard')}
                    title="A good balance of waiting and talking."
                  >
                    <span className="preset-icon">🐼</span>
                    <span className="preset-name">Balanced</span>
                    <span className="preset-desc">Pico waits a little</span>
                  </button>
                  <button
                    className="preset-button"
                    onClick={() => handlePresetSelect('responsive')}
                    title="Pico will talk more often to keep the chat going."
                  >
                    <span className="preset-icon">🐇</span>
                    <span className="preset-name">Chatty</span>
                    <span className="preset-desc">Pico talks more</span>
                  </button>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="setting-group">
                <div className="setting-header">
                  <h3>More Ways to Play</h3>
                </div>

                <div className="setting-item">
                  <label htmlFor="silence-threshold">
                    How long Pico waits: {config.silenceThresholdSeconds}s
                  </label>
                  <input
                    id="silence-threshold"
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={config.silenceThresholdSeconds}
                    onChange={(e) => onConfigUpdate({ silenceThresholdSeconds: parseInt(e.target.value) })}
                    className="range-input"
                  />
                  <div className="range-labels">
                    <span>3s</span>
                    <span>30s</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label htmlFor="volume-threshold">
                    How loud you need to be:
                  </label>
                  <input
                    id="volume-threshold"
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={config.speechVolumeThreshold}
                    onChange={(e) => onConfigUpdate({ speechVolumeThreshold: parseFloat(e.target.value) })}
                    className="range-input"
                  />
                  <div className="range-labels">
                    <span>1%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label htmlFor="nudge-interval">
                    Time between Pico's questions: {config.minTimeBetweenNudges}s
                  </label>
                  <input
                    id="nudge-interval"
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={config.minTimeBetweenNudges}
                    onChange={(e) => onConfigUpdate({ minTimeBetweenNudges: parseInt(e.target.value) })}
                    className="range-input"
                  />
                  <div className="range-labels">
                    <span>10s</span>
                    <span>2m</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label htmlFor="nudge-message">
                    What Pico should ask
                  </label>
                  <textarea
                    id="nudge-message"
                    value={config.nudgeMessage}
                    onChange={(e) => onConfigUpdate({ nudgeMessage: e.target.value })}
                    className="textarea-input"
                    rows={3}
                    placeholder="What should Pico say to start a conversation?"
                  />
                </div>
              </div>

              {/* Test Section */}
              <div className="setting-group">
                <div className="setting-header">
                  <h3>Testing</h3>
                </div>
                <button
                  className="test-button"
                  onClick={onManualNudge}
                  disabled={!config.enabled}
                >
                  <span className="material-symbols-outlined">send</span>
                  Ask Pico a Question
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-panel">
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="card-icon">
                    <span className="material-symbols-outlined">notifications</span>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.totalNudges}</div>
                    <div className="card-label">Pico's Questions</div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{formatDuration(analytics.averageSilenceDuration)}</div>
                    <div className="card-label">Avg Quiet Time</div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{analytics.nudgeSuccessRate.toFixed(1)}%</div>
                    <div className="card-label">Chattiness</div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon">
                    <span className="material-symbols-outlined">timer</span>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{formatDuration(analytics.longestSilencePeriod)}</div>
                    <div className="card-label">Longest Quiet Time</div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon">
                    <span className="material-symbols-outlined">access_time</span>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{formatDuration(analytics.totalSilenceTime)}</div>
                    <div className="card-label">Total Quiet Time</div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-icon">
                    <span className="material-symbols-outlined">play_arrow</span>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{formatDuration((Date.now() - analytics.sessionStartTime) / 1000)}</div>
                    <div className="card-label">Time Spent with Pico</div>
                  </div>
                </div>
              </div>

              <div className="analytics-insights">
                <h4>📈 Insights & Recommendations</h4>
                <div className="insights-list">
                  {analytics.nudgeSuccessRate > 70 && (
                    <div className="insight success">
                      ✅ Great success rate! Your nudge timing seems well-calibrated.
                    </div>
                  )}
                  {analytics.nudgeSuccessRate < 30 && analytics.totalNudges > 3 && (
                    <div className="insight warning">
                      ⚠️ Low success rate. Consider increasing the silence threshold or adjusting the nudge message.
                    </div>
                  )}
                  {analytics.averageSilenceDuration > 15 && (
                    <div className="insight info">
                      💡 Long average silence periods. You might want to reduce the silence threshold.
                    </div>
                  )}
                  {analytics.totalNudges > 10 && (
                    <div className="insight info">
                      💡 Many nudges sent. Consider increasing the minimum time between nudges.
                    </div>
                  )}
                  {analytics.totalNudges === 0 && (
                    <div className="insight neutral">
                      🎯 No nudges sent yet. The child is engaging well, or silence detection may need adjustment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SilenceDetectionSettings;
