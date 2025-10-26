
import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  promptText: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, promptText }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative group">
          <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded-lg" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-4 text-slate-400" />
            <p className="mb-2 text-sm text-slate-400">
              <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">{promptText}</p>
          </div>
          <input id="file-upload" type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
};

export default ImageUpload;
