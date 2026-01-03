import express from 'express';
import { User, Project, Task, Transaction, Report, Contract, ChatLog, KnowledgeFile, Settings } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper for generic CRUD
const createCrudRoutes = (model, pathName, allowedRoles = []) => {
    // Middleware to check role for write operations
    const checkRole = (req, res, next) => {
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access Denied' });
        }
        next();
    };

    router.post(`/${pathName}`, authenticateToken, checkRole, async (req, res) => {
        try {
            const item = await model.create(req.body);
            res.json(item);
        } catch(e) { res.status(500).json({error: e.message}); }
    });
    router.put(`/${pathName}/:id`, authenticateToken, checkRole, async (req, res) => {
        try {
            await model.update(req.body, { where: { id: req.params.id } });
            res.json({ success: true });
        } catch(e) { res.status(500).json({error: e.message}); }
    });
    router.delete(`/${pathName}/:id`, authenticateToken, checkRole, async (req, res) => {
        try {
            await model.destroy({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch(e) { res.status(500).json({error: e.message}); }
    });
};

// Initial Data Load - Secured based on Role
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    const isManager = role === 'مدیر';
    const isAdmin = role === 'ادمین';
    const isEmployee = role === 'کارمند';

    // Fetch Current User Details to persist session on frontend
    const currentUser = await User.findByPk(userId, { attributes: { exclude: ['password'] } });

    // Everyone sees these
    const users = await User.findAll({ attributes: { exclude: ['password'] } }); // Hide hashes
    const projects = await Project.findAll();
    const tasks = await Task.findAll();
    const chatLogs = await ChatLog.findAll();
    const knowledgeBase = await KnowledgeFile.findAll({ attributes: ['id', 'name', 'size', 'uploadDate'] });
    
    // Settings logic
    let settings = await Settings.findOne();
    if(!settings) {
        settings = await Settings.create({
            aiModel: 'gemini-3-flash-preview',
            systemPrompt: 'شما یک دستیار هوشمند سازمانی هستید.',
            themeMode: 'system'
        });
    }

    // Sensitive Data Filtering
    const finance = (isManager || isAdmin) ? await Transaction.findAll() : [];
    const contracts = (isManager || isAdmin) ? await Contract.findAll() : [];
    const reports = await Report.findAll(); 
    
    // Business Plan is highly confidential
    const businessPlan = isManager ? "{}" : null; 

    res.json({
      currentUser, // IMPORTANT: Send back the logged-in user info
      users, projects, tasks, finance, reports, contracts, chatLogs, knowledgeBase, settings,
      businessPlan: businessPlan || ""
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Apply CRUD routes with role protections
createCrudRoutes(User, 'users', ['مدیر', 'ادمین']); 
createCrudRoutes(Project, 'projects'); 
createCrudRoutes(Task, 'tasks');
createCrudRoutes(Transaction, 'transactions', ['مدیر', 'ادمین']); 
createCrudRoutes(Settings, 'settings', ['مدیر', 'ادمین']);

export default router;