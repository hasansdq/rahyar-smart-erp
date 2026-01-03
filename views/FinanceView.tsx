import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { db } from '../services/db';
import { consultFinance } from '../services/ai';
import { Card, Modal } from '../components/UI';
import { formatMoney } from '../utils/helpers';
import { Sparkles, Send, ArrowUpRight, ArrowDownRight, Plus, Edit2, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';

const FinanceView = ({ user }: { user: User }) => {
  const [transactions, setTransactions] = useState(db.getFinance());
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  // CRUD State
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Partial<Transaction>>({});

  const refreshData = () => setTransactions(db.getFinance());

  const handleSaveTx = () => {
     if(!editingTx.amount || !editingTx.category || !editingTx.date) return alert('لطفا اطلاعات را کامل کنید');
     
     const tx: Transaction = {
        id: editingTx.id || Math.random().toString(36).substr(2, 9),
        type: editingTx.type || 'expense',
        amount: Number(editingTx.amount),
        category: editingTx.category,
        date: editingTx.date,
        description: editingTx.description || ''
     };

     if (editingTx.id) {
        db.updateTransaction(tx);
     } else {
        db.addTransaction(tx);
     }
     
     setShowModal(false);
     setEditingTx({});
     refreshData();
  };

  const handleDeleteTx = (id: string) => {
     if(confirm('آیا مطمئن هستید؟')) {
        db.deleteTransaction(id);
        refreshData();
     }
  };

  const handleConsult = async () => {
    if(!query) return;
    setLoading(true);
    const res = await consultFinance(query);
    setAiResponse(res);
    setLoading(false);
  };

  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const data = [
    { name: 'درآمد', value: income, fill: '#10b981' },
    { name: 'هزینه', value: expense, fill: '#ef4444' },
  ];

  const inputStyle = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="md:col-span-2">
            <h3 className="font-bold dark:text-white mb-4">تحلیل درآمد و هزینه</h3>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                 <PieChart>
                    <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                    </Pie>
                    <ReTooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4 flex-1">
                 <div>
                    <div className="text-sm text-slate-500">مجموع درآمد</div>
                    <div className="text-xl font-bold text-emerald-500">{formatMoney(income)}</div>
                 </div>
                 <div>
                    <div className="text-sm text-slate-500">مجموع هزینه</div>
                    <div className="text-xl font-bold text-rose-500">{formatMoney(expense)}</div>
                 </div>
                 <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="text-sm text-slate-500">سود خالص</div>
                    <div className="text-2xl font-bold text-blue-600">{formatMoney(income - expense)}</div>
                 </div>
              </div>
            </div>
         </Card>
         <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold">
               <Sparkles size={20}/>
               <span>مشاور مالی هوشمند</span>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-3 text-sm mb-3 overflow-y-auto custom-scrollbar">
               {loading ? 'در حال تحلیل...' : aiResponse || 'سوال خود را بپرسید تا وضعیت مالی را تحلیل کنم.'}
            </div>
            <div className="flex gap-2">
               <input 
                 className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/20"
                 placeholder="سوال مالی..."
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleConsult()}
               />
               <button onClick={handleConsult} className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                  <Send size={16} />
               </button>
            </div>
         </Card>
      </div>

      <Card>
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold dark:text-white">تراکنش‌های اخیر</h3>
            <button onClick={() => { setEditingTx({type: 'expense', date: new Date().toLocaleDateString('fa-IR')}); setShowModal(true); }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-xs font-bold">
               <Plus size={16}/> تراکنش جدید
            </button>
         </div>
         <div className="space-y-2">
            {transactions.map(t => (
               <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                     </div>
                     <div>
                        <div className="font-bold text-sm dark:text-white">{t.category}</div>
                        <div className="text-xs text-slate-400">{t.description}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <div className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                        </div>
                        <div className="text-xs text-slate-400">{t.date}</div>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingTx(t); setShowModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeleteTx(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16}/></button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTx.id ? 'ویرایش تراکنش' : 'تراکنش جدید'}>
         <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
               <button onClick={() => setEditingTx({...editingTx, type: 'income'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${editingTx.type === 'income' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-500'}`}>درآمد</button>
               <button onClick={() => setEditingTx({...editingTx, type: 'expense'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${editingTx.type === 'expense' ? 'bg-white dark:bg-slate-700 shadow text-rose-600' : 'text-slate-500'}`}>هزینه</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">مبلغ</label>
                  <input type="number" className={inputStyle} value={editingTx.amount || ''} onChange={e => setEditingTx({...editingTx, amount: Number(e.target.value)})} placeholder="تومان"/>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تاریخ</label>
                  <input className={inputStyle} value={editingTx.date || ''} onChange={e => setEditingTx({...editingTx, date: e.target.value})} placeholder="1403/01/01"/>
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">دسته‌بندی</label>
               <input className={inputStyle} value={editingTx.category || ''} onChange={e => setEditingTx({...editingTx, category: e.target.value})} placeholder="مثلا: حقوق، فروش..."/>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">توضیحات</label>
               <textarea rows={3} className={inputStyle} value={editingTx.description || ''} onChange={e => setEditingTx({...editingTx, description: e.target.value})}/>
            </div>
            <div className="flex justify-end gap-2 pt-2">
               <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 text-sm">انصراف</button>
               <button onClick={handleSaveTx} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20">ذخیره</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default FinanceView;
