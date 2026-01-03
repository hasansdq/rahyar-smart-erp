import { SystemData, User, Project, Task, Transaction, Report, Contract, ChatLog, KnowledgeFile, AppSettings } from '../types';
import api from './api';

const initialData: SystemData = {
  users: [],
  projects: [],
  tasks: [],
  finance: [],
  reports: [],
  contracts: [],
  businessPlan: '',
  chatLogs: [],
  knowledgeBase: [],
  settings: {
    aiModel: 'gemini-3-flash-preview',
    systemPrompt: 'System',
    themeMode: 'dark'
  }
};

type Listener = () => void;

class DBService {
  private data: SystemData = initialData;
  private isInitialized = false;
  private listeners: Listener[] = [];

  constructor() {}

  subscribe(listener: Listener) {
      this.listeners.push(listener);
      return () => {
          this.listeners = this.listeners.filter(l => l !== listener);
      };
  }

  private notify() {
      this.listeners.forEach(l => l());
  }

  async init(): Promise<User | null> {
    try {
        // This request sends the HttpOnly cookie automatically
        const res = await api.get('/data');
        
        const { currentUser, ...systemData } = res.data;
        this.data = systemData;
        this.isInitialized = true;
        this.notify();
        
        return currentUser || null;
    } catch (e: any) {
        // If 401, it just means user is not logged in. Return null cleanly.
        if (e.isAuthError || (e.response && e.response.status === 401)) {
            this.isInitialized = false;
            return null;
        }
        
        // Log other errors but don't crash the app
        console.warn("Init failed:", e);
        this.isInitialized = false;
        return null;
    }
  }

  async login(username: string, password: string): Promise<{user?: User, error?: string}> {
    try {
        await api.post('/auth/login', { username, password });
        // After successful login (cookie set), fetch data
        const user = await this.init(); 
        if (user) {
            return { user };
        } else {
            return { error: 'خطا در بارگذاری اطلاعات.' };
        }
    } catch (e: any) {
        const msg = e.response?.data?.message || e.message || 'خطا در ورود';
        return { error: msg };
    }
  }

  async registerUser(user: User): Promise<{success: boolean, error?: string}> {
    try {
        await api.post('/auth/register', user);
        await this.init(); 
        return { success: true };
    } catch (e: any) {
        const msg = e.response?.data?.error || e.message || 'خطا در ثبت نام';
        return { success: false, error: msg };
    }
  }

  async logout() {
      try {
        await api.post('/auth/logout');
      } catch (e) {
          console.error("Logout failed", e);
      }
      this.isInitialized = false;
      this.data = initialData;
      this.notify();
  }

  // Getters & Setters
  getData(): SystemData { return this.data; }
  getUsers(): User[] { return this.data.users; }
  getProjects(): Project[] { return this.data.projects; }
  getTasks(): Task[] { return this.data.tasks; }
  getFinance(): Transaction[] { return this.data.finance; }
  getContracts(): Contract[] { return this.data.contracts; }
  getBusinessPlan(): string { return this.data.businessPlan; }
  getReports(): Report[] { return this.data.reports; }
  getChatLogs(): ChatLog[] { return this.data.chatLogs; }
  getKnowledgeBase(): KnowledgeFile[] { return this.data.knowledgeBase; }
  getSettings(): AppSettings { return this.data.settings; }

  async addUser(user: User) { await api.post('/users', user); this.data.users.push(user); this.notify(); }
  async updateUser(user: User) { await api.put(`/users/${user.id}`, user); this.data.users = this.data.users.map(u => u.id === user.id ? user : u); this.notify(); }
  async deleteUser(userId: string) { await api.delete(`/users/${userId}`); this.data.users = this.data.users.filter(u => u.id !== userId); this.notify(); }
  
  async addProject(project: Project) { await api.post('/projects', project); this.data.projects.push(project); this.notify(); }
  async updateProject(project: Project) { await api.put(`/projects/${project.id}`, project); this.data.projects = this.data.projects.map(p => p.id === project.id ? project : p); this.notify(); }
  async deleteProject(projectId: string) { await api.delete(`/projects/${projectId}`); this.data.projects = this.data.projects.filter(p => p.id !== projectId); this.notify(); }

  async addTask(task: Task) { await api.post('/tasks', task); this.data.tasks.push(task); this.notify(); }
  async updateTask(task: Task) { await api.put(`/tasks/${task.id}`, task); this.data.tasks = this.data.tasks.map(t => t.id === task.id ? task : t); this.notify(); }

  async addTransaction(tx: Transaction) { await api.post('/transactions', tx); this.data.finance.push(tx); this.notify(); }
  async updateTransaction(tx: Transaction) { await api.put(`/transactions/${tx.id}`, tx); this.data.finance = this.data.finance.map(t => t.id === tx.id ? tx : t); this.notify(); }
  async deleteTransaction(id: string) { await api.delete(`/transactions/${id}`); this.data.finance = this.data.finance.filter(t => t.id !== id); this.notify(); }

  async addContract(contract: Contract) { this.data.contracts.push(contract); this.notify(); }
  async addReport(report: Report) { this.data.reports.push(report); this.notify(); }
  async setBusinessPlan(plan: string) { this.data.businessPlan = plan; this.notify(); }
  async addChatLog(log: ChatLog) { this.data.chatLogs.push(log); this.notify(); }

  async uploadKnowledgeFile(file: File) { 
     const formData = new FormData();
     formData.append('file', file);
     const res = await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
     this.data.knowledgeBase.push(res.data);
     this.notify();
     return res.data;
  }
  async updateKnowledgeFile(file: KnowledgeFile) { this.data.knowledgeBase = this.data.knowledgeBase.map(f => f.id === file.id ? file : f); this.notify(); }
  async deleteKnowledgeFile(fileId: string) { await api.delete(`/files/${fileId}`); this.data.knowledgeBase = this.data.knowledgeBase.filter(f => f.id !== fileId); this.notify(); }
  async updateSettings(settings: AppSettings) {
      if(this.data.settings.id) await api.put(`/settings/${this.data.settings.id}`, settings);
      else await api.post('/settings', settings);
      this.data.settings = settings;
      this.notify();
  }
}

export const db = new DBService();