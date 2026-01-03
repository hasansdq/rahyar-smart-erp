
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { generateBusinessPlan } from '../services/ai';
import { BusinessPlanStructure } from '../types';
import { Card } from '../components/UI';
import { useUI } from '../context/UIContext';
import { 
    FileBarChart, Sparkles, Target, Zap, Activity, DollarSign, 
    ShieldAlert, AlertTriangle, TrendingUp, Search, Megaphone, 
    CheckCircle2, AlertOctagon, BrainCircuit, Rocket, BarChart3, PieChart as PieChartIcon, Layers
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
    RadialBarChart, RadialBar, Cell
} from 'recharts';

const BusinessPlanView = () => {
    const rawPlan = db.getBusinessPlan();
    const [plan, setPlan] = useState<BusinessPlanStructure | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('insights'); 
    const { showToast } = useUI();

    useEffect(() => {
        if(rawPlan) {
            try {
                const parsed = JSON.parse(rawPlan);
                if (parsed && typeof parsed === 'object') {
                    setPlan(parsed);
                } else {
                    setPlan(null);
                }
            } catch (e) {
                console.error("Failed to parse plan JSON", e);
                setPlan(null);
            }
        }
    }, [rawPlan]);

    const handleGenerate = async () => {
        setLoading(true);
        showToast('هوش مصنوعی در حال تحلیل جامع سازمان و تدوین بیزینس پلن است...', 'info');
        const result = await generateBusinessPlan();
        if (result) {
            db.setBusinessPlan(result);
            try {
                setPlan(JSON.parse(result));
                showToast('بیزینس پلن جدید با موفقیت تدوین شد', 'success');
            } catch {
                showToast('خطا در پردازش پاسخ هوش مصنوعی', 'error');
            }
        } else {
            showToast('خطا در ارتباط با هوش مصنوعی', 'error');
        }
        setLoading(false);
    };

    const tabs = [
      { id: 'insights', label: 'هوش تجاری', icon: BrainCircuit, color: 'from-violet-500 to-purple-500' },
      { id: 'marketing', label: 'مارکتینگ', icon: Megaphone, color: 'from-pink-500 to-rose-500' },
      { id: 'risk', label: 'مدیریت ریسک', icon: ShieldAlert, color: 'from-amber-500 to-orange-500' },
      { id: 'financial', label: 'پیش‌بینی مالی', icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
      { id: 'strategy', label: 'استراتژی', icon: Target, color: 'from-blue-500 to-cyan-500' },
   ];

   const formatMoney = (val: number) => new Intl.NumberFormat('fa-IR').format(val);

   const safePlan = plan || {
       aiInsights: { successProbability: 0, trends: [], discrepancies: [], suggestions: [], warnings: [] },
       marketingStrategy: { overview: '', campaigns: [] },
       riskManagement: [],
       financialProjections: { projections: [], summary: '' },
       executiveSummary: '',
       marketAnalysis: '',
       operationalPlan: '',
       generatedDate: ''
   };

   const insights = safePlan.aiInsights || { successProbability: 0, trends: [], discrepancies: [], suggestions: [], warnings: [] };
   const marketing = safePlan.marketingStrategy || { overview: '', campaigns: [] };
   const risks = safePlan.riskManagement || [];
   const financial = safePlan.financialProjections || { projections: [], summary: '' };

   // --- LOADING STATE ---
   if (loading) {
       return (
           <div className="flex flex-col h-full items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 animate-pulse-slow"></div>
               
               <div className="relative z-10 w-32 h-32 mb-8">
                   <div className="absolute inset-0 border-t-4 border-violet-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-4 border-r-4 border-fuchsia-500 rounded-full animate-spin-slow"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                       <BrainCircuit size={40} className="text-violet-600 animate-pulse"/>
                   </div>
               </div>
               
               <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 animate-pulse">
                   در حال پردازش داده‌های سازمانی
               </h2>
               <p className="mt-3 text-slate-500 font-medium">Gemini AI در حال تدوین استراتژی آینده شماست...</p>
           </div>
       );
   }

   // --- EMPTY STATE ---
   if (!plan && !rawPlan) {
       return (
          <div className="flex flex-col h-full items-center justify-center space-y-8 animate-fadeIn p-8 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 rounded-full blur-[100px] animate-blob pointer-events-none"></div>
              
              <div className="relative group cursor-pointer" onClick={handleGenerate}>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Rocket size={64} className="text-violet-600 dark:text-violet-400 group-hover:-translate-y-2 transition-transform duration-500 ease-out"/>
                  </div>
              </div>
              
              <div className="text-center max-w-lg z-10">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">بیزینس پلن <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">هوشمند</span></h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                      هوش مصنوعی با تحلیل عمیق داده‌های مالی، پروژه‌ها و منابع انسانی، 
                      نقشه راه موفقیت سازمان شما را ترسیم می‌کند.
                  </p>
              </div>

              <button 
                onClick={handleGenerate}
                className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-xl overflow-hidden hover:shadow-2xl hover:shadow-violet-500/20 transition-all"
              >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <span className="relative flex items-center gap-3">
                      <Sparkles size={20} className="animate-pulse"/>
                      شروع تحلیل و تدوین استراتژی
                  </span>
              </button>
          </div>
       );
   }

   // --- MAIN CONTENT ---
   return (
    <div className="h-full flex flex-col animate-fadeIn pb-6 overflow-hidden">
        
        {/* Header Section */}
        <div className="flex-shrink-0 px-1 mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-bold tracking-wider uppercase border border-violet-200 dark:border-violet-800">
                    AI Generated Strategy
                 </span>
                 <span className="text-slate-400 text-xs">{safePlan.generatedDate || 'پیش‌نویس'}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                 بیزینس پلن <span className="text-violet-600">جامع</span>
              </h2>
           </div>
           
           <button 
             onClick={handleGenerate} 
             className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all shadow-sm hover:shadow-md"
           >
             <Sparkles size={16}/>
             بروزرسانی تحلیل
           </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
             
             {/* Navigation Sidebar (Modern Tabs) */}
             <div className="lg:w-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex lg:flex-col items-center py-4 lg:py-6 gap-4 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-x-auto lg:overflow-visible shrink-0 z-10">
                {tabs.map(tab => {
                   const isActive = activeTab === tab.id;
                   return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                            isActive 
                            ? `bg-gradient-to-br ${tab.color} text-white shadow-lg scale-110` 
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                        title={tab.label}
                      >
                         <tab.icon size={22} className={`transition-transform duration-300 ${isActive ? 'rotate-0' : 'group-hover:scale-110'}`}/>
                         
                         {/* Tooltip for Desktop */}
                         <div className="absolute left-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none hidden lg:block z-50">
                            {tab.label}
                         </div>
                         
                         {/* Active Indicator */}
                         {isActive && <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/30 rounded-full hidden lg:block"></div>}
                      </button>
                   )
                })}
             </div>

             {/* Main Content Area with Glassmorphism */}
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl"></div>
                </div>

                {/* --- AI INSIGHTS TAB --- */}
                {activeTab === 'insights' && (
                    <div className="space-y-6 animate-slideUp pb-10">
                        {/* Top Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Success Gauge */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-1">
                                            <Activity size={16} className="text-emerald-400"/>
                                            شانس موفقیت
                                        </div>
                                        <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                            {insights.successProbability || 0}%
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out" 
                                            style={{width: `${insights.successProbability}%`}}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                                        محاسبه شده بر اساس تحلیل {financial.projections?.length || 0} پارامتر مالی و وضعیت فعلی بازار.
                                    </p>
                                </div>
                            </div>

                            {/* Warnings & Alerts */}
                            <div className="md:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                                <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                                        <AlertOctagon size={20}/>
                                    </div>
                                    نقاط بحرانی و ناهماهنگی‌ها
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {insights.discrepancies && insights.discrepancies.length > 0 ? insights.discrepancies.map((d, i) => (
                                        <div key={i} className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl text-sm text-slate-700 dark:text-slate-300 hover:scale-[1.02] transition-transform cursor-default">
                                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5"/>
                                            <span className="leading-relaxed">{d}</span>
                                        </div>
                                    )) : <div className="col-span-2 text-slate-500 text-sm italic">هیچ ناهماهنگی مهمی یافت نشد.</div>}
                                </div>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Trends */}
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="text-blue-500"/> روندهای بازار
                                </h3>
                                <ul className="space-y-3">
                                    {insights.trends && insights.trends.length > 0 ? insights.trends.map((t, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                                {i+1}
                                            </div>
                                            {t}
                                        </li>
                                    )) : <li className="text-sm text-slate-500">روندی یافت نشد.</li>}
                                </ul>
                            </div>

                            {/* Suggestions */}
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="text-emerald-500"/> پیشنهادات استراتژیک
                                </h3>
                                <ul className="space-y-3">
                                    {insights.suggestions && insights.suggestions.length > 0 ? insights.suggestions.map((s, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5"/>
                                            <span className="leading-relaxed">{s}</span>
                                        </li>
                                    )) : <li className="text-sm text-slate-500">پیشنهادی موجود نیست.</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MARKETING TAB --- */}
                {activeTab === 'marketing' && (
                    <div className="space-y-6 animate-slideUp pb-10">
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <h3 className="font-black text-2xl mb-4 relative z-10">استراتژی بازاریابی</h3>
                            <p className="text-pink-50 text-sm leading-8 text-justify relative z-10 max-w-3xl">
                                {marketing.overview || 'اطلاعاتی موجود نیست.'}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {marketing.campaigns && marketing.campaigns.length > 0 ? marketing.campaigns.map((camp, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-1 rounded-[2rem] shadow-md hover:shadow-xl transition-shadow duration-300">
                                    <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-[1.8rem] p-6 flex flex-col border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center">
                                                <Target size={24}/>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">{camp.channel}</span>
                                        </div>
                                        
                                        <h4 className="font-bold text-lg dark:text-white mb-2">{camp.name}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 flex-1 leading-relaxed">{camp.strategy}</p>
                                        
                                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">بودجه</span>
                                                <span className="font-bold dark:text-white">{formatMoney(camp.budget)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">بازدهی (ROI)</span>
                                                <span className="font-bold text-emerald-500">{camp.expectedRoi}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="col-span-full text-center text-slate-500 py-10">کمپینی تعریف نشده است.</div>}
                        </div>
                    </div>
                )}

                {/* --- RISK TAB --- */}
                {activeTab === 'risk' && (
                    <div className="space-y-6 animate-slideUp pb-10">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {risks && risks.length > 0 ? risks.map((risk, i) => (
                                <div key={i} className="group perspective">
                                    <div className={`relative h-full bg-white dark:bg-slate-800 rounded-[2rem] p-6 border-2 transition-transform duration-300 hover:-translate-y-2 shadow-lg ${
                                        risk.probability === 'High' ? 'border-rose-100 dark:border-rose-900/30' : 
                                        risk.probability === 'Medium' ? 'border-amber-100 dark:border-amber-900/30' : 'border-blue-100 dark:border-blue-900/30'
                                    }`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${
                                                risk.probability === 'High' ? 'bg-rose-50 text-rose-500' : 
                                                risk.probability === 'Medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                                            }`}>
                                                <ShieldAlert size={24}/>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    risk.probability === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {risk.probability} PROB
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <h4 className="font-bold text-lg dark:text-white mb-2">{risk.title}</h4>
                                        
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-4">
                                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <Zap size={12}/> استراتژی کاهش ریسک
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                                {risk.mitigation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="col-span-full text-center text-slate-500">ریسکی شناسایی نشده است.</div>}
                        </div>
                    </div>
                )}

                {/* --- FINANCIAL TAB --- */}
                {activeTab === 'financial' && (
                    <div className="space-y-6 animate-slideUp pb-10">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-700">
                             <div className="flex items-center justify-between mb-8">
                                 <div>
                                     <h4 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                         <BarChart3 className="text-emerald-500"/> چشم‌انداز مالی
                                     </h4>
                                     <p className="text-slate-500 text-sm mt-1">پیش‌بینی درآمد و سود خالص در سال‌های آتی</p>
                                 </div>
                                 <div className="flex gap-2">
                                     <span className="flex items-center gap-1 text-xs font-bold text-violet-500"><div className="w-2 h-2 rounded-full bg-violet-500"></div> درآمد</span>
                                     <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> سود</span>
                                 </div>
                             </div>

                             <div className="h-96 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={financial.projections || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false}/>
                                      <XAxis dataKey="year" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10}/>
                                      <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} dx={-10}/>
                                      <ReTooltip 
                                        contentStyle={{backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#fff'}}
                                        itemStyle={{color: '#fff'}}
                                        cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                                      />
                                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                      <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProf)" />
                                   </AreaChart>
                                </ResponsiveContainer>
                             </div>
                             
                             <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-sm text-slate-600 dark:text-slate-300 leading-loose text-justify border border-slate-100 dark:border-slate-800">
                                 <span className="text-emerald-500 font-bold text-lg block mb-2">خلاصه تحلیل:</span>
                                 {financial.summary || 'تحلیل مالی موجود نیست.'}
                             </div>
                        </div>
                    </div>
                )}

                 {/* --- STRATEGY TAB --- */}
                 {activeTab === 'strategy' && (
                    <div className="space-y-6 animate-slideUp pb-10">
                        {[
                            { title: 'خلاصه مدیریتی', content: safePlan.executiveSummary, icon: Layers, color: 'text-blue-500' },
                            { title: 'تحلیل بازار', content: safePlan.marketAnalysis, icon: Search, color: 'text-purple-500' },
                            { title: 'برنامه عملیاتی', content: safePlan.operationalPlan, icon:  Activity, color: 'text-rose-500' }
                        ].map((section, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm hover:shadow-lg transition-shadow border border-slate-100 dark:border-slate-700">
                                <h3 className={`font-bold text-xl dark:text-white mb-6 flex items-center gap-3 ${section.color}`}>
                                    <section.icon size={24}/> {section.title}
                                </h3>
                                <div className="text-slate-600 dark:text-slate-300 text-sm leading-8 text-justify whitespace-pre-wrap relative pl-6 border-l-2 border-slate-100 dark:border-slate-700">
                                    {section.content || 'اطلاعاتی موجود نیست.'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

             </div>
        </div>
     </div>
    );
};

export default BusinessPlanView;
