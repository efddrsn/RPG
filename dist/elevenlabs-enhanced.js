// Sistema aprimorado de TTS/STS usando Eleven Labs API
// Documentação: https://docs.elevenlabs.io/api-reference/

class ElevenLabsEnhanced {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        
        // IDs de vozes padrão
        this.voiceIds = {
            normal: '21m00Tcm4TlvDq8ikWAM', // Rachel
            demonic: 'yoZ06aMxZJJ28mfd3POQ', // Sam
            brazilian: 'Mj4RCpOMdFDFqRlcBO1X' // Uma voz brasileira se disponível
        };
        
        // Modelos disponíveis
        this.models = {
            multilingual_v2: 'eleven_multilingual_v2', // Melhor para PT-BR
            monolingual_v1: 'eleven_monolingual_v1',
            turbo_v2: 'eleven_turbo_v2' // Mais rápido
        };
        
        this.defaultModel = this.models.multilingual_v2;
        this.audioCache = new Map();
        
        // Configurações padrão
        this.defaultSettings = {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true
        };
    }
    
    // Verificar status da API e validar key
    async validateApiKey() {
        try {
            const response = await fetch(`${this.baseUrl}/user`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            
            if (!response.ok) {
                return {
                    valid: false,
                    error: `Status ${response.status}: ${response.statusText}`
                };
            }
            
            const userData = await response.json();
            return {
                valid: true,
                userData,
                subscription: userData.subscription,
                characterCount: userData.subscription.character_count,
                characterLimit: userData.subscription.character_limit
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    // Listar modelos disponíveis
    async getModels() {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar modelos: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao listar modelos:', error);
            throw error;
        }
    }
    
    // Adicionar método para parar áudio
    stopAudio() {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.remove();
        });
        console.log('🛑 Áudio do Eleven Labs parado');
    }
    
    // Text-to-Speech aprimorado
    async textToSpeech(text, options = {}) {
        const {
            voiceId = this.voiceIds.normal,
            modelId = this.defaultModel,
            voiceSettings = this.defaultSettings,
            stream = false,
            optimizeStreamingLatency = 0,
            outputFormat = 'mp3_44100_128'
        } = options;
        
        // Log detalhado para debug
        console.log('🎤 TTS Request:', {
            textPreview: text.substring(0, 50) + '...',
            voiceId,
            modelId,
            voiceSettings,
            stream
        });
        
        const endpoint = stream 
            ? `${this.baseUrl}/text-to-speech/${voiceId}/stream`
            : `${this.baseUrl}/text-to-speech/${voiceId}`;
        
        try {
            const requestBody = {
                text,
                model_id: modelId,
                voice_settings: voiceSettings
            };
            
            // Adicionar parâmetros opcionais se streaming
            if (stream && optimizeStreamingLatency > 0) {
                requestBody.optimize_streaming_latency = optimizeStreamingLatency;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                    'output-format': outputFormat
                },
                body: JSON.stringify(requestBody)
            });
            
            // Log da resposta
            console.log('📡 TTS Response:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                throw new Error(this.formatError(response.status, errorData));
            }
            
            // Retornar blob de áudio
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Cache do áudio
            const cacheKey = `${text}-${voiceId}-${modelId}`;
            if (this.audioCache.has(cacheKey)) {
                URL.revokeObjectURL(this.audioCache.get(cacheKey));
            }
            this.audioCache.set(cacheKey, audioUrl);
            
            return {
                audioUrl,
                blob: audioBlob,
                cached: false
            };
            
        } catch (error) {
            console.error('❌ TTS Error:', error);
            throw error;
        }
    }
    
    // Speech-to-Speech (BETA)
    async speechToSpeech(audioFile, options = {}) {
        const {
            voiceId = this.voiceIds.normal,
            modelId = this.defaultModel,
            voiceSettings = this.defaultSettings,
            removeBackgroundNoise = false
        } = options;
        
        console.log('🎙️ STS Request:', {
            fileSize: audioFile.size,
            fileType: audioFile.type,
            voiceId,
            modelId
        });
        
        // Criar FormData para upload
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('model_id', modelId);
        formData.append('voice_settings', JSON.stringify(voiceSettings));
        
        if (removeBackgroundNoise) {
            formData.append('remove_background_noise', 'true');
        }
        
        try {
            const response = await fetch(
                `${this.baseUrl}/speech-to-speech/${voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': this.apiKey
                    },
                    body: formData
                }
            );
            
            console.log('📡 STS Response:', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                throw new Error(this.formatError(response.status, errorData));
            }
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            return {
                audioUrl,
                blob: audioBlob
            };
            
        } catch (error) {
            console.error('❌ STS Error:', error);
            throw error;
        }
    }
    
    // Voice Cloning/Criação
    async addVoice(name, files, options = {}) {
        const {
            description = '',
            labels = {}
        } = options;
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('labels', JSON.stringify(labels));
        
        // Adicionar arquivos de áudio
        files.forEach((file, index) => {
            formData.append('files', file);
        });
        
        try {
            const response = await fetch(`${this.baseUrl}/voices/add`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                throw new Error(this.formatError(response.status, errorData));
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Add Voice Error:', error);
            throw error;
        }
    }
    
    // Histórico de uso
    async getHistory(options = {}) {
        const {
            pageSize = 100,
            startAfterHistoryItemId = null
        } = options;
        
        let url = `${this.baseUrl}/history?page_size=${pageSize}`;
        if (startAfterHistoryItemId) {
            url += `&start_after_history_item_id=${startAfterHistoryItemId}`;
        }
        
        try {
            const response = await fetch(url, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar histórico: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            throw error;
        }
    }
    
    // Utilitários
    async parseErrorResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    }
    
    formatError(status, errorData) {
        const errorMessages = {
            401: 'API Key inválida ou não autorizada',
            403: 'Acesso negado - verifique as permissões da API Key',
            404: 'Recurso não encontrado',
            422: 'Dados inválidos na requisição',
            429: 'Limite de requisições excedido',
            500: 'Erro interno do servidor Eleven Labs'
        };
        
        let message = errorMessages[status] || `Erro ${status}`;
        
        if (typeof errorData === 'object' && errorData.detail) {
            message += `: ${errorData.detail}`;
        } else if (typeof errorData === 'string') {
            message += `: ${errorData}`;
        }
        
        return message;
    }
    
    // Limpar cache
    clearCache() {
        this.audioCache.forEach(url => URL.revokeObjectURL(url));
        this.audioCache.clear();
    }
    
    // Reprodutor de áudio integrado
    async playAudio(audioUrl, options = {}) {
        const {
            volume = 1.0,
            onStart = null,
            onEnd = null,
            onError = null
        } = options;
        
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            audio.volume = volume;
            
            audio.addEventListener('play', () => {
                console.log('▶️ Reprodução iniciada');
                if (onStart) onStart();
            });
            
            audio.addEventListener('ended', () => {
                console.log('⏹️ Reprodução finalizada');
                if (onEnd) onEnd();
                resolve();
            });
            
            audio.addEventListener('error', (error) => {
                console.error('❌ Erro na reprodução:', error);
                if (onError) onError(error);
                reject(error);
            });
            
            audio.play().catch(reject);
        });
    }
    
    // Método conveniente para TTS + reprodução
    async speakText(text, options = {}) {
        try {
            const { audioUrl } = await this.textToSpeech(text, options);
            await this.playAudio(audioUrl, options);
        } catch (error) {
            console.error('Erro ao falar texto:', error);
            throw error;
        }
    }
}

// Exportar para uso global
window.ElevenLabsEnhanced = ElevenLabsEnhanced;