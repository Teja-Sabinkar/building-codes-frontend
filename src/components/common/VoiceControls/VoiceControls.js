// src/components/common/VoiceControls/VoiceControls.js
'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import styles from './VoiceControls.module.css';

export default function VoiceControls({
    onTranscriptReady,
    onSpeechStart,
    onSpeechEnd,
    autoSend = false,
    placeholder = "Click microphone to start voice input for building code questions...",
    className = "",
    disabled = false
}) {
    const {
        isListening,
        transcript,
        interimTranscript,
        speechError,
        isSpeaking,
        isSupported,
        startListening,
        stopListening,
        clearTranscript,
        speak,
        stopSpeaking,
        currentText,
        hasTranscript
    } = useSpeech();

    const [showTranscript, setShowTranscript] = useState(false);
    const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');

    // Handle transcript changes
    useEffect(() => {
        if (transcript && transcript !== lastProcessedTranscript) {
            setLastProcessedTranscript(transcript);

            if (onTranscriptReady) {
                onTranscriptReady(transcript);
            }

            // Auto-send if enabled and we have a complete sentence
            if (autoSend && transcript.trim().endsWith('.')) {
                handleSendTranscript();
            }
        }
    }, [transcript, lastProcessedTranscript, onTranscriptReady, autoSend]);

    // Handle speech state changes
    useEffect(() => {
        if (isListening && onSpeechStart) {
            onSpeechStart();
        } else if (!isListening && onSpeechEnd) {
            onSpeechEnd();
        }
    }, [isListening, onSpeechStart, onSpeechEnd]);

    const handleMicrophoneClick = () => {
        if (disabled) return;

        if (isListening) {
            stopListening();
        } else {
            // Stop speaking if currently speaking
            if (isSpeaking) {
                stopSpeaking();
            }
            startListening();
            setShowTranscript(true);
        }
    };

    const handleSendTranscript = () => {
        if (transcript.trim() && onTranscriptReady) {
            onTranscriptReady(transcript.trim());
            clearTranscript();
            setShowTranscript(false);
            setLastProcessedTranscript('');
        }
    };

    const handleClearTranscript = () => {
        clearTranscript();
        setLastProcessedTranscript('');
        setShowTranscript(false);
    };

    const handleStopSpeaking = () => {
        stopSpeaking();
    };

    // Get microphone button state
    const getMicrophoneState = () => {
        if (disabled) return 'disabled';
        if (isListening) return 'listening';
        if (isSpeaking) return 'speaking';
        if (speechError) return 'error';
        return 'idle';
    };

    const microphoneState = getMicrophoneState();

    if (!isSupported) {
        return (
            <div className={`${styles.voiceControls} ${styles.unsupported} ${className}`}>
                <div className={styles.unsupportedMessage}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.warningIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>Voice features not supported in this browser</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.voiceControls} ${className}`}>
            {/* Main Voice Control Button */}
            <div className={styles.microphoneContainer}>
                <button
                    onClick={handleMicrophoneClick}
                    className={`${styles.microphoneButton} ${styles[microphoneState]}`}
                    disabled={disabled}
                    title={
                        disabled ? "Voice input disabled" :
                            isListening ? "Stop listening" :
                                isSpeaking ? "Speaking regulation answer..." :
                                    speechError ? `Error: ${speechError}` :
                                        "Start voice input for building code questions"
                    }
                >
                    {/* Microphone Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className={styles.micIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>

                    {/* Listening Animation */}
                    {isListening && (
                        <div className={styles.listeningAnimation}>
                            <div className={styles.pulse}></div>
                            <div className={styles.pulse}></div>
                            <div className={styles.pulse}></div>
                        </div>
                    )}

                    {/* Speaking Animation */}
                    {isSpeaking && (
                        <div className={styles.speakingAnimation}>
                            <div className={styles.soundWave}></div>
                            <div className={styles.soundWave}></div>
                            <div className={styles.soundWave}></div>
                        </div>
                    )}
                </button>

                {/* Status Indicator */}
                <div className={styles.statusIndicator}>
                    {isListening && (
                        <span className={styles.statusText}>
                            🎤 Listening for building code questions...
                        </span>
                    )}
                    {isSpeaking && (
                        <div className={styles.speakingStatus}>
                            <span className={styles.statusText}>🔊 Reading regulation answer</span>
                            <button
                                onClick={handleStopSpeaking}
                                className={styles.stopSpeakingButton}
                                title="Stop speaking"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={styles.stopIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                                </svg>
                            </button>
                        </div>
                    )}
                    {speechError && (
                        <span className={styles.errorText}>
                            ⚠️ {speechError}
                        </span>
                    )}
                </div>
            </div>

            {/* Transcript Display */}
            {(showTranscript || hasTranscript) && (
                <div className={styles.transcriptContainer}>
                    <div className={styles.transcriptHeader}>
                        <span className={styles.transcriptLabel}>Voice Question:</span>
                        <div className={styles.transcriptActions}>
                            {hasTranscript && (
                                <>
                                    <button
                                        onClick={handleSendTranscript}
                                        className={styles.transcriptAction}
                                        title="Send regulation question"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleClearTranscript}
                                        className={styles.transcriptAction}
                                        title="Clear transcript"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className={styles.transcriptText}>
                        {currentText || placeholder}
                        {interimTranscript && (
                            <span className={styles.interimText}>{interimTranscript}</span>
                        )}
                        {isListening && !currentText && (
                            <span className={styles.listeningPrompt}>Ask about building codes, regulations, or compliance...</span>
                        )}
                    </div>

                    {/* Voice Tips for Building Codes */}
                    {isListening && (
                        <div className={styles.voiceTips}>
                            <div className={styles.tipsHeader}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={styles.tipsIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className={styles.tipsLabel}>Voice Tips:</span>
                            </div>
                            <div className={styles.tipsList}>
                                <div className={styles.tip}>Try: "What are minimum ceiling heights for residential?"</div>
                                <div className={styles.tip}>Try: "Fire escape requirements for three story buildings"</div>
                                <div className={styles.tip}>Try: "ADA door width requirements"</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}