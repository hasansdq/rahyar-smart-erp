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
    themeMode: 'system'
  }
};

class DBService {
  private data: SystemData = initialData;
  private isInitialized = false;

  constructor() {}

  async init() {
    if (this.isInitialized) return;
    try {
        const token = localStorage.getItem('auth_token');
        if(!token) return;
        
        const res = await api.get('/data');
        this.data = res.data;
        this.isInitialized = true;
    } catch (e) {
        console.error("Failed to fetch initial data", e);
    }
  }

  // Auth Methods
  async login(username: string, password: string): Promise<{user?: User, error?: string}> {
    try {
        const res = await api.post('/auth/login', { username, password });
        localStorage.setItem('auth_token', res.data.token);
        this.init(); // fetch data after login
        return { user: res.data.user };
    } catch (e: any) {
        const msg = e.response?.data?.message || e.message || 'خطا در ورود';
        return { error: msg };
    }
  }

  async registerUser(user: User): Promise<{success: boolean, error?: string}> {
    try {
        const res = await api.post('/auth/register', user);
        localStorage.setItem('auth_token', res.data.token);
        return { success: true };
    } catch (e: any) {
        const msg = e.response?.data?.error || e.message || 'خطا در ثبت نام';
        return { success: false, error: msg };
    }
  }

  logout() {
      localStorage.removeItem('auth_token');
      this.isInitialized = false;
      this.data = initialData;
  }

  // Getters (Sync getters relying on cached data from init())
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

  // Actions (Async updates to server)
  async addUser(user: User) { 
      await api.post('/users', user); 
      this.data.users.push(user); 
  }
  async updateUser(user: User) {
      await api.put(`/users/${user.id}`, user);
      this.data.users = this.data.users.map(u => u.id === user.id ? user : u);
  }
  async deleteUser(userId: string) {
      await api.delete(`/users/${userId}`);
      this.data.users = this.data.users.filter(u => u.id !== userId);
  }
  
  async addProject(project: Project) {
      await api.post('/projects', project);
      this.data.projects.push(project);
  }
  async updateProject(project: Project) { 
      await api.put(`/projects/${project.id}`, project);
      this.data.projects = this.data.projects.map(p => p.id === project.id ? project : p);
  }
  async deleteProject(projectId: string) {
      await api.delete(`/projects/${projectId}`);
      this.data.projects = this.data.projects.filter(p => p.id !== projectId);
  }

  async addTask(task: Task) { 
      await api.post('/tasks', task);
      this.data.tasks.push(task);
  }
  async updateTask(task: Task) {
      await api.put(`/tasks/${task.id}`, task);
      this.data.tasks = this.data.tasks.map(t => t.id === task.id ? task : t);
  }

  async addTransaction(tx: Transaction) { 
      await api.post('/transactions', tx);
      this.data.finance.push(tx);
  }
  async updateTransaction(tx: Transaction) {
      await api.put(`/transactions/${tx.id}`, tx);
      this.data.finance = this.data.finance.map(t => t.id === tx.id ? tx : t);
  }
  async deleteTransaction(id: string) {
      await api.delete(`/transactions/${id}`);
      this.data.finance = this.data.finance.filter(t => t.id !== id);
  }

  async addContract(contract: Contract) { this.data.contracts.push(contract); } // Implement API if needed
  async addReport(report: Report) { this.data.reports.push(report); }
  async setBusinessPlan(plan: string) { this.data.businessPlan = plan; }
  async addChatLog(log: ChatLog) { this.data.chatLogs.push(log); }

  async addKnowledgeFile(file: KnowledgeFile) { 
     this.data.knowledgeBase.push(file); 
     // In real app, upload file via API
  }
  async updateKnowledgeFile(file: KnowledgeFile) {
     this.data.knowledgeBase = this.data.knowledgeBase.map(f => f.id === file.id ? file : f);
  }
  async deleteKnowledgeFile(fileId: string) {
    this.data.knowledgeBase = this.data.knowledgeBase.filter(f => f.id !== fileId);
  }

  async updateSettings(settings: AppSettings) {
      if(this.data.settings.id) {
          await api.put(`/settings/${this.data.settings.id || 1}`, settings);
      } else {
          await api.post('/settings', settings);
      }
      this.data.settings = settings;
  }
}

export const db = new DBService();