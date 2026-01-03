import React, { useState } from 'react';
import { User, KnowledgeFile } from '../types';
import { db } from '../services/db';
import { Card, Modal } from '../components/UI';
import { Settings, Sun, Moon, UploadCloud, File, Trash2, Edit2 } from 'lucide-react';

const SettingsView = ({ user, setDarkMode }: { user: User, setDarkMode: (v: boolean) => void }) => {
   const [settings, setSettings] = useState(db.getSettings());
   const [activeTab, setActiveTab] = useState<'general' | 'knowledge'>('general');
   const [knowledgeFiles, setKnowledgeFiles] = useState(db.getKnowledgeBase());
   
   // File Edit State
   const [showFileModal, setShowFileModal] = useState(false);
   const [editingFile, setEditingFile] = useState<KnowledgeFile | null>(null);
   const [fileName, setFileName] = useState('');

   const save = () => {
      db.updateSettings(settings);
      setDarkMode(settings.themeMode === 'dark');
      alert('تنظیمات ذخیره شد');
   };

   // Simulated Upload
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         const newFile: KnowledgeFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
            uploadDate: new Date().toLocaleDateString('fa-IR')
         };
         db.addKnowledgeFile(newFile);
         setKnowledgeFiles(db.getKnowledgeBase());
      }
   };

   const handleDeleteFile = (id: string) => {
      if(confirm('حذف فایل؟')) {
         db.deleteKnowledgeFile(id);
         setKnowledgeFiles(db.getKnowledgeBase());
      }
   };

   const handleEditFile = (file: KnowledgeFile) => {
      setEditingFile(file);
      setFileName(file.name);
      setShowFileModal(true);
   };

   const handleSaveFile = () => {
      if(editingFile && fileName) {
         db.updateKnowledgeFile({...editingFile, name: fileName});
         setKnowledgeFiles(db.getKnowledgeBase());
         setShowFileModal(false);
         setEditingFile(null);
      }
   };

   return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Settings className="text-slate-600 dark:text-slate-400"/> تنظیمات سیستم</h2>
         </div>

         {/* Tabs */}
         <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
            <button onClick={() => setActiveTab('general')} className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>تنظیمات عمومی</button>
            <button onClick={() => setActiveTab('knowledge')} className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'knowledge' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>پایگاه دانش (RAG)</button>
         </div>
         
         {activeTab === 'general' ? (
            <div className="space-y-6">
               <Card className="space-y-4">
                  <h3 className="font-bold border-b border-slate-100 dark:border-slate-700 pb-3 dark:text-white">پیکربندی هوش مصنوعی</h3>
                  <div>
                     <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">مدل هوش مصنوعی</label>
                     <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={settings.aiModel} onChange={e => setSettings({...settings, aiModel: e.target.value})}>
                        <option value="gemini-3-flash-preview">Gemini 3.0 Flash</option>
                        <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">دستورالعمل سیستم (System Prompt)</label>
                     <textarea 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        rows={4} 
                        value={settings.systemPrompt} 
                        onChange={e => setSettings({...settings, systemPrompt: e.target.value})}
                     />
                  </div>
               </Card>

               <Card className="space-y-4">
                  <h3 className="font-bold border-b border-slate-100 dark:border-slate-700 pb-3 dark:text-white">ظاهر و رابط کاربری</h3>
                  <div className="flex items-center gap-4">
                     <button onClick={() => setSettings({...settings, themeMode: 'light'})} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${settings.themeMode === 'light' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Sun size={20}/> روشن
                     </button>
                     <button onClick={() => setSettings({...settings, themeMode: 'dark'})} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${settings.themeMode === 'dark' ? 'border-blue-500 bg-slate-800 text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Moon size={20}/> تاریک
                     </button>
                  </div>
               </Card>

               <div className="flex justify-end">
                  <button onClick={save} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                     ذخیره تغییرات
                  </button>
               </div>
            </div>
         ) : (
            <div className="space-y-6">
               <Card>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
                     <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                     <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                        <UploadCloud size={32}/>
                     </div>
                     <h4 className="font-bold dark:text-white mb-1">بارگذاری فایل جدید</h4>
                     <p className="text-sm text-slate-500">فایل‌های PDF، Word یا Text را اینجا رها کنید</p>
                  </div>
               </Card>

               <div className="space-y-3">
                  {knowledgeFiles.map(file => (
                     <div key={file.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
                              <File size={20}/>
                           </div>
                           <div>
                              <div className="font-bold text-sm dark:text-white">{file.name}</div>
                              <div className="text-xs text-slate-400 flex gap-3 mt-1">
                                 <span>{file.size}</span>
                                 <span>{file.uploadDate}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEditFile(file)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                              <Edit2 size={18}/>
                           </button>
                           <button onClick={() => handleDeleteFile(file.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                              <Trash2 size={18}/>
                           </button>
                        </div>
                     </div>
                  ))}
                  {knowledgeFiles.length === 0 && (
                     <div className="text-center text-slate-400 py-8">هیچ فایلی آپلود نشده است.</div>
                  )}
               </div>
            </div>
         )}

         {/* File Edit Modal */}
         <Modal isOpen={showFileModal} onClose={() => setShowFileModal(false)} title="ویرایش فایل">
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">نام فایل</label>
                  <input 
                     className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                     value={fileName}
                     onChange={e => setFileName(e.target.value)}
                  />
               </div>
               <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowFileModal(false)} className="px-4 py-2 text-slate-500 text-sm">انصراف</button>
                  <button onClick={handleSaveFile} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20">ذخیره</button>
               </div>
            </div>
         </Modal>
      </div>
   );
};

export default SettingsView;
