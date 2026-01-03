
export enum UserRole {
  MANAGER = 'مدیر',
  ADMIN = 'ادمین',
  EMPLOYEE = 'کارمند'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  phoneNumber?: string;
  skills: string[];
  department: string; // e.g., Engineering, Marketing, HR
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  joinedDate?: string;
}

export enum ProjectStatus {
  PLANNING = 'برنامه‌ریزی',
  IN_PROGRESS = 'در حال اجرا',
  COMPLETED = 'تکمیل شده',
  DELAYED = 'با تاخیر'
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high';
  client: string;
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  progress: number; // 0 to 100
  managerId: string;
  teamIds: string[]; // List of User IDs assigned to this project
  risks: string[];
  tags: string[];
  aiAnalysis?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
  completedDate?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface Report {
  id: string;
  projectId: string; // Linked Project
  userId: string; // Author
  title: string;
  date: string;
  content: string;
  attachments: string[]; // URLs or File Names
  aiFeedback?: string;
  score?: number;
}

export interface Contract {
  id: string;
  title: string;
  partyName: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'draft';
  aiRiskAnalysis?: string;
}

export interface ChatLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  message: string;
  response: string;
  isVoice: boolean;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
}

export interface AppSettings {
  id?: number;
  aiModel: string;
  systemPrompt: string;
  themeMode: 'light' | 'dark' | 'system';
}

export interface SystemData {
  users: User[];
  projects: Project[];
  tasks: Task[];
  finance: Transaction[];
  reports: Report[];
  contracts: Contract[];
  businessPlan: string;
  chatLogs: ChatLog[];
  knowledgeBase: KnowledgeFile[];
  settings: AppSettings;
}
