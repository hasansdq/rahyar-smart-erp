import express from 'express';
import { User, Project, Task, Transaction, Report, Contract, ChatLog, KnowledgeFile, Settings } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initial Data Load
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll();
    const projects = await Project.findAll();
    const tasks = await Task.findAll();
    const finance = await Transaction.findAll();
    const reports = await Report.findAll();
    const contracts = await Contract.findAll();
    const chatLogs = await ChatLog.findAll();
    const knowledgeBase = await KnowledgeFile.findAll({ attributes: ['id', 'name', 'size', 'uploadDate'] }); // Exclude heavy content
    let settings = await Settings.findOne();
    
    if(!settings) {
        settings = await Settings.create({
            aiModel: 'gemini-3-flash-preview',
            systemPrompt: 'شما یک دستیار هوشمند سازمانی هستید.',
            themeMode: 'system'
        });
    }

    res.json({
      users, projects, tasks, finance, reports, contracts, chatLogs, knowledgeBase, settings,
      businessPlan: "{}"
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Generic CRUD Helper
const createCrudRoutes = (model, pathName) => {
    router.post(`/${pathName}`, authenticateToken, async (req, res) => {
        try {
            const item = await model.create(req.body);
            res.json(item);
        } catch(e) { res.status(500).json({error: e.message}); }
    });
    router.put(`/${pathName}/:id`, authenticateToken, async (req, res) => {
        try {
            await model.update(req.body, { where: { id: req.params.id } });
            res.json({ success: true });
        } catch(e) { res.status(500).json({error: e.message}); }
    });
    router.delete(`/${pathName}/:id`, authenticateToken, async (req, res) => {
        try {
            await model.destroy({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch(e) { res.status(500).json({error: e.message}); }
    });
};

createCrudRoutes(User, 'users');
createCrudRoutes(Project, 'projects');
createCrudRoutes(Task, 'tasks');
createCrudRoutes(Transaction, 'transactions');
createCrudRoutes(Settings, 'settings');

export default router;