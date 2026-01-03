import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GoogleGenAI } from '@google/genai';
import { sequelize, User, Project, Task, Transaction, Report, Contract, ChatLog, Settings, KnowledgeFile, initDB } from './models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Railway requires listening on process.env.PORT ---
const PORT = process.env.PORT || 3001;
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
io.on('connection', (socket) => {
    console.log('Client connected for Live AI');
    let aiSession = null;

    socket.on('start-live', async (config) => {
        try {
            const systemInstruction = await getSystemContext();
            aiSession = await ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: ['AUDIO'],
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: () => socket.emit('live-status', 'connected'),
                    onmessage: (msg) => {
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
            aiSession.sendRealtimeInput({
                media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: data 
                }
            });
        }
    });

    socket.on('disconnect', () => {
        if (aiSession) {
             // aiSession.close();
        }
    });
});

// --- SERVE FRONTEND (PRODUCTION) ---
// This middleware serves the static files from the build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  // If request is for API, don't serve html
  if(req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start
initDB().then(() => {
  // Listen on 0.0.0.0 to ensure external access in containerized environments
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  // Optional: Start server anyway if DB is optional, otherwise exit
  // process.exit(1); 
});