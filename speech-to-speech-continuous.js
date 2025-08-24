/**
 * Sistema Speech-to-Speech Modo Contínuo
 * Versão simplificada e otimizada para mobile
 */

class ContinuousSpeechSystem {
    constructor(elevenLabsApiKey) {
        this.elevenLabsApiKey = elevenLabsApiKey;
        
        // Estado do sistema
        this.isActive = false;
        this.hasPermission = false;
        this.isListening = false;
        this.isSpeaking = false;
        
        // Reconhecimento de voz
        this.recognition = null;
        this.recognitionRestarting = false;
        
        // Configurações de voz ElevenLabs
        this.voiceConfig = {
            voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
            modelId: 'eleven_multilingual_v2',
            settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0,
                use_speaker_boost: true
            }
        };
        
        // Cache de áudio e contexto
        this.audioCache = new Map();
        this.audioContext = null;
        this.currentAudio = null;
        
        // Callbacks
        this.onStatusChange = null;
        this.onTranscription = null;
        this.onResponse = null;
        this.onError = null;
        
        // Timeouts e intervalos
        this.silenceTimeout = null;
        this.permissionCheckInterval = null;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Criar contexto de áudio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Verificar se estamos em contexto seguro
            if (!this.isSecureContext()) {
                throw new Error('Este sistema requer HTTPS ou localhost para funcionar');
            }
            
            // Configurar reconhecimento de voz
            this.setupSpeechRecognition();
            
            // Validar API da ElevenLabs se fornecida
            if (this.elevenLabsApiKey) {
                await this.validateElevenLabsAPI();
            }
            
            console.log('✅ Sistema de voz contínuo inicializado');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.onError?.(error);
        }
    }
    
    isSecureContext() {
        return window.isSecureContext || 
               location.protocol === 'https:' || 
               location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1';
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            throw new Error('Navegador não suporta reconhecimento de voz');
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pt-BR';
        this.recognition.maxAlternatives = 1;
        
        // Configurar eventos
        this.recognition.onstart = () => {
            console.log('🎤 Reconhecimento iniciado');
            this.isListening = true;
            this.updateStatus('listening');
            this.resetSilenceTimeout();
        };
        
        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                console.log('📝 Transcrição final:', transcript);
                this.handleTranscription(transcript);
                this.resetSilenceTimeout();
            } else {
                console.log('📝 Transcrição parcial:', transcript);
                this.onTranscription?.(transcript, false);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Erro no reconhecimento:', event.error);
            
            // Tratar erros específicos
            if (event.error === 'not-allowed') {
                this.hasPermission = false;
                this.handlePermissionError();
            } else if (event.error === 'no-speech') {
                // Ignorar erro de silêncio em modo contínuo
                if (this.isActive && !this.recognitionRestarting) {
                    this.restartRecognition();
                }
            } else if (event.error === 'network') {
                this.onError?.(new Error('Erro de conexão. Verifique sua internet.'));
            }
        };
        
        this.recognition.onend = () => {
            console.log('🎤 Reconhecimento finalizado');
            this.isListening = false;
            
            // Reiniciar automaticamente se ainda estiver ativo
            if (this.isActive && !this.isSpeaking && !this.recognitionRestarting) {
                this.restartRecognition();
            }
        };
    }
    
    async checkAndRequestPermission() {
        try {
            // Verificar se já temos permissão
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({ name: 'microphone' });
                    console.log('📋 Status da permissão:', result.state);
                    
                    if (result.state === 'granted') {
                        this.hasPermission = true;
                        return true;
                    } else if (result.state === 'denied') {
                        this.hasPermission = false;
                        this.handlePermissionError();
                        return false;
                    }
                } catch (e) {
                    console.log('⚠️ API de permissões não disponível');
                }
            }
            
            // Tentar obter stream para solicitar permissão
            console.log('🎤 Solicitando permissão do microfone...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Parar imediatamente o stream
            stream.getTracks().forEach(track => track.stop());
            
            this.hasPermission = true;
            console.log('✅ Permissão do microfone concedida');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao solicitar permissão:', error);
            this.hasPermission = false;
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                this.handlePermissionError();
            } else if (error.name === 'NotFoundError') {
                this.onError?.(new Error('Nenhum microfone encontrado'));
            }
            
            return false;
        }
    }
    
    handlePermissionError() {
        const errorMsg = '🎤 Acesso ao microfone bloqueado. Por favor:\n' +
                        '1. Clique no ícone de cadeado na barra de endereço\n' +
                        '2. Permita o acesso ao microfone para este site\n' +
                        '3. Recarregue a página';
        
        console.error(errorMsg);
        this.onError?.(new Error(errorMsg));
        this.updateStatus('permission_denied');
    }
    
    async start() {
        try {
            // Verificar permissão primeiro
            const hasPermission = await this.checkAndRequestPermission();
            if (!hasPermission) {
                return false;
            }
            
            this.isActive = true;
            this.updateStatus('starting');
            
            // Iniciar reconhecimento
            await this.startRecognition();
            
            // Monitorar permissões periodicamente
            this.startPermissionMonitoring();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao iniciar:', error);
            this.onError?.(error);
            return false;
        }
    }
    
    async startRecognition() {
        if (!this.recognition || this.isListening || this.isSpeaking) {
            return;
        }
        
        try {
            // Garantir que temos permissão antes de iniciar
            if (!this.hasPermission) {
                const hasPermission = await this.checkAndRequestPermission();
                if (!hasPermission) {
                    return;
                }
            }
            
            this.recognition.start();
            
        } catch (error) {
            console.error('❌ Erro ao iniciar reconhecimento:', error);
            
            // Se já está rodando, tentar parar e reiniciar
            if (error.message && error.message.includes('already started')) {
                this.recognition.stop();
                setTimeout(() => this.startRecognition(), 100);
            }
        }
    }
    
    async restartRecognition() {
        if (this.recognitionRestarting || !this.isActive) {
            return;
        }
        
        this.recognitionRestarting = true;
        console.log('🔄 Reiniciando reconhecimento...');
        
        setTimeout(async () => {
            this.recognitionRestarting = false;
            if (this.isActive && !this.isSpeaking) {
                await this.startRecognition();
            }
        }, 300);
    }
    
    startPermissionMonitoring() {
        // Limpar monitoramento anterior
        if (this.permissionCheckInterval) {
            clearInterval(this.permissionCheckInterval);
        }
        
        // Verificar permissões a cada 2 segundos
        this.permissionCheckInterval = setInterval(async () => {
            if (!this.isActive) {
                clearInterval(this.permissionCheckInterval);
                return;
            }
            
            // Verificar se ainda temos permissão
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({ name: 'microphone' });
                    
                    if (result.state === 'denied' && this.hasPermission) {
                        console.log('⚠️ Permissão do microfone foi revogada');
                        this.hasPermission = false;
                        this.handlePermissionError();
                        this.stop();
                    } else if (result.state === 'granted' && !this.hasPermission) {
                        console.log('✅ Permissão do microfone foi concedida');
                        this.hasPermission = true;
                        
                        // Reiniciar se estava parado por falta de permissão
                        if (this.isActive && !this.isListening && !this.isSpeaking) {
                            await this.startRecognition();
                        }
                    }
                } catch (e) {
                    // API não disponível, ignorar
                }
            }
        }, 2000);
    }
    
    resetSilenceTimeout() {
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        // Reiniciar após 5 segundos de silêncio
        this.silenceTimeout = setTimeout(() => {
            if (this.isActive && this.isListening && !this.isSpeaking) {
                console.log('⏱️ Timeout de silêncio, reiniciando...');
                this.restartRecognition();
            }
        }, 5000);
    }
    
    async handleTranscription(text) {
        if (!text || text.trim().length === 0) {
            return;
        }
        
        // Parar reconhecimento temporariamente
        this.recognition.stop();
        
        // Notificar transcrição
        this.onTranscription?.(text, true);
        
        // Processar resposta (aqui você integraria com o ChatGPT)
        // Por enquanto, vamos simular
        await this.processUserInput(text);
    }
    
    async processUserInput(text) {
        try {
            this.updateStatus('processing');
            
            // Aqui você faria a chamada para o ChatGPT
            // Por enquanto, vamos usar uma resposta simulada
            const response = `Você disse: "${text}". Este é o modo contínuo funcionando!`;
            
            // Sintetizar e reproduzir resposta
            await this.speak(response);
            
        } catch (error) {
            console.error('❌ Erro ao processar entrada:', error);
            this.onError?.(error);
            
            // Reiniciar reconhecimento mesmo com erro
            if (this.isActive) {
                await this.restartRecognition();
            }
        }
    }
    
    async speak(text) {
        if (!text || this.isSpeaking) {
            return;
        }
        
        try {
            this.isSpeaking = true;
            this.updateStatus('speaking');
            
            // Notificar resposta
            this.onResponse?.(text);
            
            // Se temos ElevenLabs configurado, usar
            if (this.elevenLabsApiKey) {
                const audioBlob = await this.synthesizeWithElevenLabs(text);
                await this.playAudio(audioBlob);
            } else {
                // Usar síntese nativa
                await this.speakNative(text);
            }
            
        } catch (error) {
            console.error('❌ Erro ao falar:', error);
            this.onError?.(error);
        } finally {
            this.isSpeaking = false;
            
            // Reiniciar reconhecimento após falar
            if (this.isActive) {
                setTimeout(() => this.restartRecognition(), 500);
            }
        }
    }
    
    async synthesizeWithElevenLabs(text) {
        // Verificar cache
        const cacheKey = `${text}_normal`;
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey);
        }
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceConfig.voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': this.elevenLabsApiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: this.voiceConfig.modelId,
                voice_settings: this.voiceConfig.settings
            })
        });
        
        if (!response.ok) {
            throw new Error(`ElevenLabs erro: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        this.audioCache.set(cacheKey, audioBlob);
        
        return audioBlob;
    }
    
    async playAudio(audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Parar áudio anterior
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.volume = 1.0;
        
        return new Promise((resolve, reject) => {
            this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                resolve();
            };
            
            this.currentAudio.onerror = (error) => {
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                reject(error);
            };
            
            this.currentAudio.play().catch(reject);
        });
    }
    
    async speakNative(text) {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onend = () => resolve();
            utterance.onerror = (error) => reject(error);
            
            // Garantir que não há outras falas em andamento
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        });
    }
    
    async validateElevenLabsAPI() {
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/user', {
                headers: {
                    'xi-api-key': this.elevenLabsApiKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`API inválida: ${response.status}`);
            }
            
            console.log('✅ ElevenLabs API validada');
            
        } catch (error) {
            console.error('❌ Erro ao validar ElevenLabs:', error);
            this.elevenLabsApiKey = null; // Desabilitar ElevenLabs
        }
    }
    
    updateStatus(status) {
        console.log(`📊 Status: ${status}`);
        this.onStatusChange?.(status);
    }
    
    stop() {
        console.log('⏹️ Parando sistema de voz contínuo');
        
        this.isActive = false;
        
        // Parar reconhecimento
        if (this.recognition) {
            this.recognition.stop();
        }
        
        // Parar áudio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        // Cancelar síntese nativa
        window.speechSynthesis.cancel();
        
        // Limpar timeouts e intervalos
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        if (this.permissionCheckInterval) {
            clearInterval(this.permissionCheckInterval);
        }
        
        this.updateStatus('stopped');
    }
    
    // Métodos auxiliares
    setElevenLabsKey(apiKey) {
        this.elevenLabsApiKey = apiKey;
        if (apiKey) {
            this.validateElevenLabsAPI();
        }
    }
    
    clearCache() {
        this.audioCache.clear();
        console.log('🗑️ Cache de áudio limpo');
    }
    
    getStatus() {
        return {
            isActive: this.isActive,
            hasPermission: this.hasPermission,
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            hasElevenLabs: !!this.elevenLabsApiKey
        };
    }
}

// Exportar para uso global
window.ContinuousSpeechSystem = ContinuousSpeechSystem;