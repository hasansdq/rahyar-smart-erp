
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { generateBusinessPlan } from '../services/ai';
import { BusinessPlanStructure } from '../types';
import { Card } from '../components/UI';
import { useUI } from '../context/UIContext';
import { 
    FileBarChart, Sparkles, Target, Zap, Activity, DollarSign, 
    ShieldAlert, AlertTriangle, TrendingUp, Search, Megaphone, 
    CheckCircle2, AlertOctagon, BrainCircuit
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
    RadialBarChart, RadialBar
} from 'recharts';

const BusinessPlanView = () => {
    const rawPlan = db.getBusinessPlan();
    const [plan, setPlan] = useState<BusinessPlanStructure | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('insights'); // Start with AI Insights
    const { showToast } = useUI();

    useEffect(() => {
        if(rawPlan) {
            try {
                const parsed = JSON.parse(rawPlan);
                // Basic validation to ensure structure matches expectation or provide defaults
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
      { id: 'insights', label: 'تحلیل هوشمند', icon: BrainCircuit },
      { id: 'marketing', label: 'مارکتینگ و کمپین', icon: Megaphone },
      { id: 'risk', label: 'مدیریت ریسک', icon: ShieldAlert },
      { id: 'financial', label: 'پیش‌بینی مالی', icon: DollarSign },
      { id: 'strategy', label: 'استراتژی و عملیات', icon: Target },
   ];

   const formatMoney = (val: number) => new Intl.NumberFormat('fa-IR').format(val);

   // Helper to safely access nested properties
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

   // Ensure nested objects exist even if plan exists but is incomplete
   const insights = safePlan.aiInsights || { successProbability: 0, trends: [], discrepancies: [], suggestions: [], warnings: [] };
   const marketing = safePlan.marketingStrategy || { overview: '', campaigns: [] };
   const risks = safePlan.riskManagement || [];
   const financial = safePlan.financialProjections || { projections: [], summary: '' };

   if (!plan && !loading && !rawPlan) {
       return (
          <div className="flex flex-col h-full items-center justify-center space-y-6 animate-fadeIn p-8">
              <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse"></div>
                  <FileBarChart size={80} className="text-purple-600 relative z-10"/>
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center">بیزینس پلن هوشمند</h2>
              <p className="text-slate-500 text-center max-w-lg leading-relaxed">
                  هوش مصنوعی با دسترسی کامل به داده‌های مالی، پروژه‌ها و منابع انسانی، 
                  یک نقشه راه دقیق، تحلیل ریسک و استراتژی بازاریابی برای شما تدوین می‌کند.
              </p>
              <button 
                onClick={handleGenerate}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-purple-500/30 hover:scale-105 transition-transform flex items-center gap-3"
              >
                  <Sparkles size={20} className="animate-pulse"/>
                  تدوین بیزینس پلن با AI
              </button>
          </div>
       );
   }

   return (
    <div className="space-y-6 animate-fadeIn h-full flex flex-col pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
           <div>
              <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                 <BrainCircuit className="text-purple-600"/> بیزینس پلن استراتژیک
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                 <span>نسخه: {safePlan.generatedDate || 'پیش‌نویس'}</span>
                 <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                 <span className="text-purple-600 font-bold">Generated by Gemini 3.0 Pro</span>
              </div>
           </div>
           <button 
             onClick={handleGenerate} 
             disabled={loading}
             className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all border border-purple-100 dark:border-purple-800"
           >
             {loading ? <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"></div> : <Sparkles size={18}/>}
             {plan ? 'بروزرسانی تحلیل' : 'تولید مجدد'}
           </button>
        </div>

        {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-24 h-24 relative">
                    <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={32}/>
                </div>
                <p className="mt-6 text-slate-500 font-medium animate-pulse">در حال تحلیل داده‌های سازمان و تدوین استراتژی...</p>
            </div>
        ) : plan ? (
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
             {/* Sidebar Navigation */}
             <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 shrink-0">
                {tabs.map(tab => (
                   <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                         activeTab === tab.id 
                         ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/30 scale-105 origin-left' 
                         : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                   >
                      <tab.icon size={18}/> {tab.label}
                   </button>
                ))}
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                
                {/* --- AI INSIGHTS TAB --- */}
                {activeTab === 'insights' && (
                    <div className="space-y-6 animate-slideUp">
                        {/* Success Probability Meter */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="flex items-center justify-between relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 text-white border-none">
                                <div className="relative z-10">
                                    <h3 className="text-slate-300 text-sm font-medium mb-1">شانس موفقیت کلی</h3>
                                    <div className="text-4xl font-black">{insights.successProbability || 0}%</div>
                                    <div className="text-xs text-emerald-400 mt-2 font-bold flex items-center gap-1">
                                        <TrendingUp size={14}/> بر اساس تحلیل داده‌ها
                                    </div>
                                </div>
                                <div className="h-24 w-24">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={10} data={[{fill: '#a78bfa', value: insights.successProbability || 0}]}>
                                            <RadialBar background dataKey="value" cornerRadius={10} />
                                        </RadialBarChart>
                                     </ResponsiveContainer>
                                </div>
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/30 blur-2xl rounded-full"></div>
                            </Card>

                            <Card className="md:col-span-2">
                                <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
                                    <AlertOctagon className="text-amber-500"/> ناهماهنگی‌های سازمانی کشف شده
                                </h3>
                                <div className="space-y-3">
                                    {insights.discrepancies && insights.discrepancies.length > 0 ? insights.discrepancies.map((d, i) => (
                                        <div key={i} className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5"/>
                                            {d}
                                        </div>
                                    )) : <div className="text-slate-500 text-sm">هیچ ناهماهنگی مهمی یافت نشد.</div>}
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="text-blue-500"/> روندهای بازار
                                </h3>
                                <ul className="space-y-2">
                                    {insights.trends && insights.trends.length > 0 ? insights.trends.map((t, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            {t}
                                        </li>
                                    )) : <li className="text-sm text-slate-500">روندی یافت نشد.</li>}
                                </ul>
                            </Card>
                            <Card>
                                <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="text-emerald-500"/> پیشنهادات هوشمند
                                </h3>
                                <ul className="space-y-2">
                                    {insights.suggestions && insights.suggestions.length > 0 ? insights.suggestions.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/>
                                            {s}
                                        </li>
                                    )) : <li className="text-sm text-slate-500">پیشنهادی موجود نیست.</li>}
                                </ul>
                            </Card>
                        </div>
                    </div>
                )}

                {/* --- MARKETING TAB --- */}
                {activeTab === 'marketing' && (
                    <div className="space-y-6 animate-slideUp">
                        <Card>
                            <h3 className="font-bold dark:text-white mb-3">استراتژی کلی بازاریابی</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-7 text-justify">
                                {marketing.overview || 'اطلاعاتی موجود نیست.'}
                            </p>
                        </Card>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {marketing.campaigns && marketing.campaigns.length > 0 ? marketing.campaigns.map((camp, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-lg dark:text-white">{camp.name}</h4>
                                            <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full">{camp.channel}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{camp.strategy}</p>
                                        <div className="flex gap-4 text-sm font-medium">
                                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                <DollarSign size={14} className="text-emerald-500"/>
                                                بودجه: {formatMoney(camp.budget)}
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                <Target size={14} className="text-rose-500"/>
                                                ROI مورد انتظار: {camp.expectedRoi}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Mini visual for budget allocation could go here */}
                                    <div className="w-1.5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full hidden md:block"></div>
                                </div>
                            )) : <div className="text-center text-slate-500">کمپینی تعریف نشده است.</div>}
                        </div>
                    </div>
                )}

                {/* --- RISK TAB --- */}
                {activeTab === 'risk' && (
                    <div className="space-y-6 animate-slideUp">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {risks && risks.length > 0 ? risks.map((risk, i) => (
                                <Card key={i} className={`border-t-4 ${
                                    risk.probability === 'High' ? 'border-t-rose-500' : 
                                    risk.probability === 'Medium' ? 'border-t-amber-500' : 'border-t-blue-500'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold dark:text-white">{risk.title}</h4>
                                        <ShieldAlert size={20} className={
                                            risk.probability === 'High' ? 'text-rose-500' : 
                                            risk.probability === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                                        }/>
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">
                                            احتمال: {risk.probability}
                                        </span>
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">
                                            اثر: {risk.impact}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl leading-5">
                                        <span className="font-bold block mb-1">راهکار کاهش ریسک:</span>
                                        {risk.mitigation}
                                    </div>
                                </Card>
                            )) : <div className="col-span-full text-center text-slate-500">ریسکی شناسایی نشده است.</div>}
                        </div>
                    </div>
                )}

                {/* --- FINANCIAL TAB --- */}
                {activeTab === 'financial' && (
                    <div className="space-y-6 animate-slideUp">
                        <Card>
                             <h4 className="text-sm font-bold mb-6 dark:text-white flex items-center gap-2"><DollarSign size={18} className="text-emerald-500"/> نمودار رشد پیش‌بینی شده</h4>
                             <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={financial.projections || []}>
                                      <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false}/>
                                      <XAxis dataKey="year" tick={{fill: '#94a3b8'}}/>
                                      <YAxis tick={{fill: '#94a3b8'}}/>
                                      <ReTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}/>
                                      <Legend />
                                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRev)" name="درآمد" strokeWidth={3}/>
                                      <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProf)" name="سود خالص" strokeWidth={3}/>
                                   </AreaChart>
                                </ResponsiveContainer>
                             </div>
                             <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                 {financial.summary || 'تحلیل مالی موجود نیست.'}
                             </div>
                        </Card>
                    </div>
                )}

                 {/* --- STRATEGY TAB (Old Text) --- */}
                 {activeTab === 'strategy' && (
                    <div className="space-y-6 animate-slideUp">
                        <Card>
                            <h3 className="font-bold dark:text-white mb-4">خلاصه مدیریتی</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-8 text-justify whitespace-pre-wrap">{safePlan.executiveSummary || 'اطلاعاتی موجود نیست.'}</p>
                        </Card>
                        <Card>
                            <h3 className="font-bold dark:text-white mb-4">تحلیل بازار</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-8 text-justify whitespace-pre-wrap">{safePlan.marketAnalysis || 'اطلاعاتی موجود نیست.'}</p>
                        </Card>
                        <Card>
                            <h3 className="font-bold dark:text-white mb-4">برنامه عملیاتی</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-8 text-justify whitespace-pre-wrap">{safePlan.operationalPlan || 'اطلاعاتی موجود نیست.'}</p>
                        </Card>
                    </div>
                )}

             </div>
          </div>
        ) : null}
     </div>
    );
};

export default BusinessPlanView;
