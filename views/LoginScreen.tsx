import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/db';
import { RahyarLogo } from '../components/UI';
import { User as UserIcon, Phone, Key, Eye, EyeOff, Lock, LogIn, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (u: User) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Registration Fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
  
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (isLogin) {
          if (!username || !password) throw new Error('لطفا نام کاربری و رمز عبور را وارد کنید.');
          
          const user = await db.login(username, password);
          if (user) {
            onLogin(user);
          } else {
            setError('نام کاربری یا رمز عبور اشتباه است.');
          }
        } else {
          if (!username || !password || !confirmPassword) throw new Error('لطفا تمام فیلدها را پر کنید.');
          if (password !== confirmPassword) throw new Error('رمز عبور و تکرار آن مطابقت ندارند.');

          const newUser: User = {
            id: '', // Server assigns ID
            name: username,
            role: role,
            email: `${username}@rahyar.ir`, 
            password: password,
            phoneNumber: phoneNumber,
            skills: [],
            department: 'عمومی',
            status: 'active',
            joinedDate: new Date().toLocaleDateString('fa-IR')
          };

          const success = await db.registerUser(newUser);
          if (success) {
             const user = await db.login(username, password);
             if(user) onLogin(user);
          } else {
            setError('خطا در ثبت نام.');
          }
        }
    } catch (err: any) {
        setError(err.message || 'خطای سرور');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Dynamic Background with Blobs */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[128px] animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[128px] animate-pulse-slow"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-noise.png')] opacity-10"></div>
      </div>

      <div className="w-full max-w-md relative z-10 perspective-1000">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/20 dark:border-slate-700 shadow-2xl rounded-3xl overflow-hidden animate-slideUp">
            
            {/* Header */}
            <div className="p-8 pb-0 flex flex-col items-center">
                <div className="animate-float">
                    <RahyarLogo size="lg" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-6 mb-2 tracking-tight">سامانه هوشمند رهیار</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {isLogin ? 'ورود به پنل مدیریت یکپارچه' : 'ایجاد حساب کاربری جدید'}
                </p>
            </div>

            <div className="p-8">
               {error && (
                 <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-sm rounded-2xl flex items-center gap-3 animate-shake">
                    <AlertCircle size={20}/> {error}
                 </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">نام کاربری</label>
                     <div className="relative group">
                        <UserIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                        <input 
                          type="text" 
                          className="w-full pr-12 pl-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white text-sm"
                          placeholder="نام کاربری"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                        />
                     </div>
                  </div>

                  {/* Extra Signup Fields */}
                  {!isLogin && (
                    <div className="space-y-5 animate-slideDown">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">شماره تلفن</label>
                          <div className="relative group">
                              <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                              <input 
                                type="tel" 
                                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white text-sm"
                                placeholder="0912..."
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                              />
                          </div>
                       </div>
                       
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">نقش سازمانی</label>
                          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                             {[UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN].map((r) => (
                                <button
                                   key={r}
                                   type="button"
                                   onClick={() => setRole(r)}
                                   className={`py-2.5 text-xs font-bold rounded-xl transition-all ${role === r ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                   {r}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Password Field */}
                  <div className="space-y-1.5">
                     <div className="flex justify-between">
                         <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">رمز عبور</label>
                         {isLogin && <button type="button" className="text-xs text-indigo-500 hover:text-indigo-400">فراموشی رمز؟</button>}
                     </div>
                     <div className="relative group">
                        <Key size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                        <input 
                          type={showPass ? "text" : "password"} 
                          className="w-full pr-12 pl-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white text-sm"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                           {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                     </div>
                  </div>

                  {/* Confirm Password (Signup only) */}
                  {!isLogin && (
                     <div className="space-y-1.5 animate-slideDown">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">تکرار رمز عبور</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                            <input 
                              type="password" 
                              className="w-full pr-12 pl-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all dark:text-white text-sm"
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                     </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {loading ? (
                         <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     ) : (
                         <>
                             {isLogin ? <LogIn size={20}/> : <UserPlus size={20}/>}
                             {isLogin ? 'ورود به سیستم' : 'ثبت نام رایگان'}
                         </>
                     )}
                  </button>
               </form>

               <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-700/50 pt-6">
                  <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors flex items-center justify-center gap-1 mx-auto group"
                  >
                     {isLogin ? 'حساب کاربری ندارید؟' : 'قبلاً ثبت نام کرده‌اید؟'}
                     <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">{isLogin ? 'ثبت نام کنید' : 'وارد شوید'}</span>
                     <ArrowRight size={16} className="group-hover:-translate-x-1 transition-transform"/>
                  </button>
               </div>
            </div>
          </div>
          
          <div className="text-center mt-6 text-slate-500 text-xs font-medium">
             © 1403 سامانه هوشمند رهیار. تمامی حقوق محفوظ است.
          </div>
      </div>
    </div>
  );
};

export default LoginScreen;