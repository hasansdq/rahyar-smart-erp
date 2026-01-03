import React, { useState, useEffect, useRef } from 'react';
import { User, ChatLog } from '../types';
import { db } from '../services/db';
import { chatWithManager, LiveSessionManager } from '../services/ai';
import { Card } from '../components/UI';
import { Sparkles, MessageSquare, Mic, Send, Paperclip, FileText, X, Activity, Phone, PhoneOff, Radio, Volume2, MicOff } from 'lucide-react';

const ChatView = ({ user }: { user: User }) => {
    const [activeTab, setActiveTab] = useState<'text' | 'live'>('text');
    
    // --- Text Chat State ---
    const [messages, setMessages] = useState<ChatLog[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Live Chat State ---
    const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [volume, setVolume] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const sessionRef = useRef<LiveSessionManager | null>(null);

    // --- Text Chat Methods ---
    const handleSend = async () => {
        if((!input.trim() && !selectedFile)) return;
        
        const userMsg: ChatLog = {
            id: Math.random().toString(),
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            timestamp: new Date().toLocaleTimeString('fa-IR'),
            message: selectedFile ? `${input} [فایل پیوست: ${selectedFile.name}]` : input,
            response: '',
            isVoice: false
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const fileToSend = selectedFile;
        setSelectedFile(null); // Clear immediately
        setLoading(true);

        const response = await chatWithManager(userMsg.message, false, fileToSend || undefined);
        
        setMessages(prev => prev.map(m => m.id === userMsg.id ? {...m, response: response} : m));
        setLoading(false);
        db.addChatLog({...userMsg, response});
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);


    // --- Live Chat Methods ---
    const toggleLiveSession = () => {
        if (liveStatus === 'connected' || liveStatus === 'connecting') {
            sessionRef.current?.disconnect();
        } else {
            setLiveStatus('connecting');
            setIsMuted(false);
            sessionRef.current = new LiveSessionManager(
                (status) => setLiveStatus(status as any),
                (vol) => setVolume(vol)
            );
            sessionRef.current.connect();
        }
    };

    const toggleMute = () => {
        if (sessionRef.current) {
            const newMutedState = !isMuted;
            setIsMuted(newMutedState);
            sessionRef.current.toggleMute(newMutedState);
        }
    };

    useEffect(() => {
        return () => {
            sessionRef.current?.disconnect();
        };
    }, []);


    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-fadeIn relative">
            
            {/* Header / Tabs */}
            <div className="p-2 px-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-10">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                         <Sparkles size={20}/>
                     </div>
                     <div>
                         <h3 className="font-bold dark:text-white text-sm md:text-base">دستیار هوشمند مدیرعامل</h3>
                         <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                             Gemini 3.0 Pro
                         </div>
                     </div>
                 </div>
                 
                 <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                     <button 
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'text' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <MessageSquare size={16}/> گفتگو
                     </button>
                     <button 
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <Radio size={16} className={activeTab === 'live' ? 'animate-pulse' : ''}/> تماس زنده
                     </button>
                 </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                
                {/* --- TEXT TAB --- */}
                <div className={`absolute inset-0 flex flex-col transition-transform duration-500 ${activeTab === 'text' ? 'translate-x-0' : 'translate-x-full opacity-0 pointer-events-none'}`}>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare size={32} className="text-slate-300 dark:text-slate-600"/>
                                </div>
                                <p className="font-medium">شروع گفتگو با هوش مصنوعی...</p>
                                <p className="text-xs mt-2">می‌توانید فایل‌های PDF یا تصاویر را نیز تحلیل کنید.</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className="space-y-2 animate-slideUp">
                                {/* User Message */}
                                <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-lg shadow-blue-500/20">
                                        <p className="text-sm leading-loose whitespace-pre-wrap">{msg.message}</p>
                                        <div className="text-[10px] opacity-70 mt-1 text-left">{msg.timestamp}</div>
                                    </div>
                                </div>
                                {/* AI Response */}
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-6 py-4 rounded-2xl rounded-tl-none max-w-[90%] shadow-sm">
                                        {msg.response ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-justify leading-loose">
                                                <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 h-6 px-2">
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef}></div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-20">
                        {selectedFile && (
                            <div className="mx-auto max-w-4xl mb-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 p-2 px-3 rounded-lg border border-blue-100 dark:border-blue-800 w-fit animate-fadeIn">
                                <FileText size={16} className="text-blue-600 dark:text-blue-400"/>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 max-w-[200px] truncate">{selectedFile.name}</span>
                                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-black/10 rounded-full"><X size={14} className="text-blue-700 dark:text-blue-300"/></button>
                            </div>
                        )}
                        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-4 mb-[2px] rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <Paperclip size={20}/>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*,.txt" onChange={handleFileSelect}/>
                            
                            <textarea 
                                className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white px-5 py-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none custom-scrollbar"
                                placeholder="پیام خود را بنویسید..."
                                rows={1}
                                style={{minHeight: '56px', maxHeight: '120px'}}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <button 
                                onClick={handleSend} 
                                disabled={loading || (!input.trim() && !selectedFile)}
                                className="bg-blue-600 text-white p-4 mb-[2px] rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                            >
                                <Send size={20} className={loading ? 'animate-pulse' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- LIVE TAB --- */}
                <div className={`absolute inset-0 bg-slate-900 text-white flex flex-col items-center justify-center transition-transform duration-500 ${activeTab === 'live' ? 'translate-x-0' : '-translate-x-full opacity-0 pointer-events-none'}`}>
                     {/* Background Animation */}
                     <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] transition-all duration-1000 ${liveStatus === 'connected' ? 'scale-150 opacity-40' : 'scale-100 opacity-20'}`}></div>
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-purple-500/20 rounded-full blur-[80px] transition-all duration-1000 delay-100 ${liveStatus === 'connected' ? 'scale-125 opacity-40' : 'scale-90 opacity-20'}`}></div>
                     </div>

                     <div className="relative z-10 flex flex-col items-center gap-8">
                         {/* Status Indicator */}
                         <div className="flex flex-col items-center gap-2">
                             <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 transition-colors ${
                                 liveStatus === 'connected' ? 'bg-green-500/20 border-green-500 text-green-400' :
                                 liveStatus === 'connecting' ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
                                 'bg-slate-800 border-slate-700 text-slate-400'
                             }`}>
                                 <div className={`w-2 h-2 rounded-full ${liveStatus === 'connected' ? 'bg-green-500 animate-pulse' : liveStatus === 'connecting' ? 'bg-amber-500 animate-bounce' : 'bg-slate-500'}`}></div>
                                 {liveStatus === 'connected' ? 'متصل به Gemini Live' : liveStatus === 'connecting' ? 'در حال برقراری ارتباط...' : 'آماده تماس'}
                             </div>
                             {liveStatus === 'connected' && <div className="text-slate-400 text-xs">مکالمه زنده با دسترسی کامل به داده‌های ERP</div>}
                         </div>

                         {/* Visualizer Circle */}
                         <div className="relative">
                             {/* Ripple Effect */}
                             {liveStatus === 'connected' && !isMuted && (
                                 <>
                                     <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping" style={{animationDuration: '2s'}}></div>
                                     <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" style={{animationDuration: '3s'}}></div>
                                 </>
                             )}
                             
                             {/* Main Circle */}
                             <div 
                                className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                                    liveStatus === 'connected' 
                                      ? (isMuted ? 'bg-slate-700 border-4 border-slate-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/50') 
                                      : 'bg-slate-800 border-4 border-slate-700'
                                }`}
                                style={{
                                    transform: liveStatus === 'connected' && !isMuted ? `scale(${1 + Math.min(volume / 50, 0.2)})` : 'scale(1)'
                                }}
                             >
                                 {liveStatus === 'connected' ? (
                                     isMuted ? <MicOff size={64} className="text-slate-400"/> : <Activity size={64} className="text-white opacity-80"/>
                                 ) : (
                                     <Mic size={64} className="text-slate-500"/>
                                 )}
                             </div>
                         </div>

                         {/* Controls */}
                         <div className="flex items-center gap-6">
                             {/* Mute Button (Only visible when connected) */}
                             {liveStatus === 'connected' && (
                                <button 
                                    onClick={toggleMute}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg ${
                                        isMuted ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-900'
                                    }`}
                                >
                                    {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                                </button>
                             )}

                             {/* Call Button */}
                             <button 
                                onClick={toggleLiveSession}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl ${
                                    liveStatus === 'connected' || liveStatus === 'connecting' 
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' 
                                    : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                                }`}
                             >
                                {liveStatus === 'connected' || liveStatus === 'connecting' ? <PhoneOff size={28}/> : <Phone size={28}/>}
                             </button>
                         </div>
                     </div>
                </div>

            </div>
        </div>
    );
};

export default ChatView;
