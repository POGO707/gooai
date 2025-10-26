
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './common/Spinner';
import { useApiKey } from '../hooks/useApiKey';
import ImageUpload from './common/ImageUpload';
import { fileToBase64 } from '../utils/file';

type AspectRatio = "16:9" | "9:16";

const LOADING_MESSAGES = [
    "Warming up the digital director's chair...",
    "Choreographing pixels into motion...",
    "This can take a few minutes. Great art takes time!",
    "Rendering your masterpiece, frame by frame...",
    "Checking status, almost there...",
];

const VideoGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [error, setError] = useState<string | null>(null);
    const { isKeySelected, selectApiKey, handleApiError, checkApiKey } = useApiKey();

    const generateVideo = async () => {
        if (!prompt.trim() && !selectedFile) {
            setError("Please provide a prompt or an image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
            setLoadingMessage(LOADING_MESSAGES[messageIndex]);
        }, 5000);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            let imagePayload;
            if (selectedFile) {
                const base64Image = await fileToBase64(selectedFile);
                imagePayload = {
                    imageBytes: base64Image,
                    mimeType: selectedFile.type,
                };
            }

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                ...(imagePayload && { image: imagePayload }),
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const videoBlob = await response.blob();
                setVideoUrl(URL.createObjectURL(videoBlob));
            } else {
                throw new Error("Video generation completed but no download link was found.");
            }

        } catch (e: any) {
            setError('Failed to generate video. Please try again.');
            handleApiError(e);
            console.error(e);
        } finally {
            setIsLoading(false);
            clearInterval(messageInterval);
        }
    };

    if (!isKeySelected) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-slate-800 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Veo Video Generation</h2>
                <p className="mb-4 text-slate-400">This feature requires a user-selected API key and may incur charges.</p>
                <p className="mb-6 text-sm text-slate-500 max-w-md">Please ensure your project has billing enabled. For more details, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI billing documentation</a>.</p>
                <button onClick={selectApiKey} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Select API Key
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 bg-slate-800 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-400">Veo Video Generation</h2>
            <p className="text-center text-slate-400 mb-6 -mt-2">
                Create stunning videos from a text prompt, an uploaded image, or a combination of both.
            </p>
            
            <div className="space-y-4">
                <ImageUpload onFileSelect={setSelectedFile} promptText="Optional: Upload a starting image" />
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                        selectedFile 
                        ? "e.g., Animate this image. Make the clouds move."
                        : "e.g., A majestic eagle soaring through a cloudy sky"
                    }
                    className="w-full h-24 p-2 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-100"
                    disabled={isLoading}
                />

                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Aspect Ratio</label>
                    <div className="flex gap-2">
                        {(["16:9", "9:16"] as AspectRatio[]).map((ratio) => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                disabled={isLoading}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                                    aspectRatio === ratio ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {ratio === "16:9" ? "Landscape" : "Portrait"}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={generateVideo}
                    disabled={isLoading || (!prompt.trim() && !selectedFile)}
                    className="w-full flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-red-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? <Spinner /> : 'Generate Video'}
                </button>
            </div>

            {error && <p className="mt-4 text-center text-red-400">{error}</p>}
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col justify-center items-center w-full h-80 bg-slate-700 rounded-lg">
                        <Spinner />
                        <p className="mt-4 text-slate-300 text-center">{loadingMessage}</p>
                    </div>
                )}
                {videoUrl && (
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-2 text-slate-200">Result:</h3>
                        <video src={videoUrl} controls autoPlay loop className="max-w-full h-auto rounded-lg shadow-lg" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoGeneration;
