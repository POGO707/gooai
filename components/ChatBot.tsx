
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage } from '../types';
import Spinner from './common/Spinner';
import { Send } from 'lucide-react';

const ChatBot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
      });
      setChat(newChat);
    } catch (e: any) {
        setError('Failed to initialize the AI model. Please check your API key.');
        console.error(e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      const result = await chat.sendMessageStream({ message: input });
      
      for await (const chunk of result) {
        const chunkText = chunk.text;
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === 'model') {
            return [...prev.slice(0, -1), { role: 'model', text: lastMessage.text + chunkText }];
          }
          return prev;
        });
      }

    } catch (e: any) {
      const errorMessage = 'An error occurred while fetching the response.';
      setError(errorMessage);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'model' && lastMessage.text === '') {
          return [...prev.slice(0, -1), { role: 'model', text: errorMessage }];
        }
        return prev;
      });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-800 rounded-lg shadow-lg">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-2xl ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length-1]?.role === 'user' && (
             <div className="flex justify-start">
               <div className="px-4 py-2 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none">
                 <Spinner />
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {error && <p className="p-2 text-center text-red-400">{error}</p>}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Gemini anything..."
            className="w-full p-3 bg-transparent rounded-lg focus:outline-none text-slate-100"
            disabled={isLoading || !chat}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !chat}
            className="p-3 text-white bg-blue-600 rounded-lg m-1 disabled:bg-slate-500 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
