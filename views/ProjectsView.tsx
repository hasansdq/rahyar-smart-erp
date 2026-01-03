
import React, { useState, useEffect } from 'react';
import { User, Project, ProjectStatus, Report, UserRole } from '../types';
import { db } from '../services/db';
import { suggestProjectDetails } from '../services/ai';
import { Card, Modal } from '../components/UI';
import { formatMoney } from '../utils/helpers';
import { Plus, Edit2, Trash2, Sparkles, FileText, UserPlus, CheckCircle, Upload } from 'lucide-react';

const ProjectsView = ({ user }: { user: User }) => {
  const [projects, setProjects] = useState(db.getProjects());
  const [users, setUsers] = useState(db.getUsers());
  const [reports, setReports] = useState(db.getReports());
  
  // Project Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project>>({});
  const [aiTopic, setAiTopic] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeProjectForReport, setActiveProjectForReport] = useState<Project | null>(null);
  const [newReport, setNewReport] = useState<Partial<Report>>({});
  const [projectReports, setProjectReports] = useState<Report[]>([]);

  // Subscribe to real-time updates
  useEffect(() => {
     const unsubscribe = db.subscribe(() => {
         setProjects([...db.getProjects()]);
         setUsers([...db.getUsers()]);
         setReports([...db.getReports()]);
     });
     return unsubscribe;
  }, []);

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
    }
  }

  const toggleTeamMember = (uid: string) => {
      const current = editingProject.teamIds || [];
      if(current.includes(uid)) {
          setEditingProject({...editingProject, teamIds: current.filter(id => id !== uid)});
      } else {
          setEditingProject({...editingProject, teamIds: [...current, uid]});
      }
  };

  const openReportModal = (p: Project) => {
      setActiveProjectForReport(p);
      setProjectReports(reports.filter(r => r.projectId === p.id));
      setNewReport({
          date: new Date().toLocaleDateString('fa-IR'),
          title: `گزارش پیشرفت - ${new Date().toLocaleDateString('fa-IR')}`,
          attachments: []
      });
      setShowReportModal(true);
  };

  const submitReport = async () => {
      if(!newReport.content || !activeProjectForReport) return;
      
      const reportData: Report = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: activeProjectForReport.id,
          userId: user.id,
          title: newReport.title || 'گزارش',
          date: newReport.date || '',
          content: newReport.content,
          attachments: newReport.attachments || []
      };

      await db.addReport(reportData);
      setNewReport({});
      setShowReportModal(false);
  };

  const inputStyle = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold dark:text-white">پروژه‌ها</h2>
            <p className="text-slate-500">مدیریت و پیگیری پروژه‌های سازمانی</p>
         </div>
         {(user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) && (
            <button onClick={() => { setEditingProject({ status: ProjectStatus.PLANNING, teamIds: [] }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700">
                <Plus size={18} /> پروژه جدید
            </button>
         )}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
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
                     <button onClick={() => openReportModal(p)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg" title="گزارشات">
                        <FileText size={16}/>
                     </button>
                     {(user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) && (
                        <>
                            <button onClick={() => { setEditingProject(p); setShowModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16}/></button>
                        </>
                     )}
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
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 space-x-reverse">
                        {(p.teamIds || []).slice(0,4).map((uid, i) => {
                            const u = users.find(usr => usr.id === uid);
                            return (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600" title={u?.name}>
                                    {u ? u.name.charAt(0) : 'U'}
                                </div>
                            );
                        })}
                        {(p.teamIds || []).length > 4 && <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-500">+{p.teamIds.length - 4}</div>}
                        </div>
                        {user.role !== UserRole.EMPLOYEE && <span className="text-[10px] text-slate-400">تخصیص یافته</span>}
                    </div>
                    <div className="text-xs font-mono text-slate-500">{formatMoney(p.budget)}</div>
                 </div>
               </div>
            </div>
          ))}
       </div>

       {/* Edit/Create Modal */}
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

             {/* Team Allocation */}
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><UserPlus size={14}/> تخصیص تیم</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-2 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {users.map(u => (
                        <div key={u.id} onClick={() => toggleTeamMember(u.id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${editingProject.teamIds?.includes(u.id) ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${editingProject.teamIds?.includes(u.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'}`}>
                                {editingProject.teamIds?.includes(u.id) && <CheckCircle size={10}/>}
                            </div>
                            <span className="text-xs dark:text-slate-300">{u.name} <span className="text-slate-400">({u.role})</span></span>
                        </div>
                    ))}
                </div>
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

       {/* Reports Modal */}
       <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={`گزارشات: ${activeProjectForReport?.title}`} maxWidth="max-w-2xl">
            <div className="space-y-6">
                {/* Report Submission for Employee */}
                {(user.role === UserRole.EMPLOYEE || user.role === UserRole.MANAGER) && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-2"><Upload size={16}/> ارسال گزارش جدید</h4>
                        <div className="space-y-3">
                            <input className={inputStyle} placeholder="عنوان گزارش" value={newReport.title} onChange={e => setNewReport({...newReport, title: e.target.value})}/>
                            <textarea className={inputStyle} rows={3} placeholder="شرح فعالیت‌های انجام شده..." value={newReport.content} onChange={e => setNewReport({...newReport, content: e.target.value})} />
                            <div className="flex justify-end">
                                <button onClick={submitReport} disabled={!newReport.content} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">ارسال گزارش</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="font-bold text-sm mb-4 dark:text-slate-300">سوابق گزارشات</h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {projectReports.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm">هیچ گزارشی ثبت نشده است.</div>
                        ) : (
                            projectReports.map(r => (
                                <div key={r.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-sm dark:text-white">{r.title}</div>
                                        <div className="text-xs text-slate-400">{r.date}</div>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                                    <div className="mt-2 flex gap-2">
                                         {users.find(u => u.id === r.userId) && (
                                             <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400">
                                                 توسط: {users.find(u => u.id === r.userId)?.name}
                                             </span>
                                         )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
       </Modal>
    </div>
  );
};

export default ProjectsView;
