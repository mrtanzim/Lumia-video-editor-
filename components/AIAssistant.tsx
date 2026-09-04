
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Minimize2, Maximize2, Bot, User } from 'lucide-react';
import { aiAssistantService, ChatMessage } from '../services/aiAssistantService';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  "How do I trim a video?",
  "Ami video crop korbo kivabe?",
  "Audio adjust korbo kemne?",
  "What filters are available?"
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your Lumina AI Assistant. 👋 Ask me anything about editing, tools, or effects!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Get AI response
      // Pass only the last few messages to keep context but save tokens
      const history = messages.slice(-6); 
      const responseText = await aiAssistantService.sendMessage(history, text);
      
      const aiMsg: ChatMessage = { role: 'assistant', content: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Minimized State
  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full shadow-lg shadow-indigo-500/30 hover:scale-110 transition-transform animate-in fade-in slide-in-from-bottom-10"
      >
        <Sparkles className="text-white" size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 font-sans">
      
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 p-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <Sparkles size={16} className="text-indigo-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Lumina Assistant</h3>
            <p className="text-[10px] text-indigo-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-full text-indigo-200 transition">
            <Minimize2 size={16} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-indigo-200 transition">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212] scrollbar-thin scrollbar-thumb-gray-800">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            
            {/* Bubble */}
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-gray-800 text-gray-100 rounded-tr-sm' 
                : 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 text-gray-200 rounded-tl-sm'
            }`}>
               {/* Basic Markdown-like parsing for bold text */}
               {msg.content.split('**').map((part, i) => 
                 i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
               )}
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                 <Bot size={14} />
              </div>
              <div className="bg-indigo-900/20 p-3 rounded-2xl rounded-tl-sm border border-indigo-500/10 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></span>
                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></span>
                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (Only show if few messages) */}
      {messages.length < 4 && (
        <div className="px-4 pb-2 bg-[#121212] flex gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_ACTIONS.map((action, i) => (
            <button 
              key={i}
              onClick={() => handleSend(action)}
              className="whitespace-nowrap px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-gray-800 rounded-full text-xs text-indigo-300 transition hover:border-indigo-500/50"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[#1a1a1a] border-t border-gray-800">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask AI how to edit..." 
            className="w-full bg-[#0f0f0f] border border-gray-700 text-gray-200 text-sm rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-1.5 w-9 h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} className={inputValue.trim() ? "translate-x-0.5" : ""} />
          </button>
        </div>
        <div className="mt-2 text-center text-[10px] text-gray-600">
           AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
};
