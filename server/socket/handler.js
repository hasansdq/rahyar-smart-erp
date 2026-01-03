import { getSystemContext, ai } from '../routes/ai.js';

export const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected for Live AI');
        let aiSession = null;

        socket.on('start-live', async () => {
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
                console.error("Live Connect Error:", e);
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
             // Session cleanup if needed
        });
    });
};