import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { generateBusinessPlan } from '../services/ai';
import { Card } from '../components/UI';
import { FileBarChart, Sparkles, Target, PieChart as PieChartIcon, Zap, Activity, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';

const BusinessPlanView = () => {
    const [plan, setPlan] = useState<string>(db.getBusinessPlan());
    const [loading, setLoading] = useState(false);
    const [parsedPlan, setParsedPlan] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('executiveSummary');

    useEffect(() => {
        if(plan) {
            try {
                setParsedPlan(JSON.parse(plan));
            } catch (e) {
                setParsedPlan(null);
            }
        }
    }, [plan]);

    const handleGenerate = async () => {
        setLoading(true);
        const result = await generateBusinessPlan();
        db.setBusinessPlan(result);
        setPlan(result);
        setLoading(false);
    };

    const tabs = [
      { id: 'executiveSummary', label: 'خلاصه مدیریتی', icon: Target },
      { id: 'marketAnalysis', label: 'تحلیل بازار', icon: PieChartIcon },
      { id: 'marketingStrategy', label: 'استراتژی بازاریابی', icon: Zap },
      { id: 'operationalPlan', label: 'برنامه عملیاتی', icon: Activity },
      { id: 'financialProjections', label: 'پیش‌بینی مالی', icon: DollarSign },
   ];

   // Fake projection data for chart
   const projectionData = [
      { year: '1403', actual: 120, projected: 120 },
      { year: '1404', actual: null, projected: 180 },
      { year: '1405', actual: null, projected: 250 },
      { year: '1406', actual: null, projected: 350 },
   ];

    return (
        <div className="space-y-6 animate-fadeIn h-full flex flex-col">
        <div className="flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                 <FileBarChart className="text-purple-600"/> بیزینس پلن استراتژیک
              </h2>
              <p className="text-slate-500 text-sm mt-1">تدوین نقشه راه بر اساس داده‌های هوش مصنوعی</p>
           </div>
           <button 
             onClick={handleGenerate} 
             disabled={loading}
             className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
           >
             {loading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <Sparkles size={20}/>}
             {plan ? 'بروزرسانی هوشمند' : 'تولید خودکار'}
           </button>
        </div>

        {parsedPlan ? (
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
             {/* Sidebar Navigation */}
             <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {tabs.map(tab => (
                   <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                         activeTab === tab.id 
                         ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                         : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                   >
                      <tab.icon size={18}/> {tab.label}
                   </button>
                ))}
             </div>

             {/* Content Area */}
             <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                   <h3 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
                      {tabs.find(t => t.id === activeTab)?.icon && React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "text-purple-500" })}
                      {tabs.find(t => t.id === activeTab)?.label}
                   </h3>
                   
                   {/* Specific Chart for Financial Section */}
                   {activeTab === 'financialProjections' && (
                      <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                         <h4 className="text-sm font-bold mb-4 dark:text-white">نمودار رشد پیش‌بینی شده (میلیون تومان)</h4>
                         <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={projectionData}>
                                  <CartesianGrid strokeDasharray="3 3" opacity={0.1}/>
                                  <XAxis dataKey="year"/>
                                  <YAxis/>
                                  <ReTooltip contentStyle={{borderRadius: '10px'}}/>
                                  <Area type="monotone" dataKey="projected" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="پیش‌بینی" />
                                  <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="واقعی" />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                   )}

                   <div className="prose dark:prose-invert max-w-none leading-loose text-justify text-slate-600 dark:text-slate-300">
                      {parsedPlan[activeTab] ? parsedPlan[activeTab].split('\n').map((p: string, i: number) => <p key={i}>{p}</p>) : 'محتوایی موجود نیست.'}
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
             <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <FileBarChart size={32} className="text-purple-500"/>
             </div>
             <h3 className="text-xl font-bold dark:text-white mb-2">هنوز بیزینس پلنی ایجاد نشده است</h3>
             <p className="text-slate-500 max-w-md">هوش مصنوعی با تحلیل داده‌های مالی، پروژه‌ها و منابع انسانی شما، یک نقشه راه دقیق ترسیم می‌کند.</p>
          </div>
        )}
     </div>
    );
};

export default BusinessPlanView;
