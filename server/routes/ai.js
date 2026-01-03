import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { Settings, KnowledgeFile, Project, ChatLog } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const getSystemContext = async () => {
  const settings = await Settings.findOne();
  const knowledge = await KnowledgeFile.findAll();
  const projects = await Project.findAll();
  
  // Construct RAG Context
  const knowledgeContext = knowledge.map(k => `--- FILE: ${k.name} ---\n${k.content}`).join('\n\n');
  const projectContext = JSON.stringify(projects.map(p => ({ title: p.title, status: p.status, progress: p.progress })));
  
  return `
    ${settings?.systemPrompt || 'You are a helpful AI assistant.'}
    
    ORGANIZATIONAL DATA:
    Projects: ${projectContext}
    
    KNOWLEDGE BASE (RAG):
    ${knowledgeContext}
  `;
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

    await ChatLog.create({
        id: Math.random().toString(36),
        userId: req.user.id,
        userName: 'User', // In real app, fetch from User table
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