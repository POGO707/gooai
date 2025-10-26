
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Spinner from './common/Spinner';
import ImageUpload from './common/ImageUpload';
import { fileToBase64 } from '../utils/file';

const ImageEditing: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setEditedImageUrl(null);
  };

  const editImage = async () => {
    if (!prompt.trim() || !selectedFile) return;
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const base64Image = await fileToBase64(selectedFile);

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: selectedFile.type,
        },
      };

      const textPart = { text: prompt };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [imagePart, textPart],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          setEditedImageUrl(`data:${part.inlineData.mimeType};base64,${base64ImageBytes}`);
        }
      }

    } catch (e: any) {
      setError('Failed to edit image. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">Image Editing</h2>
      
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <ImageUpload onFileSelect={handleFileSelect} promptText="Upload an image to edit" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Add a futuristic helmet to the person"
            className="w-full h-24 p-2 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-100"
            disabled={isLoading || !selectedFile}
          />
          <button
            onClick={editImage}
            disabled={isLoading || !prompt.trim() || !selectedFile}
            className="w-full flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? <Spinner /> : 'Apply Edit'}
          </button>
          {error && <p className="mt-2 text-center text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-center h-full">
          {isLoading && (
            <div className="flex flex-col justify-center items-center w-full h-80 bg-slate-700 rounded-lg animate-pulse">
                <Spinner/>
                <p className="mt-2 text-slate-400">Editing in progress...</p>
            </div>
          )}
          {editedImageUrl && (
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2 text-slate-200">Result:</h3>
              <img src={editedImageUrl} alt="Edited" className="max-w-full h-auto rounded-lg shadow-lg" />
            </div>
          )}
          {!isLoading && !editedImageUrl && <div className="text-slate-500">Your edited image will appear here.</div>}
        </div>
      </div>
    </div>
  );
};

export default ImageEditing;
