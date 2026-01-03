import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/db';
import { generateTeamMember } from '../services/ai';
import { Card, Modal } from '../components/UI';
import { Users, Sparkles, Plus, Edit2, Trash2, BriefcaseIcon, Mail, Clock, Award, ArrowDownRight, CheckCircle, Phone, UserPlus } from 'lucide-react';

const TeamView = ({ user }: { user: User }) => {
  const [users, setUsers] = useState(db.getUsers());
  const [activeTab, setActiveTab] = useState('All');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState<Partial<User>>({
    name: '', email: '', role: UserRole.EMPLOYEE, skills: [], department: '', status: 'active'
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
     return db.subscribe(() => setUsers([...db.getUsers()]));
  }, []);

  // Computed
  const departments = ['All', ...Array.from(new Set(users.map(u => u.department).filter(Boolean)))];
  const filteredUsers = activeTab === 'All' ? users : users.filter(u => u.department === activeTab);
  
  const canEdit = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  const handleSave = () => {
    if(!formData.name || !formData.email) return;

    if (formData.id) {
       db.updateUser(formData as User);
    } else {
       db.addUser({
         ...formData,
         id: Math.random().toString(36).substr(2, 9),
         joinedDate: new Date().toLocaleDateString('fa-IR')
       } as User);
    }
    setShowAddModal(false);
    setFormData({});
  };

  const handleEdit = (u: User) => {
    setFormData({...u});
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('آیا مطمئن هستید؟ حذف کاربر غیرقابل بازگشت است.')) {
      db.deleteUser(id);
    }
  };

  const handleAIGenerate = async () => {
    if(!aiPrompt) return;
    setIsGenerating(true);
    const result = await generateTeamMember(aiPrompt);
    if(result && result.name) {
      setFormData({
         name: result.name,
         role: result.role === 'مدیر' ? UserRole.MANAGER : result.role === 'ادمین' ? UserRole.ADMIN : result.role === 'ادمین' ? UserRole.ADMIN : UserRole.EMPLOYEE,
         email: result.email,
         skills: result.skills || [],
         department: result.department || 'عمومی',
         status: 'active'
      });
      setShowAIModal(false);
      setShowAddModal(true); // Open edit modal to review
    } else {
      alert("خطا در تولید اطلاعات.");
    }
    setIsGenerating(false);
  };

  const getRoleColor = (role: string) => {
     if(role === UserRole.MANAGER) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
     if(role === UserRole.ADMIN) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800';
     return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  };

  const getRandomGradient = (name: string) => {
     const gradients = [
       'from-blue-400 to-indigo-500',
       'from-emerald-400 to-teal-500', 
       'from-orange-400 to-pink-500',
       'from-purple-400 to-fuchsia-500',
       'from-cyan-400 to-blue-500'
     ];
     return gradients[name.length % gradients.length];
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 shadow-sm";
  const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold dark:text-white flex items-center">
             <Users className="me-3 text-blue-600"/>
             تیم و منابع انسانی
           </h2>
           <p className="text-slate-500 text-sm mt-1">مدیریت ساختار سازمانی و اعضای تیم‌ها</p>
        </div>
        
        {canEdit && (
          <div className="flex gap-2">
             <button 
               onClick={() => { setAiPrompt(''); setShowAIModal(true); }}
               className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg shadow-fuchsia-500/20 hover:scale-105 transition-transform"
             >
               <Sparkles size={18} className="me-2" />
               افزودن هوشمند
             </button>
             <button 
               onClick={() => { setFormData({role: UserRole.EMPLOYEE, status: 'active', skills: []}); setShowAddModal(true); }}
               className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl flex items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
             >
               <Plus size={18} className="me-2" />
               عضو جدید
             </button>
          </div>
        )}
      </div>

      {/* Tabs & Filter */}
      <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
        {departments.map(dept => (
           <button
             key={dept}
             onClick={() => setActiveTab(dept)}
             className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === dept 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
             }`}
           >
             {dept === 'All' ? 'همه تیم‌ها' : dept}
           </button>
        ))}
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredUsers.map(u => (
           <div key={u.id} className="group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              {/* Top Decor */}
              <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-r ${getRandomGradient(u.name)} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
              
              <div className="relative flex justify-between items-start">
                 <div className="relative">
                     <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRandomGradient(u.name)} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20`}>
                        {u.name.charAt(0)}
                     </div>
                     <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full ${u.status === 'active' ? 'bg-green-500' : u.status === 'on-leave' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                 </div>
                 {canEdit && (
                   <div className="flex gap-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"><Edit2 size={16}/></button>
                      {u.id !== user.id && (
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"><Trash2 size={16}/></button>
                      )}
                   </div>
                 )}
              </div>

              <div className="mt-4 relative">
                 <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-lg font-bold dark:text-white">{u.name}</h3>
                        <p className="text-xs text-slate-400">{u.role}</p>
                     </div>
                     <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRoleColor(u.role)}`}>{u.role}</span>
                 </div>

                 <div className="mt-4 space-y-2">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                       <BriefcaseIcon size={14} className="me-2 text-slate-400"/>
                       {u.department}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                       <Mail size={14} className="me-2 text-slate-400"/>
                       {u.email}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                       <Clock size={14} className="me-2 text-slate-400"/>
                       عضویت: {u.joinedDate || '1400/01/01'}
                    </div>
                 </div>

                 <div className="mt-4">
                    <div className="text-xs text-slate-400 mb-2 font-medium flex items-center justify-between">
                        <span>مهارت‌ها</span>
                        <span className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">{u.skills.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                       {u.skills.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700 flex items-center hover:border-blue-300 transition-colors">
                             <Award size={10} className="me-1 text-amber-500"/>
                             {skill}
                          </span>
                       ))}
                       {u.skills.length > 4 && (
                          <span className="px-2 py-1 rounded-md bg-slate-50 text-slate-400 text-[10px] border border-slate-200">+{u.skills.length - 4}</span>
                       )}
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={formData.id ? "ویرایش عضو" : "عضو جدید"} maxWidth="max-w-2xl">
         <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className={labelClass}>نام کامل</label>
                  <input className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="نام و نام خانوادگی"/>
               </div>
               <div>
                  <label className={labelClass}>ایمیل سازمانی</label>
                  <input className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="example@company.com" dir="ltr"/>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className={labelClass}>دپارتمان</label>
                  <input className={inputClass} placeholder="مثلا: تیم فنی" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
               </div>
               <div>
                  <label className={labelClass}>نقش کاربری</label>
                  <div className="relative">
                    <select className={`${inputClass} appearance-none cursor-pointer`} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                       <option value={UserRole.EMPLOYEE}>کارمند</option>
                       <option value={UserRole.MANAGER}>مدیر</option>
                       <option value={UserRole.ADMIN}>ادمین سیستم</option>
                    </select>
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <ArrowDownRight size={16}/>
                    </div>
                  </div>
               </div>
            </div>

            <div>
               <label className={labelClass}>مهارت‌ها (با کاما جدا کنید)</label>
               <input 
                 className={inputClass} 
                 placeholder="React, Marketing, Sales..."
                 value={formData.skills?.join(', ')} 
                 onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})} 
                 dir="ltr"
               />
            </div>
            
            <div className="flex flex-col gap-2">
                <label className={labelClass}>وضعیت حساب</label>
                <div className="flex gap-4">
                    {['active', 'inactive', 'on-leave'].map((status) => (
                        <label key={status} className={`flex-1 cursor-pointer rounded-xl border p-3 flex items-center justify-center gap-2 transition-all ${formData.status === status ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <input type="radio" name="status" value={status} checked={formData.status === status} onChange={() => setFormData({...formData, status: status as any})} className="hidden"/>
                            <span className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-500' : status === 'inactive' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                            <span className="text-sm font-medium dark:text-slate-300">
                                {status === 'active' ? 'فعال' : status === 'inactive' ? 'غیرفعال' : 'مرخصی'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-2">
               <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium">انصراف</button>
               <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all font-bold flex items-center gap-2">
                 <CheckCircle size={18}/>
                 {formData.id ? 'ذخیره تغییرات' : 'افزودن عضو'}
               </button>
            </div>
         </div>
      </Modal>

      {/* --- AI GENERATION MODAL --- */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="افزودن هوشمند عضو تیم">
         <div className="space-y-4">
            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 p-4 rounded-xl border border-violet-100 dark:border-violet-800">
               <div className="flex items-center gap-2 mb-2 text-violet-700 dark:text-violet-300 font-bold text-sm">
                  <Sparkles size={16}/>
                  توصیف کنید، ما می‌سازیم!
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-5">
                  توضیح دهید چه کسی را می‌خواهید استخدام کنید. مثلا: <br/>
                  "یک طراح ارشد رابط کاربری برای تیم محصول که با فیگما کار کرده باشد."
               </p>
               <textarea 
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  rows={3}
                  placeholder="توضیحات خود را اینجا بنویسید..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
               />
            </div>
            <button 
               onClick={handleAIGenerate}
               disabled={isGenerating || !aiPrompt}
               className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex justify-center items-center"
            >
               {isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : 'تولید اطلاعات با هوش مصنوعی'}
            </button>
         </div>
      </Modal>
    </div>
  );
};

export default TeamView;