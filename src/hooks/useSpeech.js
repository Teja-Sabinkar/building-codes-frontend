// src/hooks/useSpeech.js
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useSpeech() {
    // Speech Recognition States
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [speechError, setSpeechError] = useState(null);

    // Speech Synthesis States
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [speechRate, setSpeechRate] = useState(1);
    const [speechPitch, setSpeechPitch] = useState(1);
    const [speechVolume, setSpeechVolume] = useState(1);

    // Feature Detection States
    const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
    const [isSynthesisSupported, setIsSynthesisSupported] = useState(false);

    // Refs
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const currentUtteranceRef = useRef(null);

    // Initialize feature detection
    useEffect(() => {
        // Check Speech Recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsRecognitionSupported(!!SpeechRecognition);

        // Check Speech Synthesis support
        setIsSynthesisSupported('speechSynthesis' in window);

        if (SpeechRecognition) {
            setupSpeechRecognition(SpeechRecognition);
        }

        if ('speechSynthesis' in window) {
            setupSpeechSynthesis();
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Initialize Speech Recognition
    const setupSpeechRecognition = useCallback((SpeechRecognition) => {
        const recognition = new SpeechRecognition();

        // Configuration
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Can be made configurable
        recognition.maxAlternatives = 1;

        // Event Handlers
        recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            setIsListening(true);
            setSpeechError(null);
        };

        recognition.onresult = (event) => {
            let interimText = '';
            let finalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalText += transcript;
                } else {
                    interimText += transcript;
                }
            }

            if (finalText) {
                setTranscript(prev => prev + finalText);
                setInterimTranscript('');
            } else {
                setInterimTranscript(interimText);
            }
        };

        recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            setSpeechError(event.error);
            setIsListening(false);

            // Handle specific errors
            if (event.error === 'not-allowed') {
                setSpeechError('Microphone access denied. Please allow microphone access and try again.');
            } else if (event.error === 'no-speech') {
                setSpeechError('No speech detected. Please try again.');
            } else if (event.error === 'audio-capture') {
                setSpeechError('No microphone found. Please connect a microphone and try again.');
            } else if (event.error === 'network') {
                setSpeechError('Network error occurred. Please check your connection.');
            } else {
                setSpeechError(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            console.log('🎤 Speech recognition ended');
            setIsListening(false);
            setInterimTranscript('');
        };

        recognitionRef.current = recognition;
    }, []);

    // Initialize Speech Synthesis
    const setupSpeechSynthesis = useCallback(() => {
        synthRef.current = window.speechSynthesis;

        // Load voices
        const loadVoices = () => {
            const availableVoices = synthRef.current.getVoices();
            setVoices(availableVoices);

            // Set default voice (preferably English)
            const defaultVoice = availableVoices.find(voice =>
                voice.lang.startsWith('en') && voice.default
            ) || availableVoices.find(voice =>
                voice.lang.startsWith('en')
            ) || availableVoices[0];

            setSelectedVoice(defaultVoice);
        };

        // Load voices immediately and on voiceschanged event
        loadVoices();
        synthRef.current.onvoiceschanged = loadVoices;
    }, []);

    // Speech Recognition Functions
    const startListening = useCallback(() => {
        if (!isRecognitionSupported || !recognitionRef.current) {
            setSpeechError('Speech recognition not supported in this browser');
            return;
        }

        if (isListening) return;

        // Stop any ongoing speech synthesis
        if (isSpeaking) {
            stopSpeaking();
        }

        try {
            setTranscript('');
            setInterimTranscript('');
            setSpeechError(null);
            recognitionRef.current.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            setSpeechError('Failed to start speech recognition');
        }
    }, [isRecognitionSupported, isListening, isSpeaking]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    // Speech Synthesis Functions
    const speak = useCallback((text, options = {}) => {
        if (!isSynthesisSupported || !synthRef.current) {
            console.error('Speech synthesis not supported');
            return Promise.reject(new Error('Speech synthesis not supported'));
        }

        return new Promise((resolve, reject) => {
            // Stop any ongoing speech
            synthRef.current.cancel();

            // Stop listening while speaking
            if (isListening) {
                stopListening();
            }

            const utterance = new SpeechSynthesisUtterance(text);

            // Apply settings
            utterance.voice = options.voice || selectedVoice;
            utterance.rate = options.rate || speechRate;
            utterance.pitch = options.pitch || speechPitch;
            utterance.volume = options.volume || speechVolume;

            // Event handlers
            utterance.onstart = () => {
                console.log('🔊 Speech synthesis started');
                setIsSpeaking(true);
            };

            utterance.onend = () => {
                console.log('🔊 Speech synthesis ended');
                setIsSpeaking(false);
                currentUtteranceRef.current = null;
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('❌ Speech synthesis error:', event.error);
                setIsSpeaking(false);
                currentUtteranceRef.current = null;
                reject(new Error(`Speech synthesis error: ${event.error}`));
            };

            utterance.onpause = () => {
                console.log('⏸️ Speech synthesis paused');
            };

            utterance.onresume = () => {
                console.log('▶️ Speech synthesis resumed');
            };

            currentUtteranceRef.current = utterance;
            synthRef.current.speak(utterance);
        });
    }, [
        isSynthesisSupported,
        selectedVoice,
        speechRate,
        speechPitch,
        speechVolume,
        isListening,
        stopListening
    ]);

    const stopSpeaking = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
        }
    }, []);

    const pauseSpeaking = useCallback(() => {
        if (synthRef.current && isSpeaking) {
            synthRef.current.pause();
        }
    }, [isSpeaking]);

    const resumeSpeaking = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.resume();
        }
    }, []);

    // Utility Functions
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    // Voice selection helper
    const selectVoice = useCallback((voiceURI) => {
        const voice = voices.find(v => v.voiceURI === voiceURI);
        if (voice) {
            setSelectedVoice(voice);
        }
    }, [voices]);

    // Get filtered voices by language
    const getVoicesByLanguage = useCallback((language = 'en') => {
        return voices.filter(voice => voice.lang.startsWith(language));
    }, [voices]);

    // Combined function for conversation flow
    const speakAndListen = useCallback(async (text) => {
        try {
            await speak(text);
            // Small delay before starting to listen
            setTimeout(() => {
                startListening();
            }, 500);
        } catch (error) {
            console.error('Error in speak and listen flow:', error);
        }
    }, [speak, startListening]);

    return {
        // Recognition state
        isListening,
        transcript,
        interimTranscript,
        speechError,

        // Synthesis state
        isSpeaking,
        voices,
        selectedVoice,
        speechRate,
        speechPitch,
        speechVolume,

        // Feature detection
        isRecognitionSupported,
        isSynthesisSupported,
        isSupported: isRecognitionSupported && isSynthesisSupported,

        // Recognition functions
        startListening,
        stopListening,
        toggleListening,
        clearTranscript,

        // Synthesis functions
        speak,
        stopSpeaking,
        pauseSpeaking,
        resumeSpeaking,

        // Voice management
        selectVoice,
        getVoicesByLanguage,

        // Settings
        setSpeechRate,
        setSpeechPitch,
        setSpeechVolume,

        // Combined functions
        speakAndListen,

        // Computed values
        isActive: isListening || isSpeaking,
        currentText: transcript + interimTranscript,
        hasTranscript: transcript.length > 0 || interimTranscript.length > 0
    };
}