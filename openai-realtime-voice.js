/**
 * Sistema de voz streaming utilizando a Realtime API da OpenAI
 * Captura áudio do microfone, envia em tempo real e reproduz as respostas
 */
class OpenAIRealtimeVoice {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.model = 'gpt-4o-realtime-preview';
        this.voice = 'alloy';

        this.ws = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.isRecording = false;
        this.isProcessing = false;

        // Controle de reprodução
        this.playbackTime = 0;

        // Callbacks
        this.onProcessingStart = null;
        this.onProcessingEnd = null;
        this.onError = null;
        this.onAudioReady = null;

        this.initialize();
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            console.log('✅ Sistema OpenAI Realtime Voice inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.onError?.(error);
        }
    }

    async checkAndRequestPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            return true;
        } catch (error) {
            console.error('❌ Permissão de microfone negada:', error);
            this.onError?.(new Error('Permissão de microfone negada'));
            return false;
        }
    }

    async connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
        return new Promise((resolve, reject) => {
            const url = `wss://api.openai.com/v1/realtime?model=${this.model}&voice=${this.voice}`;
            this.ws = new WebSocket(url, [
                'realtime',
                `openai-insecure-api-key.${this.apiKey}`,
                'openai-beta.realtime-v1'
            ]);

            this.ws.onopen = () => {
                console.log('🔌 Conexão Realtime aberta');
                resolve();
            };
            this.ws.onerror = (err) => {
                console.error('❌ Erro na conexão Realtime:', err);
                this.onError?.(err);
                reject(err);
            };
            this.ws.onclose = () => {
                console.log('🛑 Conexão Realtime fechada');
            };
            this.ws.onmessage = (event) => this.handleMessage(event);
        });
    }

    async startRecording() {
        if (this.isRecording) return;
        await this.connect();
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            const processor = this.audioContext.createScriptProcessor(1024, 1, 1);
            source.connect(processor);
            processor.connect(this.audioContext.destination);

            processor.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) {
                    let s = Math.max(-1, Math.min(1, input[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                const b64 = this.arrayBufferToBase64(pcm16.buffer);
                try {
                    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
                } catch (err) {
                    console.error('❌ Erro ao enviar áudio:', err);
                }
            };

            this.processor = processor;
            this.isRecording = true;
            console.log('🎤 Streaming iniciado');
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            this.onError?.(error);
        }
    }

    async stopRecording() {
        if (!this.isRecording) return;
        this.isRecording = false;

        if (this.processor) {
            this.processor.disconnect();
            this.processor.onaudioprocess = null;
            this.processor = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }

        // Enviar commit e solicitar resposta
        try {
            this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
            this.ws.send(JSON.stringify({ type: 'response.create' }));
            this.isProcessing = true;
            this.onProcessingStart?.();
        } catch (err) {
            console.error('❌ Erro ao finalizar envio de áudio:', err);
            this.onError?.(err);
        }
    }

    handleMessage(event) {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'response.audio.delta') {
                this.playAudioChunk(msg.audio);
                this.onAudioReady?.();
            } else if (msg.type === 'response.completed') {
                this.isProcessing = false;
                this.playbackTime = 0;
                this.onProcessingEnd?.();
            } else if (msg.type === 'error') {
                console.error('❌ Erro na API:', msg);
                this.onError?.(new Error(msg.error?.message || 'Erro no Realtime API'));
            }
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    }

    playAudioChunk(b64) {
        const arrayBuffer = this.base64ToArrayBuffer(b64);
        const pcm = new Int16Array(arrayBuffer);
        const float32 = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) {
            float32[i] = pcm[i] / 32768;
        }
        const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        const startTime = this.audioContext.currentTime + this.playbackTime;
        source.start(startTime);
        this.playbackTime += audioBuffer.duration;
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    setOpenAIKey(key) {
        this.apiKey = key;
    }
}

if (typeof window !== 'undefined') {
    window.OpenAIRealtimeVoice = OpenAIRealtimeVoice;
}

