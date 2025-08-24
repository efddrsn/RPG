// Sistema de TTS usando Eleven Labs API
// Documentação: https://docs.elevenlabs.io/api-reference/text-to-speech

class ElevenLabsTTS {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        
        // IDs de vozes padrão (você pode substituir por vozes personalizadas)
        this.voiceIds = {
            normal: '21m00Tcm4TlvDq8ikWAM', // Rachel - voz feminina natural
            demonic: 'yoZ06aMxZJJ28mfd3POQ', // Sam - voz masculina grave (pode ser customizada)
            // Para criar uma voz personalizada "demoníaca", use o Voice Lab da Eleven Labs
        };
        
        // Configurações de modelo
        this.modelId = 'eleven_monolingual_v1'; // ou 'eleven_multilingual_v2' para melhor suporte PT-BR
        
        // Cache de áudio para evitar requisições repetidas
        this.audioCache = new Map();
    }
    
    // Verificar se a API key está configurada
    isConfigured() {
        return this.apiKey && this.apiKey.length > 0;
    }
    
    // Listar vozes disponíveis
    async getVoices() {
        if (!this.isConfigured()) {
            throw new Error('API key não configurada');
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar vozes: ${response.status}`);
            }
            
            const data = await response.json();
            return data.voices;
        } catch (error) {
            console.error('Erro ao listar vozes:', error);
            throw error;
        }
    }
    
    // Converter texto em fala
    async textToSpeech(text, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('API key não configurada');
        }
        
        // Configurações padrão
        const {
            voiceId = this.voiceIds.normal,
            modelId = this.modelId,
            voiceSettings = {
                stability: 0.5,
                similarity_boost: 0.75
            },
            isDemonic = false
        } = options;
        
        // Usar voz demoníaca se especificado
        const selectedVoiceId = isDemonic ? this.voiceIds.demonic : voiceId;
        
        // Ajustar configurações para voz demoníaca
        const adjustedSettings = isDemonic ? {
            stability: 0.3, // Menos estável para efeito mais perturbador
            similarity_boost: 0.5,
            style: 0.8, // Mais expressivo
            use_speaker_boost: false
        } : voiceSettings;
        
        // Verificar cache
        const cacheKey = `${text}-${selectedVoiceId}-${JSON.stringify(adjustedSettings)}`;
        if (this.audioCache.has(cacheKey)) {
            console.log('🎵 Usando áudio do cache');
            return this.audioCache.get(cacheKey);
        }
        
        console.log('🔊 Fazendo requisição para Eleven Labs API...', {
            voiceId: selectedVoiceId,
            modelId,
            textLength: text.length
        });
        
        try {
            const response = await fetch(
                `${this.baseUrl}/text-to-speech/${selectedVoiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.apiKey
                    },
                    body: JSON.stringify({
                        text,
                        model_id: modelId,
                        voice_settings: adjustedSettings
                    })
                }
            );
            
            console.log('📡 Resposta recebida:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                let errorDetail;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    errorDetail = await response.json();
                } else {
                    errorDetail = await response.text();
                }
                
                console.error('❌ Erro da API:', errorDetail);
                
                // Mensagens de erro mais específicas
                let errorMessage = `Erro ${response.status}: `;
                
                if (response.status === 401) {
                    errorMessage += 'API Key inválida ou expirada';
                } else if (response.status === 403) {
                    errorMessage += 'Acesso negado - verifique as permissões da sua API Key';
                } else if (response.status === 422) {
                    errorMessage += 'Dados inválidos - ' + (errorDetail.detail || JSON.stringify(errorDetail));
                } else if (response.status === 429) {
                    errorMessage += 'Limite de requisições excedido - aguarde um momento';
                } else {
                    errorMessage += errorDetail.detail || errorDetail || response.statusText;
                }
                
                throw new Error(errorMessage);
            }
            
            // Converter resposta em blob de áudio
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Adicionar ao cache
            this.audioCache.set(cacheKey, audioUrl);
            
            // Limpar cache antigo se ficar muito grande
            if (this.audioCache.size > 50) {
                const firstKey = this.audioCache.keys().next().value;
                const firstUrl = this.audioCache.get(firstKey);
                URL.revokeObjectURL(firstUrl);
                this.audioCache.delete(firstKey);
            }
            
            return audioUrl;
            
        } catch (error) {
            console.error('Erro ao gerar TTS:', error);
            throw error;
        }
    }
    
    // Tocar áudio gerado
    async speak(text, isDemonic = false) {
        try {
            console.log(`🎤 Gerando fala via Eleven Labs: "${text.substring(0, 50)}..."${isDemonic ? ' (modo demoníaco)' : ''}`);
            
            // Gerar áudio
            const audioUrl = await this.textToSpeech(text, { isDemonic });
            
            // Criar elemento de áudio e tocar
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;
            
            // Se for demoníaco, podemos adicionar efeitos extras com Web Audio API
            if (isDemonic && window.AudioContext) {
                await this.playWithEffects(audio);
            } else {
                await audio.play();
            }
            
            // Aguardar o fim da reprodução
            return new Promise((resolve) => {
                audio.onended = () => {
                    console.log('✅ Reprodução concluída');
                    resolve();
                };
                audio.onerror = (error) => {
                    console.error('❌ Erro ao reproduzir áudio:', error);
                    resolve();
                };
            });
            
        } catch (error) {
            console.error('Erro no Eleven Labs TTS:', error);
            throw error;
        }
    }
    
    // Tocar com efeitos adicionais (para modo demoníaco)
    async playWithEffects(audio) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);
        
        // Criar efeitos
        const distortion = this.createDistortion(audioContext);
        const reverb = await this.createReverb(audioContext);
        const lowpass = audioContext.createBiquadFilter();
        
        // Configurar filtro passa-baixa
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 600;
        
        // Conectar cadeia de efeitos
        source.connect(distortion);
        distortion.connect(reverb);
        reverb.connect(lowpass);
        lowpass.connect(audioContext.destination);
        
        // Tocar
        await audio.play();
    }
    
    // Criar efeito de distorção
    createDistortion(audioContext) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + 20) * x * 20 * (Math.PI / 180)) / (Math.PI + 20 * Math.abs(x));
        }
        
        const distortion = audioContext.createWaveShaper();
        distortion.curve = curve;
        distortion.oversample = '4x';
        return distortion;
    }
    
    // Criar reverberação
    async createReverb(audioContext) {
        const convolver = audioContext.createConvolver();
        const length = audioContext.sampleRate * 3;
        const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }
    
    // Limpar cache
    clearCache() {
        this.audioCache.forEach(url => URL.revokeObjectURL(url));
        this.audioCache.clear();
    }
}

// Exportar para uso global
window.ElevenLabsTTS = ElevenLabsTTS;