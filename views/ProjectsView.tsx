import React, { useState } from 'react';
import { User, Project, ProjectStatus } from '../types';
import { db } from '../services/db';
import { suggestProjectDetails } from '../services/ai';
import { Card, Modal } from '../components/UI';
import { formatMoney } from '../utils/helpers';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';

const ProjectsView = ({ user }: { user: User }) => {
  const [projects, setProjects] = useState(db.getProjects());
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project>>({});
  const [aiTopic, setAiTopic] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const refresh = () => setProjects(db.getProjects());

  const handleSave = () => {
    if (!editingProject.title) return;
    const proj: Project = {
      id: editingProject.id || Math.random().toString(36).substr(2, 9),
      title: editingProject.title,
      description: editingProject.description || '',
      status: editingProject.status || ProjectStatus.PLANNING,
      priority: editingProject.priority || 'medium',
      client: editingProject.client || '',
      budget: Number(editingProject.budget) || 0,
      spent: Number(editingProject.spent) || 0,
      startDate: editingProject.startDate || '',
      deadline: editingProject.deadline || '',
      progress: Number(editingProject.progress) || 0,
      managerId: editingProject.managerId || user.id,
      teamIds: editingProject.teamIds || [],
      risks: editingProject.risks || [],
      tags: editingProject.tags || []
    };

    if (editingProject.id) db.updateProject(proj);
    else db.addProject(proj);
    
    setShowModal(false);
    setEditingProject({});
    refresh();
  };

  const handleAiSuggest = async () => {
    if (!aiTopic) return;
    setLoadingAi(true);
    const suggestion = await suggestProjectDetails(aiTopic);
    if (suggestion) {
      setEditingProject({
        ...editingProject,
        title: suggestion.title,
        description: suggestion.description,
        budget: suggestion.budget,
        risks: suggestion.risks,
        tags: suggestion.tags
      });
    }
    setLoadingAi(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('حذف پروژه؟')) {
       db.deleteProject(id);
       refresh();
    }
  }

  const inputStyle = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold dark:text-white">پروژه‌ها</h2>
            <p className="text-slate-500">مدیریت و پیگیری پروژه‌های سازمانی</p>
         </div>
         <button onClick={() => { setEditingProject({ status: ProjectStatus.PLANNING }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> پروژه جدید
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mb-2 inline-block
                      ${p.priority === 'high' ? 'bg-red-100 text-red-600' : p.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}
                    `}>
                      {p.priority === 'high' ? 'اولیت بالا' : p.priority === 'medium' ? 'اولویت متوسط' : 'اولویت پایین'}
                    </span>
                    <h3 className="font-bold text-lg dark:text-white">{p.title}</h3>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => { setEditingProject(p); setShowModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                     <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
               </div>
               
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{p.description}</p>
               
               <div className="space-y-3">
                 <div className="flex justify-between text-xs text-slate-500">
                    <span>پیشرفت</span>
                    <span>{p.progress}%</span>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                 </div>
                 
                 <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700 mt-4">
                    <div className="flex -space-x-2 space-x-reverse">
                       {p.teamIds.slice(0,3).map((uid, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">U</div>
                       ))}
                    </div>
                    <div className="text-xs font-mono text-slate-500">{formatMoney(p.budget)}</div>
                 </div>
               </div>
            </div>
          ))}
       </div>

       <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProject.id ? 'ویرایش پروژه' : 'پروژه جدید'}>
          <div className="space-y-4">
             {!editingProject.id && (
                <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-xl mb-4 border border-violet-100 dark:border-violet-800">
                   <label className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-2 block flex items-center gap-2"><Sparkles size={14}/> تولید خودکار با هوش مصنوعی</label>
                   <div className="flex gap-2">
                      <input className="flex-1 p-2 rounded-lg text-sm border-none outline-none dark:bg-slate-800 dark:text-white" placeholder="موضوع پروژه (مثلا: فروشگاه آنلاین)" value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                      <button onClick={handleAiSuggest} disabled={loadingAi} className="bg-violet-600 text-white px-3 rounded-lg text-sm">
                        {loadingAi ? '...' : 'تولید'}
                      </button>
                   </div>
                </div>
             )}
             
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">عنوان پروژه</label>
                <input className={inputStyle} value={editingProject.title || ''} onChange={e => setEditingProject({...editingProject, title: e.target.value})} />
             </div>
             
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">توضیحات</label>
                <textarea className={inputStyle} rows={3} value={editingProject.description || ''} onChange={e => setEditingProject({...editingProject, description: e.target.value})} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">بودجه</label>
                   <input type="number" className={inputStyle} value={editingProject.budget || ''} onChange={e => setEditingProject({...editingProject, budget: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت</label>
                   <select className={inputStyle} value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value as any})}>
                      {Object.values(ProjectStatus).map(s => <option key={s} value={s} className="bg-white dark:bg-slate-800">{s}</option>)}
                   </select>
                </div>
             </div>
             
             <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">پیشرفت: {editingProject.progress || 0}%</label>
                 <input type="range" className="w-full accent-blue-600" min="0" max="100" value={editingProject.progress || 0} onChange={e => setEditingProject({...editingProject, progress: Number(e.target.value)})} />
             </div>

             <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">انصراف</button>
                <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all">ذخیره</button>
             </div>
          </div>
       </Modal>
    </div>
  );
};

export default ProjectsView;
