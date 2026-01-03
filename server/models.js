import { Sequelize, DataTypes } from 'sequelize';

// Database Connection
const sequelize = new Sequelize('safakaco_rahyar', 'safakaco_rahyar', 'Hasan78484@', {
  host: '195.201.186.148',
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 60000
  }
});

// Models
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING },
  phoneNumber: { type: DataTypes.STRING },
  skills: { type: DataTypes.JSON },
  department: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  joinedDate: { type: DataTypes.STRING }
});

const Project = sequelize.define('Project', {
  id: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING },
  priority: { type: DataTypes.STRING },
  client: { type: DataTypes.STRING },
  budget: { type: DataTypes.DOUBLE },
  spent: { type: DataTypes.DOUBLE },
  startDate: { type: DataTypes.STRING },
  deadline: { type: DataTypes.STRING },
  progress: { type: DataTypes.INTEGER },
  managerId: { type: DataTypes.STRING },
  teamIds: { type: DataTypes.JSON },
  risks: { type: DataTypes.JSON },
  tags: { type: DataTypes.JSON },
  aiAnalysis: { type: DataTypes.TEXT }
});

const Task = sequelize.define('Task', {
  id: { type: DataTypes.STRING, primaryKey: true },
  projectId: { type: DataTypes.STRING },
  title: { type: DataTypes.STRING },
  assigneeId: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  dueDate: { type: DataTypes.STRING },
  completedDate: { type: DataTypes.STRING }
});

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.STRING, primaryKey: true },
  type: { type: DataTypes.STRING },
  amount: { type: DataTypes.DOUBLE },
  category: { type: DataTypes.STRING },
  date: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING }
});

const Report = sequelize.define('Report', {
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING },
  date: { type: DataTypes.STRING },
  content: { type: DataTypes.TEXT },
  aiFeedback: { type: DataTypes.TEXT },
  score: { type: DataTypes.INTEGER }
});

const Contract = sequelize.define('Contract', {
  id: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING },
  partyName: { type: DataTypes.STRING },
  amount: { type: DataTypes.DOUBLE },
  startDate: { type: DataTypes.STRING },
  endDate: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING }
});

const ChatLog = sequelize.define('ChatLog', {
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING },
  userName: { type: DataTypes.STRING },
  userRole: { type: DataTypes.STRING },
  timestamp: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT },
  response: { type: DataTypes.TEXT },
  isVoice: { type: DataTypes.BOOLEAN }
});

const KnowledgeFile = sequelize.define('KnowledgeFile', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING },
  size: { type: DataTypes.STRING },
  uploadDate: { type: DataTypes.STRING }
});

const Settings = sequelize.define('Settings', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  aiModel: { type: DataTypes.STRING },
  systemPrompt: { type: DataTypes.TEXT },
  themeMode: { type: DataTypes.STRING }
});

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');
    await sequelize.sync({ alter: true }); // Automatically creates/updates tables
    console.log('Models synced...');
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
};

export { sequelize, User, Project, Task, Transaction, Report, Contract, ChatLog, KnowledgeFile, Settings, initDB };