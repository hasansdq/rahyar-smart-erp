
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatLog } from '../types';
import { db } from '../services/db';
import { chatWithManager, LiveSessionManager } from '../services/ai';
import { Sparkles, MessageSquare, Mic, Send, Paperclip, FileText, X, Activity, Phone, PhoneOff, MicOff, ChevronRight, Cpu, Layers } from 'lucide-react';

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
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            message: selectedFile ? `${input} [فایل پیوست: ${selectedFile.name}]` : input,
            response: '',
            isVoice: false
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const fileToSend = selectedFile;
        setSelectedFile(null); 
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
        <div className="h-[calc(100vh-10rem)] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative isolate">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none z-0"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

            {/* Modern Header */}
            <div className="relative z-20 px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shrink-0">
                 <div className="flex items-center gap-4">
                     <div className="relative group">
                         <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                         <div className="relative w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl flex items-center justify-center shadow-inner border border-white/10">
                             <Cpu size={24} className="text-blue-400"/>
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
                     </div>
                     <div>
                         <h3 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">دستیار هوشمند مدیر</h3>
                         <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                             <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                                <Sparkles size={10} /> Gemini 3.0 Pro
                             </span>
                             <span className="hidden md:inline">| متصل به پایگاه دانش</span>
                         </div>
                     </div>
                 </div>
                 
                 {/* Futuristic Toggle */}
                 <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
                     <div className={`absolute inset-y-1.5 w-[calc(50%-4px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-all duration-300 ease-out ${activeTab === 'text' ? 'right-1.5' : 'right-[calc(50%+2.5px)]'}`}></div>
                     <button 
                        onClick={() => setActiveTab('text')}
                        className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'text' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                     >
                        <MessageSquare size={16}/> گفتگو
                     </button>
                     <button 
                        onClick={() => setActiveTab('live')}
                        className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'live' ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                     >
                        <Activity size={16}/> تماس زنده
                     </button>
                 </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
                
                {/* --- TEXT MODE --- */}
                <div className={`absolute inset-0 flex flex-col transition-all duration-500 ease-in-out ${activeTab === 'text' ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 translate-x-10 pointer-events-none z-10'}`}>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth pb-4">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner animate-float">
                                    <Sparkles size={40} className="text-indigo-400 dark:text-indigo-300"/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">چطور می‌توانم کمک کنم؟</h3>
                                <p className="text-sm text-slate-500 max-w-xs text-center leading-relaxed">
                                    سوالات خود را درباره پروژه‌ها، وضعیت مالی یا تیم بپرسید. من به تمام داده‌های سازمان دسترسی دارم.
                                </p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={msg.id} className="space-y-3 animate-slideUp" style={{animationDelay: `${idx * 0.05}s`}}>
                                {/* User Message */}
                                <div className="flex justify-end group">
                                    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white px-6 py-4 rounded-[1.5rem] rounded-tr-md max-w-[85%] shadow-xl shadow-indigo-500/20 relative overflow-hidden transition-transform hover:scale-[1.01]">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                                        <p className="text-sm leading-7 relative z-10 whitespace-pre-wrap">{msg.message}</p>
                                        <div className="text-[10px] text-indigo-200 mt-2 text-left font-mono relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">{msg.timestamp}</div>
                                    </div>
                                </div>
                                
                                {/* AI Response */}
                                <div className="flex justify-start gap-3 items-end">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg flex-shrink-0 mb-2">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-6 py-4 rounded-[1.5rem] rounded-tl-md max-w-[90%] shadow-sm hover:shadow-md transition-shadow">
                                        {msg.response ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-justify leading-loose">
                                                <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 h-6">
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} className="h-0"></div>
                    </div>

                    {/* Modern Input Area */}
                    <div className="relative p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-30 shrink-0">
                        {selectedFile && (
                            <div className="absolute bottom-full right-8 mb-2 bg-white dark:bg-slate-800 p-2 pr-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-lg animate-slideUp flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                                    <FileText size={16}/>
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{selectedFile.name}</span>
                                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={14}/></button>
                            </div>
                        )}
                        
                        <div className="max-w-4xl mx-auto relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-1.5 flex items-end shadow-inner transition-colors focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-95"
                                title="پیوست فایل"
                            >
                                <Paperclip size={20} className="transform -rotate-45"/>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*,.txt" onChange={handleFileSelect}/>
                            
                            <textarea 
                                className="flex-1 bg-transparent text-slate-900 dark:text-white px-3 py-3.5 outline-none text-sm resize-none max-h-32 custom-scrollbar placeholder:text-slate-400"
                                placeholder="اینجا بنویسید..."
                                rows={1}
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
                                className={`p-3 rounded-2xl transition-all duration-300 ${
                                    (input.trim() || selectedFile) && !loading
                                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95' 
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Send size={20} className={loading ? 'animate-pulse' : 'transform -rotate-90 rtl:rotate-0'} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- LIVE MODE (Voice) --- */}
                <div className={`absolute inset-0 bg-slate-950 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${activeTab === 'live' ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 -translate-x-10 pointer-events-none z-10'}`}>
                     
                     {/* Dynamic Background */}
                     <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow"></div>
                        
                        {/* Status Glows */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000 ${liveStatus === 'connected' ? 'bg-indigo-500/20' : liveStatus === 'connecting' ? 'bg-amber-500/10' : 'bg-slate-800/20'}`}></div>
                     </div>

                     <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
                         
                         {/* Status Pill */}
                         <div className={`mb-12 px-5 py-2 rounded-full border backdrop-blur-md flex items-center gap-3 transition-all duration-500 ${
                             liveStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                             liveStatus === 'connecting' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                             'bg-white/5 border-white/10 text-slate-400'
                         }`}>
                             <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${liveStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : liveStatus === 'connecting' ? 'bg-amber-400 animate-bounce' : 'bg-slate-500'}`}></div>
                             <span className="text-xs font-bold tracking-wider uppercase">
                                 {liveStatus === 'connected' ? 'Gemini Live Active' : liveStatus === 'connecting' ? 'Connecting...' : 'Ready to Connect'}
                             </span>
                         </div>

                         {/* Main Visualizer */}
                         <div className="relative mb-16 h-64 w-64 flex items-center justify-center">
                             {/* Orbit Rings */}
                             {liveStatus === 'connected' && !isMuted && (
                                 <>
                                     <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping" style={{animationDuration: '3s'}}></div>
                                     <div className="absolute inset-4 rounded-full border border-violet-500/30 animate-ping" style={{animationDuration: '2s', animationDelay: '0.5s'}}></div>
                                     <div className="absolute inset-8 rounded-full border border-fuchsia-500/30 animate-ping" style={{animationDuration: '2s', animationDelay: '1s'}}></div>
                                 </>
                             )}
                             
                             {/* Central Core */}
                             <div 
                                className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-200 ease-out z-10 shadow-[0_0_50px_rgba(79,70,229,0.3)] ${
                                    liveStatus === 'connected' 
                                      ? (isMuted ? 'bg-slate-800 ring-4 ring-slate-700' : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600') 
                                      : 'bg-slate-900 border-2 border-slate-800'
                                }`}
                                style={{
                                    transform: liveStatus === 'connected' && !isMuted ? `scale(${1 + Math.min(volume / 40, 0.4)})` : 'scale(1)'
                                }}
                             >
                                 {/* Internal Texture */}
                                 <div className="absolute inset-0 rounded-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                                 
                                 {liveStatus === 'connected' ? (
                                     isMuted ? <MicOff size={48} className="text-slate-500"/> : <Activity size={56} className="text-white drop-shadow-lg"/>
                                 ) : (
                                     <Mic size={56} className="text-slate-600 group-hover:text-slate-400 transition-colors"/>
                                 )}
                             </div>
                         </div>

                         {/* Control Deck */}
                         <div className="flex items-center gap-8">
                             {/* Mute Button */}
                             <button 
                                onClick={toggleMute}
                                disabled={liveStatus !== 'connected'}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border ${
                                    liveStatus !== 'connected' ? 'opacity-0 scale-50 pointer-events-none' :
                                    isMuted ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white/10 border-white/10 text-white hover:bg-white/20 backdrop-blur-md'
                                }`}
                                title={isMuted ? "Unmute" : "Mute"}
                             >
                                {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                             </button>

                             {/* Main Action Button */}
                             <button 
                                onClick={toggleLiveSession}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 ${
                                    liveStatus === 'connected' || liveStatus === 'connecting' 
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 ring-4 ring-rose-500/20' 
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                                }`}
                             >
                                {liveStatus === 'connected' || liveStatus === 'connecting' ? <PhoneOff size={32} className="animate-pulse"/> : <Phone size={32}/>}
                             </button>

                             {/* Placeholder for future feature (e.g. Settings) */}
                             <div className="w-14 h-14 opacity-0 pointer-events-none"></div>
                         </div>
                         
                         {liveStatus === 'disconnected' && (
                             <p className="mt-8 text-slate-500 text-sm animate-pulse">برای شروع مکالمه زنده دکمه سبز را لمس کنید</p>
                         )}
                     </div>
                </div>

            </div>
        </div>
    );
};

export default ChatView;
