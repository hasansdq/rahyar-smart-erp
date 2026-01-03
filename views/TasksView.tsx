
import React, { useState, useEffect } from 'react';
import { User, Task, UserRole } from '../types';
import { db } from '../services/db';
import { analyzeTasks } from '../services/ai';
import { Card, Modal } from '../components/UI';
import { useUI } from '../context/UIContext';
import { 
    CheckSquare, Clock, AlertCircle, Plus, Calendar, User as UserIcon, 
    FileText, UploadCloud, Send, BrainCircuit, Filter, CheckCircle2, ChevronDown, Paperclip, Sparkles
} from 'lucide-react';

const TasksView = ({ user }: { user: User }) => {
    const [tasks, setTasks] = useState(db.getTasks());
    const [users, setUsers] = useState(db.getUsers());
    const { showToast, confirm } = useUI();
    const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
    
    // Manager Actions
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task>>({});
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    // Employee Actions
    const [showReportModal, setShowReportModal] = useState(false);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [reportText, setReportText] = useState('');
    
    // File Upload State
    const [uploading, setUploading] = useState(false);

    const isManagerOrAdmin = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

    useEffect(() => {
        return db.subscribe(() => {
            setTasks([...db.getTasks()]);
            setUsers([...db.getUsers()]);
        });
    }, []);

    // --- MANAGER LOGIC ---
    const handleSaveTask = () => {
        if(!editingTask.title || !editingTask.assigneeId || !editingTask.deadline) {
            showToast('عنوان، مسئول انجام و ددلاین الزامی است.', 'error');
            return;
        }

        const taskData: Task = {
            id: editingTask.id || Math.random().toString(36).substr(2, 9),
            title: editingTask.title,
            description: editingTask.description || '',
            assigneeId: editingTask.assigneeId,
            status: editingTask.status || 'todo',
            priority: editingTask.priority || 'medium',
            deadline: editingTask.deadline,
            attachments: editingTask.attachments || [],
            report: editingTask.report || '',
            completedDate: editingTask.status === 'done' ? (editingTask.completedDate || new Date().toLocaleDateString('fa-IR')) : undefined
        };

        if(editingTask.id) {
            db.updateTask(taskData);
            showToast('وظایف بروزرسانی شد', 'success');
        } else {
            db.addTask(taskData);
            showToast('وظیفه جدید ایجاد شد', 'success');
        }
        setShowEditModal(false);
        setEditingTask({});
    };

    const handleDelete = (id: string) => {
        confirm('آیا از حذف این وظیفه اطمینان دارید؟', () => {
            db.deleteTask(id);
            showToast('وظیفه حذف شد', 'success');
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
           const file = e.target.files[0];
           setUploading(true);
           try {
               const res = await db.uploadKnowledgeFile(file); // Reusing generic upload for convenience
               setEditingTask(prev => ({
                   ...prev,
                   attachments: [...(prev.attachments || []), res.name]
               }));
               showToast('پیوست بارگذاری شد', 'success');
           } catch {
               showToast('خطا در بارگذاری فایل', 'error');
           } finally {
               setUploading(false);
           }
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        const result = await analyzeTasks();
        setAiAnalysis(result);
        setAnalyzing(false);
    };

    // --- EMPLOYEE LOGIC ---
    const openReportModal = (task: Task) => {
        setActiveTask(task);
        setReportText(task.report || '');
        setShowReportModal(true);
    };

    const submitReport = async () => {
        if(activeTask) {
            await db.updateTaskStatus(activeTask.id, 'done', reportText);
            showToast('گزارش ثبت و وظیفه تکمیل شد', 'success');
            setShowReportModal(false);
        }
    };

    // --- UI HELPERS ---
    const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);
    
    const getPriorityColor = (p: string) => {
        switch(p) {
            case 'high': return 'bg-rose-100 text-rose-600 border-rose-200';
            case 'medium': return 'bg-amber-100 text-amber-600 border-amber-200';
            default: return 'bg-blue-100 text-blue-600 border-blue-200';
        }
    };

    const inputStyle = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm";

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                        <CheckSquare className="text-indigo-500"/> مدیریت وظایف
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">پیگیری هوشمند عملکرد و وظایف سازمانی</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {['all', 'todo', 'done'].map((f: any) => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {f === 'all' ? 'همه' : f === 'todo' ? 'در انتظار' : 'انجام شده'}
                            </button>
                        ))}
                    </div>
                    {isManagerOrAdmin && (
                        <button onClick={() => { setEditingTask({priority: 'medium', status: 'todo'}); setShowEditModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 text-sm font-bold transition-all">
                            <Plus size={18} /> وظیفه جدید
                        </button>
                    )}
                </div>
            </div>

            {/* Kanban / Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTasks.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                        <CheckCircle2 size={48} className="mb-4 opacity-20"/>
                        <p>هیچ وظیفه‌ای با این فیلتر یافت نشد.</p>
                    </div>
                ) : (
                    filteredTasks.map(task => {
                        const assignee = users.find(u => u.id === task.assigneeId);
                        return (
                            <div key={task.id} className={`group relative bg-white dark:bg-slate-800 rounded-[1.5rem] p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${task.status === 'done' ? 'border-emerald-100 dark:border-emerald-900/30 opacity-75 hover:opacity-100' : 'border-slate-100 dark:border-slate-700'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${getPriorityColor(task.priority)}`}>
                                        {task.priority} Priority
                                    </span>
                                    {task.status === 'done' && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 size={12}/> انجام شده
                                        </span>
                                    )}
                                </div>
                                
                                <h3 className="font-bold text-lg dark:text-white mb-2 leading-tight">{task.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2.5em]">{task.description}</p>
                                
                                {task.attachments && task.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {task.attachments.map((f, i) => (
                                            <div key={i} className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                <Paperclip size={10}/> {f}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold border-2 border-white dark:border-slate-800">
                                            {assignee?.name.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold dark:text-slate-200">{assignee?.name}</span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10}/> {task.deadline}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {/* Employee Action */}
                                        {task.status !== 'done' && user.id === task.assigneeId && (
                                            <button onClick={() => openReportModal(task)} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all" title="ثبت گزارش و تکمیل">
                                                <CheckSquare size={18}/>
                                            </button>
                                        )}
                                        
                                        {/* Manager Actions */}
                                        {isManagerOrAdmin && (
                                            <button onClick={() => { setEditingTask(task); setShowEditModal(true); }} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors">
                                                <FileText size={18}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Report Preview for Managers */}
                                {isManagerOrAdmin && task.report && (
                                    <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><FileText size={10}/> گزارش کارمند</div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{task.report}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* AI Analysis Section (Manager Only) */}
            {isManagerOrAdmin && (
                <div className="mt-12">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                             <div className="flex items-center gap-3 mb-4">
                                 <div className="p-2 bg-indigo-500 rounded-xl"><BrainCircuit size={24}/></div>
                                 <h3 className="text-xl font-bold">تحلیل هوشمند عملکرد پرسنل</h3>
                             </div>
                             
                             {!aiAnalysis ? (
                                 <div className="flex flex-col items-start gap-4">
                                     <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                                         هوش مصنوعی می‌تواند با بررسی تمام وظایف، ددلاین‌ها و گزارش‌های ثبت شده، گلوگاه‌های کاری و عملکرد تیم را تحلیل کند.
                                     </p>
                                     <button onClick={handleAnalyze} disabled={analyzing} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">
                                         {analyzing ? <div className="animate-spin w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full"></div> : <Sparkles size={18}/>}
                                         {analyzing ? 'در حال تحلیل...' : 'شروع تحلیل وظایف'}
                                     </button>
                                 </div>
                             ) : (
                                 <div className="animate-fadeIn">
                                     <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-sm leading-8 text-justify">
                                         {aiAnalysis}
                                     </div>
                                     <button onClick={() => setAiAnalysis('')} className="mt-4 text-sm text-slate-400 hover:text-white underline decoration-dashed">تحلیل مجدد</button>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD/EDIT MODAL (Manager) --- */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={editingTask.id ? 'ویرایش وظیفه' : 'تعریف وظیفه جدید'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">عنوان وظیفه</label>
                        <input className={inputStyle} value={editingTask.title || ''} onChange={e => setEditingTask({...editingTask, title: e.target.value})} placeholder="مثلا: طراحی صفحه اول"/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">مسئول انجام</label>
                             <div className="relative">
                                 <select className={`${inputStyle} appearance-none`} value={editingTask.assigneeId || ''} onChange={e => setEditingTask({...editingTask, assigneeId: e.target.value})}>
                                     <option value="">انتخاب کنید...</option>
                                     {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                 </select>
                                 <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">اولویت</label>
                             <div className="relative">
                                 <select className={`${inputStyle} appearance-none`} value={editingTask.priority || 'medium'} onChange={e => setEditingTask({...editingTask, priority: e.target.value as any})}>
                                     <option value="low">پایین</option>
                                     <option value="medium">متوسط</option>
                                     <option value="high">بالا</option>
                                 </select>
                                 <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                             </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ددلاین (سررسید)</label>
                        <input className={inputStyle} value={editingTask.deadline || ''} onChange={e => setEditingTask({...editingTask, deadline: e.target.value})} placeholder="1403/05/20"/>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">توضیحات تکمیلی</label>
                        <textarea rows={4} className={inputStyle} value={editingTask.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})}/>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">پیوست‌ها (PDF)</label>
                        <div className={`border-2 border-dashed ${uploading ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 dark:border-slate-700'} rounded-xl p-4 text-center transition-colors relative`}>
                            <input type="file" accept=".pdf" disabled={uploading} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                {uploading ? <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div> : <UploadCloud size={24}/>}
                                <span className="text-xs">{uploading ? 'در حال آپلود...' : 'برای آپلود فایل کلیک کنید'}</span>
                            </div>
                        </div>
                        {editingTask.attachments && editingTask.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {editingTask.attachments.map((f, i) => (
                                    <div key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs flex items-center gap-2">
                                        <FileText size={12}/> {f}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                        {editingTask.id ? (
                            <button onClick={() => handleDelete(editingTask.id!)} className="text-red-500 text-sm hover:underline">حذف وظیفه</button>
                        ) : <div></div>}
                        <div className="flex gap-2">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-500 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">انصراف</button>
                            <button onClick={handleSaveTask} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20">ذخیره</button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* --- REPORT MODAL (Employee) --- */}
            <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="تکمیل وظیفه و ارسال گزارش">
                <div className="space-y-4">
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                         <h4 className="font-bold text-sm text-blue-700 dark:text-blue-300 mb-1">{activeTask?.title}</h4>
                         <p className="text-xs text-blue-600 dark:text-blue-400">لطفا شرح کارهای انجام شده را بنویسید.</p>
                     </div>
                     
                     <textarea 
                        className={inputStyle} 
                        rows={5} 
                        placeholder="گزارش کار..."
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                     />

                     <div className="flex justify-end gap-2 pt-2">
                         <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-slate-500 text-sm hover:bg-slate-100 rounded-lg">انصراف</button>
                         <button onClick={submitReport} disabled={!reportText} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2">
                             <Send size={16}/> ثبت و اتمام
                         </button>
                     </div>
                </div>
            </Modal>
        </div>
    );
};

export default TasksView;
