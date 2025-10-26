
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../utils/audio';
import Spinner from './common/Spinner';
import { Volume2, Play, Pause } from 'lucide-react';

type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
const voices: VoiceName[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('Hello! I am Gemini. What would you like me to say?');
    const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Zephyr');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    const generateAndPlaySpeech = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);
        if(isPlaying) stopPlayback();

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: selectedVoice },
                        },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (base64Audio) {
                if(!audioContextRef.current || audioContextRef.current.state === 'closed'){
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioData = decode(base64Audio);
                audioBufferRef.current = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
                playAudio();
            } else {
                throw new Error("No audio data received from API.");
            }

        } catch (e: any) {
            setError('Failed to generate speech.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const playAudio = () => {
        if (!audioBufferRef.current || !audioContextRef.current) return;
        
        stopPlayback(); // Stop any currently playing audio
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
        setIsPlaying(true);
    };

    const stopPlayback = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            stopPlayback();
        } else if (audioBufferRef.current) {
            playAudio();
        } else {
            generateAndPlaySpeech();
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-green-400">Text-to-Speech</h2>
            
            <div className="space-y-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to synthesize..."
                    className="w-full h-36 p-3 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-slate-100"
                    disabled={isLoading || isPlaying}
                />

                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Voice</label>
                    <div className="flex flex-wrap gap-2">
                        {voices.map((voice) => (
                            <button
                                key={voice}
                                onClick={() => setSelectedVoice(voice)}
                                disabled={isLoading || isPlaying}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                                    selectedVoice === voice ? 'bg-lime-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {voice}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handlePlayPause}
                    disabled={isLoading || !text.trim()}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-lime-500 to-green-600 text-white font-semibold rounded-lg hover:from-lime-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? <Spinner /> : isPlaying ? <><Pause size={20}/> Pause</> : <><Play size={20}/> {audioBufferRef.current ? 'Play Again' : 'Generate & Play'}</> }
                </button>
            </div>

            {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        </div>
    );
};

export default TextToSpeech;
