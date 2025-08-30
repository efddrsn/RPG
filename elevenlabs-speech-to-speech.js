/**
 * Sistema Speech-to-Speech da Eleven Labs
 * Implementação pura sem uso de Web Speech API
 */

class ElevenLabsSpeechToSpeech {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        
        // Configurações de voz
        this.voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel
        this.modelId = 'eleven_multilingual_sts_v2'; // Modelo específico para speech-to-speech
        
        // Estado do sistema
        this.isRecording = false;
        this.isProcessing = false;
        
        // Configurações de áudio
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
            // Criar contexto de áudio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Sistema Speech-to-Speech inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.onError?.(error);
        }
    }
    
    /**
     * Inicia a gravação do microfone
     */
    async startRecording() {
        if (this.isRecording) {
            console.warn('⚠️ Já está gravando');
            return;
        }
        
        try {
            // Solicitar acesso ao microfone
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            // Criar MediaRecorder
            const mimeType = 'audio/webm;codecs=opus';
            const options = { mimeType };
            
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn('⚠️ Codec opus não suportado, usando padrão');
                this.mediaRecorder = new MediaRecorder(this.stream);
            } else {
                this.mediaRecorder = new MediaRecorder(this.stream, options);
            }
            
            // Limpar chunks anteriores
            this.audioChunks = [];
            
            // Configurar eventos
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                // Criar blob de áudio
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                
                // Processar com Speech-to-Speech
                await this.processSpeechToSpeech(audioBlob);
            };
            
            // Iniciar gravação
            this.mediaRecorder.start();
            this.isRecording = true;
            
            console.log('🎤 Gravação iniciada');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            this.onError?.(error);
        }
    }
    
    /**
     * Para a gravação e processa o áudio
     */
    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            console.warn('⚠️ Não está gravando');
            return;
        }
        
        try {
            this.isRecording = false;
            this.mediaRecorder.stop();
            
            // Parar todas as tracks do stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            console.log('🛑 Gravação parada');
            
        } catch (error) {
            console.error('❌ Erro ao parar gravação:', error);
            this.onError?.(error);
        }
    }
    
    /**
     * Processa o áudio gravado com a API Speech-to-Speech
     */
    async processSpeechToSpeech(audioBlob) {
        if (this.isProcessing) {
            console.warn('⚠️ Já está processando');
            return;
        }
        
        this.isProcessing = true;
        this.onProcessingStart?.();
        
        try {
            console.log('🔄 Processando Speech-to-Speech...');
            
            // Criar FormData para envio
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');
            formData.append('model_id', this.modelId);
            formData.append('voice_settings', JSON.stringify({
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0,
                use_speaker_boost: true
            }));
            
            // Fazer requisição para API
            const response = await fetch(
                `${this.baseUrl}/speech-to-speech/${this.voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': this.apiKey
                    },
                    body: formData
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Erro na API ElevenLabs (${response.status})`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.detail?.message) {
                        errorMessage = errorJson.detail.message;
                        
                        // Traduzir mensagens comuns
                        if (errorMessage.includes('model can not be used for voice conversion')) {
                            errorMessage = 'O modelo selecionado não suporta conversão de voz. Usando modelo compatível.';
                        } else if (errorMessage.includes('quota_exceeded')) {
                            errorMessage = 'Limite de uso da API excedido. Verifique sua conta ElevenLabs.';
                        } else if (errorMessage.includes('invalid_api_key')) {
                            errorMessage = 'API Key inválida. Verifique sua chave do ElevenLabs.';
                        }
                    }
                } catch (e) {
                    // Se não for JSON, usa o texto como está
                    errorMessage += `: ${errorText}`;
                }
                
                throw new Error(errorMessage);
            }
            
            // Obter áudio de resposta
            const responseBlob = await response.blob();
            const audioUrl = URL.createObjectURL(responseBlob);
            
            console.log('✅ Speech-to-Speech processado com sucesso');
            
            // Reproduzir áudio
            await this.playAudio(audioUrl);
            
            // Callback com URL do áudio
            this.onAudioReady?.(audioUrl, responseBlob);
            
        } catch (error) {
            console.error('❌ Erro no Speech-to-Speech:', error);
            this.onError?.(error);
        } finally {
            this.isProcessing = false;
            this.onProcessingEnd?.();
        }
    }
    
    /**
     * Reproduz o áudio de resposta
     */
    async playAudio(audioUrl) {
        try {
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;
            
            // Aguardar o áudio carregar
            await new Promise((resolve, reject) => {
                audio.oncanplaythrough = resolve;
                audio.onerror = reject;
            });
            
            // Reproduzir
            await audio.play();
            
            console.log('🔊 Áudio reproduzindo');
            
            // Limpar URL quando terminar
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };
            
        } catch (error) {
            console.error('❌ Erro ao reproduzir áudio:', error);
            throw error;
        }
    }
    
    /**
     * Alterna entre gravar e parar
     */
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    /**
     * Define a voz a ser usada
     */
    setVoice(voiceId) {
        this.voiceId = voiceId;
    }
    
    /**
     * Define o modelo a ser usado
     */
    setModel(modelId) {
        this.modelId = modelId;
    }
    
    /**
     * Atualiza a API Key do ElevenLabs
     */
    setElevenLabsKey(apiKey) {
        this.apiKey = apiKey;
    }
    
    /**
     * Verifica se a API key é válida
     */
    async validateApiKey() {
        try {
            const response = await fetch(`${this.baseUrl}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('❌ Erro ao validar API key:', error);
            return false;
        }
    }
    
    /**
     * Limpa recursos
     */
    dispose() {
        if (this.isRecording) {
            this.stopRecording();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.audioChunks = [];
    }
}