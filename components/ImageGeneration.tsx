
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './common/Spinner';

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const ImageGeneration: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });

      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      setImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);

    } catch (e: any) {
      setError('Failed to generate image. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">Image Generation</h2>
      
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A futuristic cityscape at sunset, neon lights reflecting on wet streets"
          className="w-full h-24 p-2 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-100"
          disabled={isLoading}
        />

        <div>
          <label className="block mb-2 text-sm font-medium text-slate-300">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                disabled={isLoading}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  aspectRatio === ratio
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={generateImage}
          disabled={isLoading || !prompt.trim()}
          className="w-full flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? <Spinner /> : 'Generate Image'}
        </button>
      </div>

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      
      <div className="mt-6">
        {isLoading && (
            <div className="flex justify-center items-center w-full h-80 bg-slate-700 rounded-lg animate-pulse">
                <Spinner/>
            </div>
        )}
        {imageUrl && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2 text-slate-200">Result:</h3>
            <img src={imageUrl} alt="Generated" className="max-w-full h-auto rounded-lg shadow-lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGeneration;
