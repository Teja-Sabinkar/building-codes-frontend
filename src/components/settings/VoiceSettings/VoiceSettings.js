// src/components/settings/VoiceSettings/VoiceSettings.js
'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import styles from './VoiceSettings.module.css';

export default function VoiceSettings() {
  const {
    voices,
    selectedVoice,
    speechRate,
    speechPitch,
    speechVolume,
    selectVoice,
    setSpeechRate,
    setSpeechPitch,
    setSpeechVolume,
    speak,
    isSupported,
    getVoicesByLanguage
  } = useSpeech();

  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [testText] = useState("This is a test of the speech synthesis system. You can adjust the voice, rate, pitch, and volume settings.");

  // Local state for settings before applying
  const [localSettings, setLocalSettings] = useState({
    voiceURI: selectedVoice?.voiceURI || '',
    rate: speechRate,
    pitch: speechPitch,
    volume: speechVolume
  });

  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings({
      voiceURI: selectedVoice?.voiceURI || '',
      rate: speechRate,
      pitch: speechPitch,
      volume: speechVolume
    });
  }, [selectedVoice, speechRate, speechPitch, speechVolume]);

  const handleVoiceChange = (voiceURI) => {
    setLocalSettings(prev => ({ ...prev, voiceURI }));
    selectVoice(voiceURI);
  };

  const handleRateChange = (rate) => {
    const newRate = parseFloat(rate);
    setLocalSettings(prev => ({ ...prev, rate: newRate }));
    setSpeechRate(newRate);
  };

  const handlePitchChange = (pitch) => {
    const newPitch = parseFloat(pitch);
    setLocalSettings(prev => ({ ...prev, pitch: newPitch }));
    setSpeechPitch(newPitch);
  };

  const handleVolumeChange = (volume) => {
    const newVolume = parseFloat(volume);
    setLocalSettings(prev => ({ ...prev, volume: newVolume }));
    setSpeechVolume(newVolume);
  };

  const handleTestSpeech = async () => {
    if (isTestPlaying) return;

    setIsTestPlaying(true);
    try {
      await speak(testText, {
        voice: voices.find(v => v.voiceURI === localSettings.voiceURI),
        rate: localSettings.rate,
        pitch: localSettings.pitch,
        volume: localSettings.volume
      });
    } catch (error) {
      console.error('Test speech error:', error);
    } finally {
      setIsTestPlaying(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      voiceURI: voices.find(v => v.lang.startsWith('en') && v.default)?.voiceURI || voices[0]?.voiceURI || '',
      rate: 1,
      pitch: 1,
      volume: 1
    };

    setLocalSettings(defaultSettings);
    selectVoice(defaultSettings.voiceURI);
    setSpeechRate(defaultSettings.rate);
    setSpeechPitch(defaultSettings.pitch);
    setSpeechVolume(defaultSettings.volume);
  };

  // Group voices by language
  const groupedVoices = voices.reduce((groups, voice) => {
    const lang = voice.lang.split('-')[0];
    if (!groups[lang]) {
      groups[lang] = [];
    }
    groups[lang].push(voice);
    return groups;
  }, {});

  const getLanguageName = (langCode) => {
    const languageNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    return languageNames[langCode] || langCode.toUpperCase();
  };

  const getVoiceDisplayName = (voice) => {
    let name = voice.name;
    
    // Clean up common voice name patterns
    name = name.replace(/Microsoft\s+/i, '');
    name = name.replace(/Google\s+/i, '');
    name = name.replace(/\s+\(.*?\)$/, ''); // Remove parenthetical info
    
    return name;
  };

  if (!isSupported) {
    return (
      <div className={styles.voiceSettings}>
        <div className={styles.unsupported}>
          <div className={styles.unsupportedIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.warningIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className={styles.unsupportedContent}>
            <h3>Voice Features Not Available</h3>
            <p>Your browser doesn't support speech recognition or text-to-speech features. Please use a modern browser like Chrome, Firefox, or Safari for voice functionality.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.voiceSettings}>
      <div className={styles.settingsHeader}>
        <h2 className={styles.title}>Voice Settings</h2>
        <p className={styles.description}>
          Configure voice input and text-to-speech preferences for your floor plan conversations.
        </p>
      </div>

      <div className={styles.settingsGrid}>
        {/* Voice Selection */}
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.labelIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a1 1 0 012 0v0a1 1 0 01-2 0v0z" />
            </svg>
            Voice
          </label>
          <select
            value={localSettings.voiceURI}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className={styles.voiceSelect}
          >
            {Object.entries(groupedVoices).map(([langCode, langVoices]) => (
              <optgroup key={langCode} label={getLanguageName(langCode)}>
                {langVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {getVoiceDisplayName(voice)}
                    {voice.default && ' (Default)'}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className={styles.settingHint}>
            Choose the voice for text-to-speech output
          </div>
        </div>

        {/* Speech Rate */}
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.labelIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Speech Rate
          </label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={localSettings.rate}
              onChange={(e) => handleRateChange(e.target.value)}
              className={styles.slider}
            />
            <div className={styles.sliderValue}>{localSettings.rate.toFixed(1)}x</div>
          </div>
          <div className={styles.settingHint}>
            Controls how fast the speech is delivered
          </div>
        </div>

        {/* Speech Pitch */}
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.labelIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Pitch
          </label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={localSettings.pitch}
              onChange={(e) => handlePitchChange(e.target.value)}
              className={styles.slider}
            />
            <div className={styles.sliderValue}>{localSettings.pitch.toFixed(1)}</div>
          </div>
          <div className={styles.settingHint}>
            Controls the tone/pitch of the voice
          </div>
        </div>

        {/* Speech Volume */}
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.labelIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 12a4 4 0 108 0 4 4 0 00-8 0z" />
            </svg>
            Volume
          </label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              className={styles.slider}
            />
            <div className={styles.sliderValue}>{Math.round(localSettings.volume * 100)}%</div>
          </div>
          <div className={styles.settingHint}>
            Controls the volume of text-to-speech
          </div>
        </div>
      </div>

      {/* Test and Reset Controls */}
      <div className={styles.controlsSection}>
        <button
          onClick={handleTestSpeech}
          disabled={isTestPlaying}
          className={`${styles.testButton} ${isTestPlaying ? styles.testButtonActive : ''}`}
        >
          {isTestPlaying ? (
            <>
              <div className={styles.testSpinner}>
                <div className={styles.soundWave}>
                  <div className={styles.waveBar}></div>
                  <div className={styles.waveBar}></div>
                  <div className={styles.waveBar}></div>
                </div>
              </div>
              Playing Test...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.testIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Test Voice
            </>
          )}
        </button>

        <button
          onClick={resetToDefaults}
          className={styles.resetButton}
          disabled={isTestPlaying}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.resetIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset to Defaults
        </button>
      </div>

      {/* Feature Information */}
      <div className={styles.infoSection}>
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Voice Features</h3>
          </div>
          <div className={styles.infoContent}>
            <div className={styles.featureList}>
              <div className={styles.feature}>
                <strong>🎤 Voice Input:</strong> Use the microphone button in the message input to speak your floor plan requirements instead of typing.
              </div>
              <div className={styles.feature}>
                <strong>🔊 Text-to-Speech:</strong> Click the speaker button on AI responses to have them read aloud with your chosen voice settings.
              </div>
              <div className={styles.feature}>
                <strong>⚙️ Customization:</strong> Adjust voice, speed, pitch, and volume to match your preferences for the best experience.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.compatibilityInfo}>
          <h4>Browser Compatibility</h4>
          <div className={styles.browserGrid}>
            <div className={styles.browserItem}>
              <span className={styles.browserName}>Chrome</span>
              <span className={styles.compatStatus}>✅ Full Support</span>
            </div>
            <div className={styles.browserItem}>
              <span className={styles.browserName}>Firefox</span>
              <span className={styles.compatStatus}>✅ Full Support</span>
            </div>
            <div className={styles.browserItem}>
              <span className={styles.browserName}>Safari</span>
              <span className={styles.compatStatus}>⚠️ Limited Support</span>
            </div>
            <div className={styles.browserItem}>
              <span className={styles.browserName}>Edge</span>
              <span className={styles.compatStatus}>✅ Full Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}