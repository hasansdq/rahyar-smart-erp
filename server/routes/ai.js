
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { Settings, KnowledgeFile, Project, ChatLog, User, Report, Transaction, BusinessPlan } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const getSystemContext = async () => {
  try {
      const [settings, knowledge, projects, users, reports, finance, businessPlan] = await Promise.all([
          Settings.findOne(),
          KnowledgeFile.findAll(),
          Project.findAll(),
          User.findAll({ attributes: ['name', 'role', 'department', 'skills', 'status'] }),
          Report.findAll(),
          Transaction.findAll(),
          BusinessPlan.findOne({ order: [['updatedAt', 'DESC']] })
      ]);
      
      const knowledgeContext = knowledge.map(k => `--- FILE: ${k.name} ---\n${k.content}`).join('\n\n');
      
      const projectData = projects.map(p => ({
          title: p.title, status: p.status, progress: p.progress, manager: p.managerId, 
          priority: p.priority, budget: p.budget, team: p.teamIds
      }));

      const reportData = reports.map(r => ({
          project: r.projectId, author: r.userId, date: r.date, content: r.content
      }));

      const financeSummary = {
          income: finance.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
          expense: finance.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),
          transactions: finance.slice(-10) // Last 10 tx
      };

      return `
        SYSTEM PROMPT: ${settings?.systemPrompt || 'You are an intelligent ERP Assistant.'}
        
        === ORGANIZATIONAL DATA ===
        
        [TEAM MEMBERS]
        ${JSON.stringify(users)}

        [PROJECTS]
        ${JSON.stringify(projectData)}

        [REPORTS]
        ${JSON.stringify(reportData)}

        [FINANCIAL SUMMARY]
        ${JSON.stringify(financeSummary)}

        [BUSINESS PLAN]
        ${businessPlan ? businessPlan.content.substring(0, 2000) : 'Not Available'}

        === KNOWLEDGE BASE (RAG) ===
        ${knowledgeContext.substring(0, 50000)} // Safety truncate
      `;
  } catch (e) {
      console.error("Context Gen Error:", e);
      return "Error generating context.";
  }
};

router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt, model, mimeType, responseSchema } = req.body;
    const settings = await Settings.findOne();
    const systemInstruction = await getSystemContext();
    
    const config = {};
    if (mimeType) config.responseMimeType = mimeType;
    if (responseSchema) config.responseSchema = responseSchema;

    const response = await ai.models.generateContent({
      model: model || settings?.aiModel || 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemInstruction + "\n\nTASK:\n" + prompt }] }
      ],
      config
    });
    
    res.json({ text: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const settings = await Settings.findOne();
    const systemInstruction = await getSystemContext();

    const response = await ai.models.generateContent({
      model: settings?.aiModel || 'gemini-3-flash-preview',
      contents: [
         { role: 'user', parts: [{ text: systemInstruction }] },
         { role: 'user', parts: [{ text: message }] }
      ]
    });

    // Fire and forget log
    ChatLog.create({
        id: Math.random().toString(36),
        userId: req.user.id,
        userName: req.user.name, 
        userRole: req.user.role,
        timestamp: new Date().toISOString(),
        message: message,
        response: response.text,
        isVoice: false
    });

    res.json({ text: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export context getter for Socket
export { router as default, getSystemContext, ai };
