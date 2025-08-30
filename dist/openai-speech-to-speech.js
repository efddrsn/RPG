/**
 * Sistema Speech-to-Speech utilizando a API de voz da OpenAI
 * Converte voz em texto, gera uma resposta com GPT e sintetiza áudio
 */

class OpenAISpeechToSpeech {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1';

        // Modelos OpenAI utilizados
        this.transcriptionModel = 'gpt-4o-mini-transcribe';
        this.chatModel = 'gpt-4o-mini';
        this.ttsModel = 'gpt-4o-mini-tts';
        this.voice = 'alloy';

        // Estado do sistema
        this.isRecording = false;
        this.isProcessing = false;

        // Recursos de áudio
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.stream = null;

        // Callbacks
        this.onProcessingStart = null;
        this.onProcessingEnd = null;
        this.onError = null;
        this.onAudioReady = null;

        this.initialize();
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Sistema OpenAI Speech-to-Speech inicializado');
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

    async startRecording() {
        if (this.isRecording) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            const mimeType = 'audio/webm;codecs=opus';
            const options = MediaRecorder.isTypeSupported(mimeType)
                ? { mimeType }
                : undefined;
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await this.processSpeechToSpeech(audioBlob);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            console.log('🎤 Gravação iniciada');
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            this.onError?.(error);
        }
    }

    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        this.isRecording = false;
        this.mediaRecorder.stop();
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        console.log('🛑 Gravação parada');
    }

    async processSpeechToSpeech(audioBlob) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.onProcessingStart?.();

        try {
            // 1. Transcrição
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', this.transcriptionModel);

            const transcriptRes = await fetch(`${this.baseUrl}/audio/transcriptions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
                body: formData
            });
            const transcriptData = await transcriptRes.json();
            const transcript = transcriptData.text?.trim();
            if (!transcript) throw new Error('Falha na transcrição');

            // 2. ChatGPT
            const chatRes = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.chatModel,
                    messages: [
                        { role: 'system', content: 'Você é a Delphos AI.' },
                        { role: 'user', content: transcript }
                    ]
                })
            });
            const chatData = await chatRes.json();
            const reply = chatData.choices?.[0]?.message?.content?.trim();
            if (!reply) throw new Error('Falha ao gerar resposta');

            // 3. Text-to-Speech
            const ttsRes = await fetch(`${this.baseUrl}/audio/speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.ttsModel,
                    voice: this.voice,
                    input: reply
                })
            });
            if (!ttsRes.ok) {
                const err = await ttsRes.text();
                throw new Error(err || 'Falha no TTS');
            }
            const responseBlob = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(responseBlob);

            await this.playAudio(audioUrl);
            this.onAudioReady?.(audioUrl, responseBlob);
        } catch (error) {
            console.error('❌ Erro no Speech-to-Speech:', error);
            this.onError?.(error);
        } finally {
            this.isProcessing = false;
            this.onProcessingEnd?.();
        }
    }

    async playAudio(url) {
        try {
            const audio = new Audio(url);
            audio.volume = 1.0;
            await new Promise((resolve, reject) => {
                audio.oncanplaythrough = resolve;
                audio.onerror = reject;
            });
            await audio.play();
            audio.onended = () => URL.revokeObjectURL(url);
        } catch (error) {
            console.error('❌ Erro ao reproduzir áudio:', error);
            throw error;
        }
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

// Disponibiliza globalmente
if (typeof window !== 'undefined') {
    window.OpenAISpeechToSpeech = OpenAISpeechToSpeech;
}
