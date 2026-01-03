import React, { useState, useEffect } from 'react';
import { User, UserRole, ProjectStatus } from '../types';
import { db } from '../services/db';
import { getSmartAlerts, chatWithManager } from '../services/ai';
import { Card } from '../components/UI';
import { formatMoney } from '../utils/helpers';
import { 
  Sparkles, CheckCircle, Briefcase, TrendingUp, CheckSquare, Clock, Wallet, Users, Activity, MessageSquare, X, Send 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, 
  LineChart, Line, Legend, ComposedChart
} from 'recharts';

const Dashboard = ({ user }: { user: User }) => {
  const [data, setData] = useState(db.getData());
  const [alerts, setAlerts] = useState<{ warning: string, suggestion: string } | null>(null);
  const [showDashChat, setShowDashChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    {role: 'ai', text: 'سلام! من تحلیلگر هوشمند شما هستم. چه سوالی درباره وضعیت شرکت دارید؟'}
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    if (user.role === UserRole.MANAGER) {
      getSmartAlerts().then(setAlerts);
    }
  }, [user.role]);

  // Stats
  const activeProjects = data.projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length;
  const pendingTasks = data.tasks.filter(t => t.status !== 'done').length;
  const totalRevenue = data.finance.filter(f => f.type === 'income').reduce((acc, c) => acc + c.amount, 0);
  const totalExpense = data.finance.filter(f => f.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
  
  // Charts Data
  const chartData = data.projects.map(p => ({
    name: p.title.substring(0, 15) + '...',
    progress: p.progress,
    tasks: data.tasks.filter(t => t.projectId === p.id).length
  }));

  const handleChatSubmit = async () => {
    if(!chatInput.trim()) return;
    const userMsg = {role: 'user' as const, text: chatInput};
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);
    
    // Using chatWithManager but in a "Quick Analysis" context
    const response = await chatWithManager(userMsg.text, false);
    setChatMessages(prev => [...prev, {role: 'ai', text: response}]);
    setIsChatLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20 relative">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-extrabold dark:text-white tracking-tight">داشبورد مدیریتی</h2>
           <p className="text-slate-500 mt-1">نمای کلی وضعیت سازمان در یک نگاه</p>
        </div>
        <div className="text-right hidden md:block">
           <div className="text-lg font-bold dark:text-white">{new Date().toLocaleDateString('fa-IR', {weekday: 'long', day: 'numeric', month: 'long'})}</div>
           <div className="text-xs text-slate-400">آخرین بروزرسانی: همین لحظه</div>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts && (
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm animate-pulse">
                 <Sparkles size={32} className="text-yellow-300"/>
              </div>
              <div className="flex-1">
                 <h4 className="font-bold text-lg mb-1 flex items-center gap-2">تحلیل هوشمند وضعیت <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full">AI Analysis</span></h4>
                 <p className="opacity-90 text-sm leading-relaxed">{alerts.warning}</p>
                 <div className="mt-3 flex items-center gap-2 text-xs font-medium bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-white/10">
                    <CheckCircle size={14} className="text-emerald-400"/>
                    پیشنهاد: {alerts.suggestion}
                 </div>
              </div>
           </div>
           {/* Background Shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Briefcase size={24}/></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">پروژه‌ها</span>
           </div>
           <div className="text-3xl font-bold dark:text-white mb-1">{activeProjects}</div>
           <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-emerald-500 font-bold flex items-center"><TrendingUp size={12}/> +2</span> در این ماه
           </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><CheckSquare size={24}/></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">وظایف</span>
           </div>
           <div className="text-3xl font-bold dark:text-white mb-1">{pendingTasks}</div>
           <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-amber-500 font-bold flex items-center"><Clock size={12}/> 5</span> وظیفه فوری
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><Wallet size={24}/></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">جریان مالی</span>
           </div>
           <div className="text-2xl font-bold dark:text-white mb-1">{formatMoney(totalRevenue - totalExpense)}</div>
           <div className="text-xs text-slate-500">سود خالص دوره</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={24}/></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">پرسنل</span>
           </div>
           <div className="text-3xl font-bold dark:text-white mb-1">{data.users.length}</div>
           <div className="text-xs text-slate-500">نفر فعال در سازمان</div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 min-h-[400px]">
            <h3 className="font-bold dark:text-white mb-6 flex items-center gap-2">
               <Activity size={20} className="text-blue-500"/>
               عملکرد پروژه‌ها و وظایف
            </h3>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false}/>
                     <XAxis dataKey="name" tick={{fontSize: 10}}/>
                     <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" width={30}/>
                     <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" width={30}/>
                     <ReTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                     <Legend />
                     <Bar yAxisId="left" dataKey="progress" name="پیشرفت (%)" barSize={30} fill="#3b82f6" radius={[8, 8, 0, 0]} />
                     <Line yAxisId="right" type="monotone" dataKey="tasks" name="تعداد وظایف" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card className="min-h-[400px] flex flex-col">
            <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
               <Clock size={20} className="text-indigo-500"/>
               آخرین فعالیت‌ها
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
               {data.tasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-default">
                     <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${t.status === 'done' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                     <div>
                        <div className="text-sm font-bold dark:text-slate-200">{t.title}</div>
                        <div className="text-xs text-slate-400 mt-1">سررسید: {t.dueDate}</div>
                     </div>
                  </div>
               ))}
               {data.projects.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-default">
                     <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-blue-500"></div>
                     <div>
                        <div className="text-sm font-bold dark:text-slate-200">پروژه: {p.title}</div>
                        <div className="text-xs text-slate-400 mt-1">وضعیت: {p.status}</div>
                     </div>
                  </div>
               ))}
            </div>
         </Card>
      </div>

      {/* Dashboard Floating Chatbot */}
      <div className="fixed bottom-8 left-8 z-40">
         {!showDashChat ? (
            <button 
               onClick={() => setShowDashChat(true)}
               className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-110 transition-transform animate-bounce"
            >
               <MessageSquare size={28} fill="currentColor"/>
            </button>
         ) : (
            <div className="w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[500px] animate-slideInUp">
               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                     <Sparkles size={18}/>
                     <span className="font-bold text-sm">تحلیلگر سریع</span>
                  </div>
                  <button onClick={() => setShowDashChat(false)}><X size={18}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                  {chatMessages.map((m, i) => (
                     <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 rounded-bl-none'}`}>
                           {m.text}
                        </div>
                     </div>
                  ))}
                  {isChatLoading && <div className="text-xs text-slate-400 px-2">در حال تحلیل...</div>}
               </div>
               <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input 
                     className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm outline-none dark:text-white"
                     placeholder="سوال بپرسید..."
                     value={chatInput}
                     onChange={e => setChatInput(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
                  />
                  <button onClick={handleChatSubmit} className="p-2 bg-blue-600 text-white rounded-xl"><Send size={16}/></button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;
