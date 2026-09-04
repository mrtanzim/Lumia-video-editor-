import React, { useState, useCallback } from 'react';
import { User, Mail, Lock, Chrome, Github, Shield, Crown, Zap } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Plan = 'free' | 'standard' | 'pro';

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<Plan>('free');
  const [isSignUp, setIsSignUp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Account ${isSignUp ? 'created' : 'signed in'}! Plan: ${plan}. (Demo)`);
    onClose();
  };

  const PLANS: { key: Plan; label: string; price: string; features: string[]; icon: React.ReactNode }[] = [
    { key: 'free', label: 'Free', price: '$0/mo', features: ['720p export', 'Watermark', '5 projects'], icon: <User size={16} /> },
    { key: 'standard', label: 'Standard', price: '$12/mo', features: ['1080p export', 'No watermark', '50 projects', 'Basic AI'], icon: <Zap size={16} /> },
    { key: 'pro', label: 'Pro', price: '$29/mo', features: ['4K export', 'No watermark', 'Unlimited', 'All AI tools', 'Priority render'], icon: <Crown size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield size={16} /> {isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><span className="text-lg">&times;</span></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {PLANS.map(p => (
              <button key={p.key} onClick={() => setPlan(p.key)} className={`flex-1 p-3 rounded-lg border text-center transition ${plan === p.key ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>
                <div className="flex justify-center mb-1">{p.icon}</div>
                <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">{p.label}</div>
                <div className="text-[9px] text-gray-500">{p.price}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-xs outline-none focus:border-indigo-500" required />
              </div>
            )}
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-xs outline-none focus:border-indigo-500" required />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-xs outline-none focus:border-indigo-500" required />
            </div>
            <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition">{isSignUp ? 'Create Account' : 'Sign In'}</button>
          </form>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-[10px] text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition"><Chrome size={14} /> Google</button>
            <button className="py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition"><Github size={14} /> GitHub</button>
          </div>

          <p className="text-[10px] text-gray-500 text-center">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 hover:underline">{isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </p>
        </div>
      </div>
    </div>
  );
};
