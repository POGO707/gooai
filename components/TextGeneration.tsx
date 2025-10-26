import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './common/Spinner';

const TextGeneration: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useProModel, setUseProModel] = useState(false); // Thinking Mode

  const generateContent = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      // FIX: Use the recommended model name 'gemini-flash-lite-latest' for gemini lite/flash lite.
      const modelName = useProModel ? 'gemini-2.5-pro' : 'gemini-flash-lite-latest';
      
      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: useProModel ? {
            thinkingConfig: { thinkingBudget: 32768 }
        } : {},
      });

      setResponse(result.text);
    } catch (e: any) {
      setError('An error occurred. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-400">Advanced Text Generation</h2>
      
      <div className="mb-4 p-3 bg-slate-900 rounded-lg">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          className="w-full h-32 p-2 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <label htmlFor="thinking-mode-toggle" className="text-slate-300 font-medium">
            Thinking Mode (for complex tasks)
          </label>
          <button
            id="thinking-mode-toggle"
            onClick={() => setUseProModel(!useProModel)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              useProModel ? 'bg-blue-600' : 'bg-slate-600'
            }`}
            disabled={isLoading}
          >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                useProModel ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <button
          onClick={generateContent}
          disabled={isLoading || !prompt.trim()}
          className="flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? <Spinner /> : 'Generate'}
        </button>
      </div>

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      
      {response && (
        <div className="mt-6 p-4 bg-slate-900 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-slate-200">Response:</h3>
          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
};

export default TextGeneration;