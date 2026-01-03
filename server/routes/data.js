
import express from 'express';
import { User, Project, Task, Transaction, Report, Contract, ChatLog, KnowledgeFile, Settings, BusinessPlan } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

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

    // Users
    const users = await User.findAll({ attributes: { exclude: ['password'] } }); 

    // Projects Filtering
    let projects;
    if (isManager || isAdmin) {
        projects = await Project.findAll();
    } else {
        // Employees see projects where their ID is in teamIds (JSON array)
        const allProjects = await Project.findAll();
        projects = allProjects.filter(p => {
             const teams = p.teamIds || [];
             return teams.includes(userId);
        });
    }

    // Tasks Filtering Logic
    let tasks;
    if (isManager || isAdmin) {
        tasks = await Task.findAll();
    } else {
        tasks = await Task.findAll({ where: { assigneeId: userId } });
    }

    const chatLogs = await ChatLog.findAll();
    const knowledgeBase = await KnowledgeFile.findAll({ attributes: ['id', 'name', 'size', 'uploadDate'] });
    
    // Settings logic
    let settings = await Settings.findOne();
    if(!settings) {
        settings = await Settings.create({
            aiModel: 'gemini-3-flash-preview',
            systemPrompt: 'شما یک دستیار هوشمند سازمانی هستید.',
            themeMode: 'dark'
        });
    }

    // Reports Logic
    let reports;
    if(isManager || isAdmin) {
        reports = await Report.findAll();
    } else {
        // Employees see their own reports
        reports = await Report.findAll({ where: { userId: userId } });
    }

    // Sensitive Data Filtering
    const finance = (isManager || isAdmin) ? await Transaction.findAll() : [];
    const contracts = (isManager || isAdmin) ? await Contract.findAll() : [];
    
    // Business Plan
    let businessPlanContent = "";
    if (isManager || isAdmin) {
        const bp = await BusinessPlan.findOne({ order: [['updatedAt', 'DESC']] });
        businessPlanContent = bp ? bp.content : "";
    }

    res.json({
      currentUser,
      users, projects, tasks, finance, reports, contracts, chatLogs, knowledgeBase, settings,
      businessPlan: businessPlanContent
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Specific Route for Reports (Employees can add)
router.post('/reports', authenticateToken, async (req, res) => {
    try {
        const report = await Report.create(req.body);
        res.json(report);
    } catch(e) { res.status(500).json({error: e.message}); }
});

// Specific Route for Task Status/Report Update (for Employees)
router.patch('/tasks/:id/submit', authenticateToken, async (req, res) => {
    try {
        const { status, report, completedDate } = req.body;
        const task = await Task.findByPk(req.params.id);
        
        // Check ownership if employee
        if (req.user.role === 'کارمند' && task.assigneeId !== req.user.id) {
            return res.status(403).json({ error: 'Access Denied' });
        }

        await task.update({ status, report, completedDate });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Specific Route for Business Plan
router.post('/business-plan', authenticateToken, async (req, res) => {
    if(req.user.role !== 'مدیر') return res.status(403).json({error: 'Access Denied'});
    try {
        const { content } = req.body;
        await BusinessPlan.create({ content, updatedAt: new Date() });
        res.json({ success: true });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// Apply CRUD routes
createCrudRoutes(User, 'users', ['مدیر', 'ادمین']); 
createCrudRoutes(Project, 'projects', ['مدیر', 'ادمین']); 
createCrudRoutes(Task, 'tasks', ['مدیر', 'ادمین']); // Only Managers/Admins can full Create/Update/Delete
createCrudRoutes(Transaction, 'transactions', ['مدیر', 'ادمین']); 
createCrudRoutes(Settings, 'settings', ['مدیر', 'ادمین']);

export default router;
