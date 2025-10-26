
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { GroundingChunk } from '../types';
import Spinner from './common/Spinner';
import { Globe, MapPin, Link as LinkIcon } from 'lucide-react';

type SearchMode = 'web' | 'maps';

const GroundedSearch: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<SearchMode>('web');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse('');
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let toolConfig = {};
      if (mode === 'maps') {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          toolConfig = {
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }
              }
            }
          };
        } catch (geoError) {
          setError("Could not get location. Please allow location access.");
          setIsLoading(false);
          return;
        }
      }
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [mode === 'web' ? { googleSearch: {} } : { googleMaps: {} }],
          ...toolConfig
        },
      });

      setResponse(result.text);
      if (result.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setSources(result.candidates[0].groundingMetadata.groundingChunks);
      }

    } catch (e: any) {
      setError('An error occurred during the search.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Grounded Search</h2>

      <div className="flex justify-center mb-4 bg-slate-700 p-1 rounded-lg">
        <button onClick={() => setMode('web')} className={`w-1/2 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${mode === 'web' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}><Globe size={18}/> Web</button>
        <button onClick={() => setMode('maps')} className={`w-1/2 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${mode === 'maps' ? 'bg-green-600 text-white' : 'text-slate-300'}`}><MapPin size={18}/> Maps</button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && performSearch()}
          placeholder={mode === 'web' ? 'Ask about recent events...' : 'Find places near you...'}
          className="w-full p-2 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100"
          disabled={isLoading}
        />
        <button
          onClick={performSearch}
          disabled={isLoading || !prompt.trim()}
          className="px-5 py-2.5 bg-yellow-500 text-slate-900 font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner /> : 'Search'}
        </button>
      </div>

      {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      
      {(response || sources.length > 0) && (
        <div className="mt-6 p-4 bg-slate-900 rounded-lg">
          {response && <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">{response}</div>}
          
          {sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h4 className="font-semibold mb-2 text-slate-300">Sources:</h4>
              <ul className="space-y-2">
                {sources.map((chunk, index) => {
                    const source = chunk.web || chunk.maps;
                    if (!source) return null;
                    return (
                        <li key={index}>
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline text-sm">
                                <LinkIcon size={14}/>
                                <span>{source.title}</span>
                            </a>
                        </li>
                    )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroundedSearch;
