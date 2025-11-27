import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, X, Loader2 } from 'lucide-react';
import { Flower } from '../types';

interface GeminiAssistantProps {
  flower: Flower | null;
  onClose: () => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ flower, onClose }) => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const askGemini = async (promptType: 'care' | 'arrangement' | 'sales') => {
    if (!flower || !process.env.API_KEY) {
        setError("System not configured or no flower selected.");
        return;
    }
    
    setLoading(true);
    setResponse('');
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let prompt = '';
      switch (promptType) {
        case 'care':
          prompt = `Provide concise care instructions for a ${flower.name}. Include watering, light requirements, and how to extend shelf life. Max 100 words.`;
          break;
        case 'arrangement':
          prompt = `Suggest 3 flowers that go well with ${flower.name} in a bouquet and briefly explain why. Max 100 words.`;
          break;
        case 'sales':
          prompt = `Give me a one-sentence sales pitch for a ${flower.name} priced at $${flower.price.toFixed(2)}.`;
          break;
      }

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setResponse(result.text || "No response generated.");
    } catch (err) {
      setError("Failed to fetch AI response. Please check API configuration.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!flower) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-semibold">AI Assistant for {flower.name}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button 
              onClick={() => askGemini('care')}
              className="p-3 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition text-sm font-medium flex flex-col items-center gap-1 text-center"
            >
              <span>🌱</span> Care Tips
            </button>
            <button 
              onClick={() => askGemini('arrangement')}
              className="p-3 bg-fuchsia-50 text-fuchsia-700 rounded-lg hover:bg-fuchsia-100 transition text-sm font-medium flex flex-col items-center gap-1 text-center"
            >
              <span>💐</span> Pairings
            </button>
            <button 
              onClick={() => askGemini('sales')}
              className="p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-medium flex flex-col items-center gap-1 text-center"
            >
              <span>💰</span> Sales Pitch
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Thinking...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          ) : response ? (
            <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100">
               <p className="whitespace-pre-line leading-relaxed">{response}</p>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">
              Select a topic above to get AI insights about this flower.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
