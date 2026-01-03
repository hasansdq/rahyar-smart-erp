
import api from "./api";
import { db } from "./db";
import { io, Socket } from "socket.io-client";

// AI Logic now resides on the server.
// These functions are proxies calling the backend.

export const suggestProjectDetails = async (topic: string): Promise<any> => {
  try {
    const response = await api.post('/ai/generate', {
      prompt: `Create a business project details for topic: "${topic}". Return JSON with: title, description, risks (array), budget (number), tags (array).`,
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
      prompt: `Create a user profile based on: "${description}". Return JSON: name, role, email, skills, department.`,
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
      Based on the provided SYSTEM DATA (Users, Projects, Finance, Reports), generate a comprehensive, strategic Business Plan in JSON format.
      
      The analysis must be deep, identifying specific organizational discrepancies (e.g., high budget but low progress, understaffed departments).
      
      Return STRICT JSON with this structure:
      {
        "executiveSummary": "High-level summary...",
        "marketAnalysis": "Detailed market analysis...",
        "marketingStrategy": {
            "overview": "General marketing approach...",
            "campaigns": [
                { "name": "Campaign Name", "channel": "Platform", "budget": 1000, "expectedRoi": "20%", "strategy": "Tactics..." }
            ]
        },
        "operationalPlan": "Operational details...",
        "financialProjections": {
            "projections": [
                { "year": "Current Year", "revenue": 100, "profit": 20 },
                { "year": "Next Year", "revenue": 150, "profit": 40 }
            ],
            "summary": "Financial outlook text..."
        },
        "riskManagement": [
            { "title": "Risk Name", "probability": "High/Medium/Low", "impact": "High/Medium/Low", "mitigation": "Action plan..." }
        ],
        "aiInsights": {
            "successProbability": 75, // Integer 0-100 based on overall health
            "trends": ["Trend 1", "Trend 2"],
            "discrepancies": ["Discrepancy 1 (e.g. Finance vs Output)", "Discrepancy 2"],
            "suggestions": ["Suggestion 1", "Suggestion 2"],
            "warnings": ["Warning 1", "Warning 2"]
        },
        "generatedDate": "YYYY-MM-DD"
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
      message: `You are a financial analyst. Query: ${query}`
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
        prompt: "Give me one important warning and one short suggestion for this company based on data. JSON: {warning, suggestion}",
        mimeType: 'application/json'
    });
    return JSON.parse(response.data.text || "null");
  } catch {
    return null;
  }
};

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
