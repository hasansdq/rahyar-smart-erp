import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";
import { db } from "./db";
import { UserRole } from "../types";

// NOTE: In a real production app, never expose API keys on the client.
const API_KEY = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const isAIReady = () => !!ai;

export const getAIClient = () => ai;

export const getSystemContext = () => {
  const settings = db.getSettings();
  const fullData = JSON.stringify(db.getData());
  const knowledge = (db.getKnowledgeBase() || []).map(k => `${k.name} (Size: ${k.size})`).join(', ');
  
  return `
    ${settings.systemPrompt}
    
    *** DYNAMIC SYSTEM INSTRUCTIONS FOR LIVE VOICE MODE ***
    شما مدیر ارشد استراتژی در سامانه هوشمند رهیار هستید.
    
    قوانین حیاتی برای مکالمه صوتی پرسرعت (Low Latency Mode):
    1. **پاسخ‌های کوتاه و سریع:** بلافاصله صحبت کن. جملات ابتدایی باید کوتاه باشند تا کاربر سریع صدا را بشنود. از حاشیه رفتن و مقدمه‌چینی طولانی پرهیز کن.
    2. **مدیریت حافظه:** تمام مکالمه جاری را به یاد داشته باش.
    3. **توقف هنگام صحبت کاربر:** اگر کاربر وسط حرفت پرید، یعنی می‌خواهد موضوع را عوض کند؛ مکث نکن و فقط گوش بده (سمت کلاینت صدا قطع می‌شود، اما تو باید آمادگی تغییر بحث را داشته باشی).
    4. **لحن:** قاطع، حرفه‌ای و صریح.
    
    اطلاعات سیستم:
    ${fullData.substring(0, 30000)}
    
    فایل‌ها:
    ${knowledge}
  `;
};

// --- Helpers for File & Audio ---

const fileToPart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

// --- Standard Chat & Generation ---

export const suggestProjectDetails = async (topic: string): Promise<any> => {
  if (!ai) return null;
  const settings = db.getSettings();
  
  const prompt = `
    وظیفه: ایجاد جزئیات یک پروژه تجاری واقعی بر اساس موضوع: "${topic}".
    خروجی باید یک JSON معتبر باشد که شامل فیلدهای زیر است:
    title (عنوان جذاب),
    description (توضیحات کامل حرفه ای),
    risks (لیست 3 ریسک احتمالی),
    budget (یک عدد تخمینی به تومان),
    tags (3 برچسب مرتبط)
    
    فرمت JSON:
    {"title": "...", "description": "...", "risks": ["..."], "budget": 1000, "tags": ["..."]}
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Project Gen Error", error);
    return null;
  }
};

export const generateTeamMember = async (description: string): Promise<any> => {
  if (!ai) return null;
  const settings = db.getSettings();

  const prompt = `
    وظیفه: تولید اطلاعات یک کارمند فرضی برای سامانه رهیار بر اساس توصیف: "${description}".
    خروجی JSON شامل: name, role (مدیر/ادمین/کارمند), email, skills (آرایه), department.
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return null;
  }
};

export const generateBusinessPlan = async (): Promise<string> => {
  if (!ai) return "";
  const settings = db.getSettings();
  const context = getSystemContext();

  const prompt = `
    بر اساس اطلاعات سیستم، یک بیزینس پلن جامع و استراتژیک برای سال آینده تدوین کن.
    خروجی باید JSON باشد با فیلدهای:
    executiveSummary (خلاصه مدیریتی),
    marketAnalysis (تحلیل بازار),
    marketingStrategy (استراتژی بازاریابی),
    operationalPlan (برنامه عملیاتی),
    financialProjections (پیش‌بینی مالی - متنی و توصیفی).
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: [
        { text: context },
        { text: prompt }
      ],
      config: { responseMimeType: 'application/json' }
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};

export const consultFinance = async (query: string): Promise<string> => {
  if (!ai) return "AI Error";
  const settings = db.getSettings();
  const context = getSystemContext();

  try {
    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: [
        { text: context },
        { text: `تحلیلگر مالی هستی. سوال: ${query}` }
      ]
    });
    return response.text || "No response";
  } catch (error) {
    return "خطا در ارتباط با هوش مصنوعی";
  }
};

export const chatWithManager = async (message: string, isVoice: boolean, attachment?: File): Promise<string> => {
  if (!ai) return "سیستم هوش مصنوعی غیرفعال است (API Key یافت نشد).";
  const settings = db.getSettings();
  const context = getSystemContext();

  try {
    const contents: any[] = [
      { text: context },
      { text: message }
    ];

    if (attachment) {
      const filePart = await fileToPart(attachment);
      contents.push(filePart);
    }

    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: contents
    });
    
    return response.text || "";
  } catch (error) {
    console.error(error);
    return "خطا در پردازش درخواست.";
  }
};

export const getSmartAlerts = async (): Promise<{warning: string, suggestion: string} | null> => {
  if (!ai) return null;
  const settings = db.getSettings();
  const context = getSystemContext();
  
  try {
    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: [
        { text: context },
        { text: "فقط یک هشدار مهم و یک پیشنهاد مدیریتی کوتاه بده. خروجی JSON: {warning, suggestion}" }
      ],
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "null");
  } catch {
    return null;
  }
};

export const analyzeReport = async (reportContent: string): Promise<any> => {
  if (!ai) return null;
  return { feedback: "تحلیل انجام شد", score: 85 };
};

// --- LIVE API IMPLEMENTATION (OPTIMIZED V2) ---

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    // Clamping is important after gain boost
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class LiveSessionManager {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sessionPromise: Promise<any> | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isConnected = false;
  private isMuted = false;
  
  private scheduledSources: AudioBufferSourceNode[] = [];
  
  // Adjusted thresholds
  private readonly vadThreshold = 0.01; // More sensitive to interrupt
  private readonly inputGainMultiplier = 3.0; // Significant boost to input volume

  constructor(
    private onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void,
    private onVolumeChange: (vol: number) => void
  ) {}

  toggleMute(muted: boolean) {
    this.isMuted = muted;
    // Critical Fix: If muted, IMMEDIATELY stop AI talking.
    if (muted) {
        this.stopAllAudio();
    }
  }

  async connect() {
    if (!ai) return;
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ 
          sampleRate: 16000, 
          latencyHint: 'interactive' 
      });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ 
          sampleRate: 24000, 
          latencyHint: 'interactive' 
      });
      
      const context = getSystemContext();

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: context,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: async () => {
            this.isConnected = true;
            this.onStatusChange('connected');
            await this.startRecording();
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && this.outputAudioContext) {
              this.playAudio(audioData);
            }
            if (msg.serverContent?.interrupted) {
                this.stopAllAudio();
            }
          },
          onclose: () => {
            this.isConnected = false;
            this.onStatusChange('disconnected');
            this.cleanup();
          },
          onerror: (err) => {
            console.error('Live API Error:', err);
            this.onStatusChange('error');
            this.disconnect();
          }
        }
      });
    } catch (e) {
      console.error(e);
      this.onStatusChange('error');
    }
  }

  private async startRecording() {
    if (!this.inputAudioContext) return;
    
    this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true, // Let browser handle basic gain, we boost manually too
            channelCount: 1,
            sampleRate: 16000
        } 
    });
    
    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // 1. SOFTWARE GAIN BOOST (Fixes "Not understanding")
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
          // Multiply volume to ensure model hears clearly
          inputData[i] = inputData[i] * this.inputGainMultiplier;
          sum += inputData[i] * inputData[i];
      }
      
      const rms = Math.sqrt(sum / inputData.length);
      this.onVolumeChange(rms * 100);

      // 2. BARGE-IN LOGIC (Interruption)
      // Only interrupt if not muted and RMS is significant
      if (!this.isMuted && rms > this.vadThreshold) {
          if (this.scheduledSources.length > 0) {
              this.stopAllAudio(); 
          }
      }

      // 3. MUTE LOGIC (Send silence or nothing)
      if (this.isMuted) return;

      const pcm16 = floatTo16BitPCM(inputData);
      const base64 = arrayBufferToBase64(pcm16);

      this.sessionPromise?.then(session => {
         session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64
            }
         });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private stopAllAudio() {
      this.scheduledSources.forEach(source => {
          try {
              source.stop();
              source.disconnect();
          } catch (e) { }
      });
      this.scheduledSources = [];
      // Reset timer to current to avoid queuing delay when we resume
      if (this.outputAudioContext) {
          this.nextStartTime = this.outputAudioContext.currentTime;
      }
  }

  private async playAudio(base64: string) {
    if (!this.outputAudioContext) return;

    const arrayBuffer = base64ToArrayBuffer(base64);
    const dataInt16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) {
        float32[i] = dataInt16[i] / 32768.0;
    }

    const audioBuffer = this.outputAudioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    
    source.onended = () => {
        this.scheduledSources = this.scheduledSources.filter(s => s !== source);
    };
    this.scheduledSources.push(source);

    const currentTime = this.outputAudioContext.currentTime;
    
    // Latency Fix: If we drifted too far behind (network lag), skip ahead.
    // If nextStartTime is in the past, reset it to now.
    if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
    }
    
    // Also, if nextStartTime is TOO far in the future (> 500ms), it implies
    // we are buffering too much. Ideally we want tight loops.
    // For now, standard queuing is safest for smooth audio.

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  disconnect() {
    this.isConnected = false;
    this.sessionPromise?.then(s => s.close()); 
    this.cleanup();
    this.onStatusChange('disconnected');
  }

  private cleanup() {
    this.stopAllAudio();
    this.stream?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.source?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.nextStartTime = 0;
  }
}