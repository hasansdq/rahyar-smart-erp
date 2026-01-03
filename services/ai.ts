
import api from "./api";
import { db } from "./db";
import { io, Socket } from "socket.io-client";

// AI Logic now resides on the server.
// These functions are proxies calling the backend.

export const suggestProjectDetails = async (topic: string): Promise<any> => {
  try {
    const response = await api.post('/ai/generate', {
      prompt: `Create a business project details for topic: "${topic}". Return JSON with: title, description, risks (array), budget (number), tags (array). Content MUST be in Persian (Farsi).`,
      mimeType: 'application/json'
    });
    return JSON.parse(response.data.text || "{}");
  } catch (error) {
    console.error("AI Project Gen Error", error);
    return null;
  }
};

export const generateTeamMember = async (description: string): Promise<any> => {
  try {
    const response = await api.post('/ai/generate', {
      prompt: `Create a user profile based on: "${description}". Return JSON: name, role, email, skills, department. Content MUST be in Persian (Farsi).`,
      mimeType: 'application/json'
    });
    return JSON.parse(response.data.text || "{}");
  } catch (error) {
    return null;
  }
};

export const generateBusinessPlan = async (): Promise<string> => {
  try {
    const prompt = `
      You are a professional business strategist and analyst for an Iranian organization.
      Using the provided SYSTEM DATA (Users, Projects, Finance, Reports), analyze the organization's status and generate a comprehensive Business Plan.

      **STRICT LANGUAGE REQUIREMENTS:**
      1. ALL content (values, descriptions, summaries, analysis) MUST be written in **PERSIAN (FARSI)**.
      2. DO NOT generate English text for the content (except for technical terms if absolutely necessary).
      3. The JSON Keys MUST remain in **ENGLISH** (e.g., "executiveSummary", "marketAnalysis") to match the system schema.
      4. For "riskManagement", the values for "probability" and "impact" MUST be exactly one of: "High", "Medium", or "Low" (Keep these values in English for system compatibility). The "title" and "mitigation" must be in Persian.

      **ANALYSIS INSTRUCTIONS:**
      - Identify real discrepancies in the provided data (e.g., high budget projects with low progress).
      - Predict financial growth based on the transaction history.
      - Suggest marketing campaigns relevant to the organization's field.
      - Calculate "successProbability" (0-100) based on financial health and project progress.

      **REQUIRED JSON STRUCTURE (Output this exact JSON structure):**
      {
        "executiveSummary": "خلاصه مدیریتی کامل و حرفه‌ای از وضعیت فعلی و آینده سازمان به زبان فارسی...",
        "marketAnalysis": "تحلیل بازار و رقبا به زبان فارسی...",
        "marketingStrategy": {
            "overview": "استراتژی کلی بازاریابی و تبلیغات به فارسی...",
            "campaigns": [
                { "name": "نام کمپین", "channel": "کانال (مثلا اینستاگرام)", "budget": 1000, "expectedRoi": "20%", "strategy": "توضیحات استراتژی به فارسی..." }
            ]
        },
        "operationalPlan": "برنامه عملیاتی و اجرایی دقیق به فارسی...",
        "financialProjections": {
            "projections": [
                { "year": "1403", "revenue": 1000, "profit": 200 },
                { "year": "1404", "revenue": 1500, "profit": 400 }
            ],
            "summary": "تحلیل وضعیت مالی و پیش‌بینی آینده به زبان فارسی..."
        },
        "riskManagement": [
            { "title": "عنوان ریسک به فارسی", "probability": "High", "impact": "Medium", "mitigation": "راهکار کاهش ریسک به زبان فارسی..." }
        ],
        "aiInsights": {
            "successProbability": 75,
            "trends": ["روند بازار ۱ به فارسی", "روند ۲ به فارسی"],
            "discrepancies": ["ناهمخوانی شناسایی شده ۱ به فارسی", "ناهمخوانی ۲"],
            "suggestions": ["پیشنهاد استراتژیک ۱ به فارسی", "پیشنهاد ۲"],
            "warnings": ["هشدار جدی ۱ به فارسی"]
        },
        "generatedDate": "${new Date().toLocaleDateString('fa-IR')}"
      }
    `;

    const response = await api.post('/ai/generate', {
      prompt: prompt,
      mimeType: 'application/json'
    });
    return response.data.text || "";
  } catch (error) {
    console.error(error);
    return "";
  }
};

export const consultFinance = async (query: string): Promise<string> => {
  try {
    const response = await api.post('/ai/chat', {
      message: `You are a financial analyst. Answer in Persian (Farsi). Query: ${query}`
    });
    return response.data.text || "No response";
  } catch (error) {
    return "Error communicating with server AI.";
  }
};

export const chatWithManager = async (message: string, isVoice: boolean, attachment?: File): Promise<string> => {
  try {
    // Note: Attachment handling requires multipart/form-data logic on server, 
    // simplified here to text for the modular transition.
    const response = await api.post('/ai/chat', {
      message: message
    });
    return response.data.text || "";
  } catch (error) {
    return "Error processing request.";
  }
};

export const getSmartAlerts = async (): Promise<{warning: string, suggestion: string} | null> => {
  try {
    const response = await api.post('/ai/generate', {
        prompt: "Give me one important warning and one short suggestion for this company based on data. Response must be in Persian (Farsi). JSON: {warning, suggestion}",
        mimeType: 'application/json'
    });
    return JSON.parse(response.data.text || "null");
  } catch {
    return null;
  }
};

export const analyzeTasks = async (): Promise<string> => {
    try {
        const response = await api.post('/ai/generate', {
            prompt: `
                Analyze all tasks in the system. 
                Identify bottlenecks (e.g., users with too many pending tasks), overdue deadlines, and quality of reports submitted.
                Provide a short, professional analytical summary in Persian (Farsi) about the workforce efficiency.
            `
        });
        return response.data.text || "";
    } catch(e) {
        return "خطا در تحلیل وظایف.";
    }
}

// --- LIVE API CLIENT (via Socket.io Proxy) ---

export class LiveSessionManager {
  private socket: Socket | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private nextStartTime = 0;

  constructor(
    private onStatusChange: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => void,
    private onVolumeChange: (vol: number) => void
  ) {}

  toggleMute(muted: boolean) {
     // Implement mute logic if needed
  }

  async connect() {
    this.onStatusChange('connecting');
    this.socket = io({ path: '/socket.io' });

    this.socket.on('connect', () => {
        this.socket?.emit('start-live', {});
    });

    this.socket.on('live-status', (status) => {
        this.onStatusChange(status);
        if(status === 'connected') this.startRecording();
    });

    this.socket.on('live-output', (data) => {
        if(data.modelTurn?.parts?.[0]?.inlineData?.data) {
             this.playAudio(data.modelTurn.parts[0].inlineData.data);
        }
    });

    this.socket.on('live-error', (err) => {
        console.error(err);
        this.onStatusChange('error');
    });

    // Setup Audio Contexts
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  private async startRecording() {
    if(!this.inputAudioContext) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Simple RMS for visualizer
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
        this.onVolumeChange(Math.sqrt(sum/inputData.length) * 100);

        // Convert and Send
        const pcm16 = this.floatTo16BitPCM(inputData);
        const base64 = this.arrayBufferToBase64(pcm16);
        this.socket?.emit('audio-input', base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async playAudio(base64: string) {
      if(!this.outputAudioContext) return;
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for(let i=0; i<len; i++) bytes[i] = binary.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;

      const buffer = this.outputAudioContext.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAudioContext.destination);
      
      const now = this.outputAudioContext.currentTime;
      if(this.nextStartTime < now) this.nextStartTime = now;
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  disconnect() {
    this.socket?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
  }
}
