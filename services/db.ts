import { SystemData, UserRole, ProjectStatus, User, Project, Task, Transaction, Report, Contract, ChatLog, KnowledgeFile, AppSettings } from '../types';

const DB_KEY = 'hoshmand_erp_db_v4';

const initialData: SystemData = {
  users: [
    { 
      id: 'u1', 
      name: 'رضا مدیر', 
      role: UserRole.MANAGER, 
      email: 'manager@co.ir', 
      password: '123',
      phoneNumber: '09120000001',
      skills: ['استراتژی', 'رهبری', 'مدیریت ریسک'], 
      department: 'مدیریت ارشد',
      status: 'active',
      joinedDate: '1400/01/01'
    },
    { 
      id: 'u2', 
      name: 'سارا ادمین', 
      role: UserRole.ADMIN, 
      email: 'admin@co.ir', 
      password: '123',
      phoneNumber: '09120000002',
      skills: ['منابع انسانی', 'حسابداری', 'Excel'], 
      department: 'مالی و اداری',
      status: 'active',
      joinedDate: '1400/05/15'
    },
    { 
      id: 'u3', 
      name: 'علی برنامه', 
      role: UserRole.EMPLOYEE, 
      email: 'ali@co.ir', 
      password: '123',
      phoneNumber: '09120000003',
      skills: ['React', 'Node.js', 'DevOps', 'TypeScript'], 
      department: 'تیم فنی',
      status: 'active',
      joinedDate: '1401/02/10'
    },
    { 
      id: 'u4', 
      name: 'مریم طراح', 
      role: UserRole.EMPLOYEE, 
      email: 'maryam@co.ir', 
      password: '123',
      phoneNumber: '09120000004',
      skills: ['UI/UX', 'Figma', 'Adobe XD', 'برندینگ'], 
      department: 'طراحی و محصول',
      status: 'on-leave',
      joinedDate: '1402/08/01'
    },
  ],
  projects: [
    {
      id: 'p1',
      title: 'توسعه پلتفرم فروش',
      description: 'ایجاد یک سیستم فروش آنلاین یکپارچه با انبار و سیستم حسابداری متصل.',
      status: ProjectStatus.IN_PROGRESS,
      priority: 'high',
      client: 'شرکت بازرگانی امید',
      budget: 500000000,
      spent: 120000000,
      startDate: '1403/06/01',
      deadline: '1403/12/29',
      progress: 35,
      managerId: 'u1',
      teamIds: ['u3', 'u4'],
      risks: ['کمبود نیروی بک‌اند', 'تورم سرورها'],
      tags: ['نرم‌افزار', 'وب']
    },
    {
      id: 'p2',
      title: 'کمپین تبلیغاتی نوروز',
      description: 'طراحی بیلبورد و تبلیغات کلیکی در پلتفرم‌های داخلی برای جشنواره بهاره.',
      status: ProjectStatus.PLANNING,
      priority: 'medium',
      client: 'داخلی',
      budget: 200000000,
      spent: 0,
      startDate: '1403/10/01',
      deadline: '1403/11/15',
      progress: 10,
      managerId: 'u2',
      teamIds: ['u4'],
      risks: [],
      tags: ['مارکتینگ', 'گرافیک']
    }
  ],
  tasks: [
    { id: 't1', projectId: 'p1', title: 'طراحی دیتابیس', assigneeId: 'u3', status: 'done', dueDate: '1403/08/01', completedDate: '1403/08/01' },
    { id: 't2', projectId: 'p1', title: 'طراحی صفحه اصلی', assigneeId: 'u4', status: 'in-progress', dueDate: '1403/09/10' },
  ],
  finance: [
    { id: 'f1', type: 'income', amount: 150000000, category: 'فروش سرویس', date: '1403/08/15', description: 'پیش‌پرداخت مشتری الف' },
    { id: 'f2', type: 'expense', amount: 45000000, category: 'حقوق', date: '1403/08/30', description: 'حقوق آبان ماه' },
    { id: 'f3', type: 'expense', amount: 12000000, category: 'زیرساخت', date: '1403/08/05', description: 'هزینه ابری AWS' },
    { id: 'f4', type: 'expense', amount: 5000000, category: 'ملزومات', date: '1403/09/01', description: 'خرید قهوه و تنقلات' },
    { id: 'f5', type: 'income', amount: 80000000, category: 'فروش سرویس', date: '1403/09/05', description: 'تمدید قرارداد شرکت ب' },
  ],
  reports: [],
  contracts: [
    { id: 'c1', title: 'قرارداد توسعه نرم‌افزار', partyName: 'شرکت فناور', amount: 800000000, startDate: '1403/01/01', endDate: '1403/12/29', status: 'active' }
  ],
  businessPlan: '',
  chatLogs: [],
  knowledgeBase: [
    { id: 'kb1', name: 'راهنمای پرسنلی.pdf', size: '2.4 MB', uploadDate: '1403/05/20' },
    { id: 'kb2', name: 'استراتژی فروش 1403.pdf', size: '1.1 MB', uploadDate: '1403/01/15' }
  ],
  settings: {
    aiModel: 'gemini-3-flash-preview',
    systemPrompt: 'شما یک دستیار هوشمند سازمانی هستید که با دقت بالا و لحن رسمی و در عین حال صمیمانه پاسخ می‌دهید.',
    themeMode: 'system'
  }
};

class DBService {
  private data: SystemData;

  constructor() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration logic if needed
      if (!parsed.knowledgeBase) parsed.knowledgeBase = [];
      
      // Ensure all users have a password if missing (legacy support)
      if (parsed.users) {
        parsed.users = parsed.users.map((u: User) => ({
          ...u,
          password: u.password || '123'
        }));
      }

      this.data = parsed;
    } else {
      this.data = initialData;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  // Auth Methods
  authenticate(username: string, password: string): User | null {
    const user = this.data.users.find(u => u.name === username && u.password === password);
    return user || null;
  }

  registerUser(user: User): boolean {
    if (this.data.users.some(u => u.name === user.name)) {
      return false; // User exists
    }
    this.data.users.push(user);
    this.save();
    return true;
  }

  // Getters
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

  // Setters / Actions
  addUser(user: User) { this.data.users.push(user); this.save(); }
  updateUser(user: User) {
    this.data.users = this.data.users.map(u => u.id === user.id ? user : u);
    this.save();
  }
  deleteUser(userId: string) {
    this.data.users = this.data.users.filter(u => u.id !== userId);
    this.save();
  }
  
  addProject(project: Project) { this.data.projects.push(project); this.save(); }
  updateProject(project: Project) { 
    this.data.projects = this.data.projects.map(p => p.id === project.id ? project : p);
    this.save();
  }
  deleteProject(projectId: string) {
    this.data.projects = this.data.projects.filter(p => p.id !== projectId);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== projectId);
    this.save();
  }

  addTask(task: Task) { this.data.tasks.push(task); this.save(); }
  updateTask(task: Task) {
    this.data.tasks = this.data.tasks.map(t => t.id === task.id ? task : t);
    this.save();
  }

  addTransaction(tx: Transaction) { this.data.finance.push(tx); this.save(); }
  updateTransaction(tx: Transaction) {
    this.data.finance = this.data.finance.map(t => t.id === tx.id ? tx : t);
    this.save();
  }
  deleteTransaction(id: string) {
    this.data.finance = this.data.finance.filter(t => t.id !== id);
    this.save();
  }

  addContract(contract: Contract) { this.data.contracts.push(contract); this.save(); }
  addReport(report: Report) { this.data.reports.push(report); this.save(); }
  setBusinessPlan(plan: string) { this.data.businessPlan = plan; this.save(); }
  addChatLog(log: ChatLog) { this.data.chatLogs.push(log); this.save(); }

  addKnowledgeFile(file: KnowledgeFile) { 
    if(!this.data.knowledgeBase) this.data.knowledgeBase = [];
    this.data.knowledgeBase.push(file); 
    this.save(); 
  }

  updateKnowledgeFile(file: KnowledgeFile) {
    if(!this.data.knowledgeBase) return;
    this.data.knowledgeBase = this.data.knowledgeBase.map(f => f.id === file.id ? file : f);
    this.save();
  }

  deleteKnowledgeFile(fileId: string) {
    if(!this.data.knowledgeBase) return;
    this.data.knowledgeBase = this.data.knowledgeBase.filter(f => f.id !== fileId);
    this.save();
  }

  updateSettings(settings: AppSettings) {
    this.data.settings = settings;
    this.save();
  }

  // Helpers
  getFinanceSummary(): string {
    const income = this.data.finance.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = this.data.finance.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return `Total Income: ${income}, Total Expense: ${expense}, Net: ${income - expense}`;
  }
}

export const db = new DBService();