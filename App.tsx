import React, { useState, useEffect } from 'react';
import { User } from './types';
import { db } from './services/db';
import { SidebarItem, RahyarLogo, SplashScreen } from './components/UI';
import { 
  LayoutDashboard, Users, Briefcase, FileText, Settings, 
  LogOut, Wallet, MessageSquare
} from 'lucide-react';

// Import Views
import LoginScreen from './views/LoginScreen';
import Dashboard from './views/Dashboard';
import ProjectsView from './views/ProjectsView';
import FinanceView from './views/FinanceView';
import TeamView from './views/TeamView';
import ChatView from './views/ChatView';
import BusinessPlanView from './views/BusinessPlanView';
import SettingsView from './views/SettingsView';

interface AppState {
  user: User | null;
  page: 'dashboard' | 'projects' | 'finance' | 'team' | 'chat' | 'settings' | 'business-plan';
  theme: 'light' | 'dark';
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<AppState['page']>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
     const settings = db.getSettings();
     if(settings.themeMode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(isDark ? 'dark' : 'light');
     } else {
        setTheme(settings.themeMode);
     }
  }, []);

  useEffect(() => {
     if (theme === 'dark') document.documentElement.classList.add('dark');
     else document.documentElement.classList.remove('dark');
  }, [theme]);

  if (showSplash) {
      return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans`}>
        {/* Sidebar */}
        <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-xl z-20">
             <div className="flex items-center gap-4 px-1 mb-10">
                 <RahyarLogo size="md" />
                 <div>
                     <h1 className="font-black text-lg tracking-tight dark:text-white leading-tight">سامانه هوشمند <br/><span className="text-indigo-600 dark:text-indigo-400">رهیــار</span></h1>
                 </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                 <div className="text-xs font-bold text-slate-400 mb-4 px-4 uppercase tracking-wider">منوی اصلی</div>
                 <SidebarItem icon={LayoutDashboard} label="داشبورد" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
                 <SidebarItem icon={Briefcase} label="پروژه‌ها" active={page === 'projects'} onClick={() => setPage('projects')} />
                 <SidebarItem icon={Wallet} label="مالی و حسابداری" active={page === 'finance'} onClick={() => setPage('finance')} />
                 <SidebarItem icon={Users} label="تیم و پرسنل" active={page === 'team'} onClick={() => setPage('team')} />
                 
                 <div className="text-xs font-bold text-slate-400 mt-8 mb-4 px-4 uppercase tracking-wider">هوش مصنوعی</div>
                 <SidebarItem icon={FileText} label="بیزینس پلن" active={page === 'business-plan'} onClick={() => setPage('business-plan')} badge="AI" />
                 <SidebarItem icon={MessageSquare} label="چت با مدیر" active={page === 'chat'} onClick={() => setPage('chat')} />

                 <div className="text-xs font-bold text-slate-400 mt-8 mb-4 px-4 uppercase tracking-wider">تنظیمات</div>
                 <SidebarItem icon={Settings} label="تنظیمات سیستم" active={page === 'settings'} onClick={() => setPage('settings')} />
             </div>

             <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                     <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shadow-inner">
                         {user.name.charAt(0)}
                     </div>
                     <div className="flex-1 overflow-hidden">
                         <div className="font-bold text-sm truncate dark:text-white">{user.name}</div>
                         <div className="text-xs text-slate-500 truncate">{user.role}</div>
                     </div>
                     <button onClick={() => setUser(null)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-red-500">
                         <LogOut size={18} />
                     </button>
                 </div>
             </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            <header className="h-20 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 border-b border-slate-100 dark:border-slate-800/50">
               {/* Header content like Search or Breadcrumbs can go here */}
               <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="opacity-50">سازمان</span> / <span className="dark:text-slate-200 font-bold">{page === 'dashboard' ? 'داشبورد مدیریتی' : page === 'projects' ? 'پروژه‌های عملیاتی' : page === 'finance' ? 'امور مالی و حسابداری' : page === 'team' ? 'منابع انسانی' : page === 'chat' ? 'دستیار هوشمند' : page === 'business-plan' ? 'بیزینس پلن استراتژیک' : 'تنظیمات سیستم'}</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                     <div className="relative flex h-2.5 w-2.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                     </div>
                     <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Gemini 3.0 Connected</span>
                  </div>
               </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
               {page === 'dashboard' && <Dashboard user={user} />}
               {page === 'projects' && <ProjectsView user={user} />}
               {page === 'finance' && <FinanceView user={user} />}
               {page === 'team' && <TeamView user={user} />}
               {page === 'chat' && <ChatView user={user} />}
               {page === 'business-plan' && <BusinessPlanView />}
               {page === 'settings' && <SettingsView user={user} setDarkMode={(d) => setTheme(d ? 'dark' : 'light')} />}
            </main>
        </div>
    </div>
  );
};

export default App;