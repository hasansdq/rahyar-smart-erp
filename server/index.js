import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GoogleGenAI } from '@google/genai';
import { sequelize, User, Project, Task, Transaction, Report, Contract, ChatLog, Settings, KnowledgeFile, initDB } from './models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = 3001;
const API_KEY = process.env.API_KEY; 
const JWT_SECRET = 'rahyar-secret-key-change-in-prod';

// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { name: username } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // In a real app, use bcrypt.compare. For legacy support/demo, we allow plain check if not hashed yet
    const validPass = password === user.password || await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ ...req.body, password: hashedPassword });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Data Routes ---
app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll();
    const projects = await Project.findAll();
    const tasks = await Task.findAll();
    const finance = await Transaction.findAll();
    const reports = await Report.findAll();
    const contracts = await Contract.findAll();
    const chatLogs = await ChatLog.findAll(); // Usually filter by user
    const knowledgeBase = await KnowledgeFile.findAll();
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
      businessPlan: "{}" // Simplified for now
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Generic CRUD endpoints
const createCrud = (path, Model) => {
  app.post(path, authenticateToken, async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.json(item);
    } catch(e) { res.status(500).json({error: e.message}); }
  });
  app.put(`${path}/:id`, authenticateToken, async (req, res) => {
    try {
      await Model.update(req.body, { where: { id: req.params.id } });
      res.json({ success: true });
    } catch(e) { res.status(500).json({error: e.message}); }
  });
  app.delete(`${path}/:id`, authenticateToken, async (req, res) => {
    try {
      await Model.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch(e) { res.status(500).json({error: e.message}); }
  });
};

createCrud('/api/users', User);
createCrud('/api/projects', Project);
createCrud('/api/tasks', Task);
createCrud('/api/transactions', Transaction);
createCrud('/api/settings', Settings);

// --- AI Routes (Server-Side) ---

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getSystemContext = async () => {
  // Fetch fresh data for context
  const settings = await Settings.findOne();
  const knowledge = await KnowledgeFile.findAll();
  const projects = await Project.findAll();
  
  // Create a summarized context string
  const contextData = JSON.stringify({ projects: projects.map(p => p.title) });
  
  return `
    ${settings?.systemPrompt || ''}
    Context Data: ${contextData}
    Files: ${knowledge.map(k => k.name).join(', ')}
  `;
};

app.post('/api/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt, model, mimeType, responseSchema } = req.body;
    const settings = await Settings.findOne();
    const systemInstruction = await getSystemContext();
    
    const config = {};
    if (mimeType) config.responseMimeType = mimeType;
    if (responseSchema) config.responseSchema = responseSchema;

    const response = await ai.models.generateContent({
      model: model || settings.aiModel,
      contents: [
        { role: 'user', parts: [{ text: systemInstruction + "\n\n" + prompt }] }
      ],
      config
    });
    
    res.json({ text: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { message, history } = req.body;
    const settings = await Settings.findOne();
    const systemInstruction = await getSystemContext();

    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: [
         { role: 'user', parts: [{ text: systemInstruction }] },
         // ...history, // In a real app, map history
         { role: 'user', parts: [{ text: message }] }
      ]
    });

    // Save Log
    await ChatLog.create({
        id: Math.random().toString(36),
        userId: req.user.id,
        userName: 'User', // Populate correctly
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

// --- LIVE AI PROXY (WebSocket) ---
// This acts as a bridge: Client Audio -> Server -> Google Live API -> Server -> Client Audio
io.on('connection', (socket) => {
    console.log('Client connected for Live AI');
    let aiSession = null;

    socket.on('start-live', async (config) => {
        try {
            const systemInstruction = await getSystemContext();
            // We use the Gemini Live API on the server
            // Note: @google/genai's live.connect works in Node.js
            aiSession = await ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: ['AUDIO'],
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: () => socket.emit('live-status', 'connected'),
                    onmessage: (msg) => {
                         // Forward backend message to frontend
                         if(msg.serverContent) {
                            socket.emit('live-output', msg.serverContent);
                         }
                    },
                    onclose: () => socket.emit('live-status', 'disconnected'),
                    onerror: (e) => socket.emit('live-error', e.message)
                }
            });
        } catch (e) {
            socket.emit('live-error', e.message);
        }
    });

    socket.on('audio-input', (data) => {
        if (aiSession) {
            // Forward client audio to Gemini
            aiSession.sendRealtimeInput({
                media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: data // Base64 from client
                }
            });
        }
    });

    socket.on('disconnect', () => {
        if (aiSession) {
             // aiSession.close(); // If API supports explicit close
        }
    });
});


// Start
initDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});