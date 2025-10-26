
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils/audio';
import { Mic, MicOff, AlertTriangle, MessageSquare } from 'lucide-react';

const LiveConversation: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [transcripts, setTranscripts] = useState<{ speaker: 'user' | 'model', text: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    const stopConversation = useCallback(() => {
        setIsActive(false);

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (scriptProcessorRef.current && audioContextRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             for (const source of sourcesRef.current.values()) {
                source.stop();
            }
            sourcesRef.current.clear();
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
    }, []);

    const startConversation = async () => {
        setIsActive(true);
        setError(null);
        setTranscripts([]);
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            sourcesRef.current.clear();
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        try {
                            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                            
                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                if (sessionPromiseRef.current) {
                                  sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                  });
                                }
                            };
                            
                            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(audioContextRef.current.destination);

                        } catch (err) {
                            console.error("Microphone access denied or error:", err);
                            setError("Microphone access denied. Please enable it in your browser settings.");
                            stopConversation();
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscription.current.trim();
                            const fullOutput = currentOutputTranscription.current.trim();
                            
                            setTranscripts(prev => {
                                let newTranscripts = [...prev];
                                if (fullInput) newTranscripts.push({ speaker: 'user', text: fullInput });
                                if (fullOutput) newTranscripts.push({ speaker: 'model', text: fullOutput });
                                return newTranscripts;
                            });

                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                            }
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred.');
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });

        } catch (e: any) {
            setError('Failed to initialize live session.');
            console.error(e);
            setIsActive(false);
        }
    };
    
    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="max-w-4xl mx-auto p-4 bg-slate-800 rounded-lg flex flex-col h-[calc(100vh-10rem)]">
            <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Live Conversation</h2>
            
            <div className="flex-grow bg-slate-900 rounded-lg p-4 overflow-y-auto mb-4">
                {transcripts.length === 0 && !isActive && <div className="text-center text-slate-500">Press Start to begin the conversation.</div>}
                <div className="space-y-4">
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex items-start gap-3 ${t.speaker === 'user' ? 'justify-end' : ''}`}>
                            <div className={`text-sm p-3 rounded-lg max-w-md ${t.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                {t.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="flex items-center justify-center p-2 mb-4 bg-red-900/50 text-red-300 rounded-lg">
                    <AlertTriangle className="w-5 h-5 mr-2"/>
                    <span>{error}</span>
                </div>
            )}

            <div className="flex justify-center">
                <button
                    onClick={isActive ? stopConversation : startConversation}
                    className={`flex items-center justify-center w-20 h-20 rounded-full text-white font-semibold transition-all duration-300 ${
                        isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isActive ? <MicOff className="w-8 h-8"/> : <Mic className="w-8 h-8"/>}
                </button>
            </div>
        </div>
    );
};

export default LiveConversation;
