
import React, { useState } from 'react';
import ChatBot from './components/ChatBot';
import TextGeneration from './components/TextGeneration';
import ImageGeneration from './components/ImageGeneration';
import ImageEditing from './components/ImageEditing';
import VideoGeneration from './components/VideoGeneration';
import LiveConversation from './components/LiveConversation';
import GroundedSearch from './components/GroundedSearch';
import TextToSpeech from './components/TextToSpeech';
import { Bot, MessageSquare, Image, Film, Mic, Search, SlidersHorizontal, Volume2 } from 'lucide-react';

type Tab = 'Chat' | 'Text' | 'Image Gen' | 'Image Edit' | 'Video Gen' | 'Live' | 'Search' | 'TTS';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Chat');

  const tabs: { name: Tab; icon: React.ReactNode }[] = [
    { name: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Text', icon: <Bot className="w-5 h-5" /> },
    { name: 'Image Gen', icon: <Image className="w-5 h-5" /> },
    { name: 'Image Edit', icon: <SlidersHorizontal className="w-5 h-5" /> },
    { name: 'Video Gen', icon: <Film className="w-5 h-5" /> },
    { name: 'Live', icon: <Mic className="w-5 h-5" /> },
    { name: 'Search', icon: <Search className="w-5 h-5" /> },
    { name: 'TTS', icon: <Volume2 className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Chat': return <ChatBot />;
      case 'Text': return <TextGeneration />;
      case 'Image Gen': return <ImageGeneration />;
      case 'Image Edit': return <ImageEditing />;
      case 'Video Gen': return <VideoGeneration />;
      case 'Live': return <LiveConversation />;
      case 'Search': return <GroundedSearch />;
      case 'TTS': return <TextToSpeech />;
      default: return <ChatBot />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="p-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Gemini AI Showcase
        </h1>
      </header>
      
      <div className="flex flex-col md:flex-row flex-grow">
        <nav className="p-2 md:p-4 border-b md:border-b-0 md:border-r border-slate-700">
          <ul className="flex flex-row md:flex-col justify-center space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto">
            {tabs.map((tab) => (
              <li key={tab.name}>
                <button
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center justify-center md:justify-start w-full p-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.name
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline md:ml-2">{tab.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
