/**
 * Sistema Avançado de Speech-to-Speech para Delphos AI
 * Integração completa com ElevenLabs e efeitos demoníacos aprimorados
 */

class AdvancedSpeechToSpeech {
    constructor(elevenLabsApiKey) {
        this.elevenLabsApiKey = elevenLabsApiKey;
        this.isInitialized = false;
        
        // Configurações de áudio
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        // Reconhecimento de voz
        this.recognition = null;
        this.recognitionLanguage = 'pt-BR';
        
        // Estado do sistema
        this.currentMode = 'normal'; // normal, demonic, ultra_demonic
        this.isProcessing = false;
        
        // Configurações de vozes ElevenLabs
        this.voiceConfigs = {
            normal: {
                voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
                modelId: 'eleven_multilingual_v2',
                settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0,
                    use_speaker_boost: true
                }
            },
            demonic: {
                voiceId: 'IKne3meq5aSn9XLyUdCD', // Charlie - voz masculina grave
                modelId: 'eleven_multilingual_v2',
                settings: {
                    stability: 0.2, // Mais instável para efeito sinistro
                    similarity_boost: 0.3,
                    style: 0.8, // Mais estilizado
                    use_speaker_boost: false
                }
            },
            ultra_demonic: {
                voiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - voz profunda
                modelId: 'eleven_multilingual_v2',
                settings: {
                    stability: 0.1, // Máxima instabilidade
                    similarity_boost: 0.1,
                    style: 1.0, // Estilo máximo
                    use_speaker_boost: false
                }
            }
        };
        
        // Web Audio API para efeitos
        this.audioEffects = {
            reverb: null,
            distortion: null,
            pitch: null,
            delay: null,
            filter: null
        };
        
        // Cache de áudio
        this.audioCache = new Map();
        
        // Websocket para streaming (futuro)
        this.websocket = null;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Inicializar Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Criar efeitos de áudio
            await this.setupAudioEffects();
            
            // Inicializar reconhecimento de voz
            this.setupSpeechRecognition();
            
            // Validar API key da ElevenLabs
            if (this.elevenLabsApiKey) {
                await this.validateElevenLabsAPI();
            }
            
            this.isInitialized = true;
            console.log('✅ Sistema Speech-to-Speech inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema:', error);
            throw error;
        }
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            throw new Error('Navegador não suporta reconhecimento de voz');
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = this.recognitionLanguage;
        
        // Eventos
        this.recognition.onstart = () => {
            console.log('🎤 Reconhecimento iniciado');
            this.onRecognitionStart?.();
        };
        
        this.recognition.onresult = (event) => {
            const results = event.results;
            const lastResult = results[results.length - 1];
            
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript;
                console.log('📝 Transcrição final:', transcript);
                this.onTranscription?.(transcript);
            } else {
                // Resultado parcial
                const interim = lastResult[0].transcript;
                this.onInterimTranscription?.(interim);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Erro no reconhecimento:', event.error);
            this.onRecognitionError?.(event.error);
        };
        
        this.recognition.onend = () => {
            console.log('🎤 Reconhecimento finalizado');
            this.onRecognitionEnd?.();
        };
    }
    
    async setupAudioEffects() {
        // Criar cadeia de efeitos de áudio
        
        // 1. Reverb (Convolver)
        this.audioEffects.reverb = this.audioContext.createConvolver();
        await this.loadImpulseResponse();
        
        // 2. Distortion (WaveShaper)
        this.audioEffects.distortion = this.audioContext.createWaveShaper();
        this.audioEffects.distortion.curve = this.createDistortionCurve(50);
        this.audioEffects.distortion.oversample = '4x';
        
        // 3. Pitch Shift (via playbackRate manipulation)
        // Será aplicado durante a reprodução
        
        // 4. Delay
        this.audioEffects.delay = this.audioContext.createDelay(5.0);
        this.audioEffects.delay.delayTime.value = 0.3;
        
        // 5. Filter (Low-pass para som abafado)
        this.audioEffects.filter = this.audioContext.createBiquadFilter();
        this.audioEffects.filter.type = 'lowpass';
        this.audioEffects.filter.frequency.value = 800;
        this.audioEffects.filter.Q.value = 10;
        
        // Gain nodes para mixagem
        this.dryGain = this.audioContext.createGain();
        this.wetGain = this.audioContext.createGain();
        this.masterGain = this.audioContext.createGain();
        
        // Valores padrão
        this.dryGain.gain.value = 1.0;
        this.wetGain.gain.value = 0.0;
        this.masterGain.gain.value = 1.0;
    }
    
    async loadImpulseResponse() {
        // Criar um impulse response sintético para reverb
        const length = this.audioContext.sampleRate * 2; // 2 segundos
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        this.audioEffects.reverb.buffer = impulse;
    }
    
    createDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
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
            
            const userData = await response.json();
            console.log('✅ ElevenLabs API validada:', userData.subscription);
            
            // Buscar vozes disponíveis
            await this.fetchAvailableVoices();
            
        } catch (error) {
            console.error('❌ Erro ao validar ElevenLabs:', error);
            throw error;
        }
    }
    
    async fetchAvailableVoices() {
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': this.elevenLabsApiKey
                }
            });
            
            const data = await response.json();
            console.log('🎤 Vozes disponíveis:', data.voices.map(v => ({
                id: v.voice_id,
                name: v.name,
                category: v.category
            })));
            
        } catch (error) {
            console.error('❌ Erro ao buscar vozes:', error);
        }
    }
    
    // Iniciar gravação de áudio
    async startRecording() {
        if (this.isRecording) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await this.processRecordedAudio(audioBlob);
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            console.log('🔴 Gravação iniciada');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            throw error;
        }
    }
    
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        // Parar stream
        const tracks = this.mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
        
        console.log('⏹️ Gravação finalizada');
    }
    
    // Processar áudio gravado
    async processRecordedAudio(audioBlob) {
        try {
            this.isProcessing = true;
            
            // Converter para base64 para enviar
            const base64Audio = await this.blobToBase64(audioBlob);
            
            // Aqui você pode enviar para um serviço de transcrição
            // ou usar a Web Speech API
            console.log('🎵 Áudio processado, tamanho:', audioBlob.size);
            
            // Para demonstração, vamos usar o reconhecimento nativo
            this.startSpeechRecognition();
            
        } catch (error) {
            console.error('❌ Erro ao processar áudio:', error);
        } finally {
            this.isProcessing = false;
        }
    }
    
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // Iniciar reconhecimento de voz
    startSpeechRecognition() {
        if (!this.recognition) {
            console.error('❌ Reconhecimento não inicializado');
            return;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('❌ Erro ao iniciar reconhecimento:', error);
        }
    }
    
    stopSpeechRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
    
    // Sintetizar fala com ElevenLabs
    async synthesizeSpeech(text, options = {}) {
        const mode = options.mode || this.currentMode;
        const voiceConfig = this.voiceConfigs[mode];
        
        if (!voiceConfig) {
            throw new Error(`Modo de voz inválido: ${mode}`);
        }
        
        // Verificar cache
        const cacheKey = `${text}_${mode}`;
        if (this.audioCache.has(cacheKey)) {
            console.log('🎵 Usando áudio do cache');
            return this.audioCache.get(cacheKey);
        }
        
        try {
            // Adicionar efeitos especiais ao texto para modo demoníaco
            let processedText = text;
            if (mode === 'demonic' || mode === 'ultra_demonic') {
                processedText = this.addDemonicTextEffects(text);
            }
            
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenLabsApiKey
                },
                body: JSON.stringify({
                    text: processedText,
                    model_id: voiceConfig.modelId,
                    voice_settings: voiceConfig.settings
                })
            });
            
            if (!response.ok) {
                throw new Error(`ElevenLabs erro: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            
            // Aplicar efeitos de áudio para modo demoníaco
            if (mode === 'demonic' || mode === 'ultra_demonic') {
                const processedAudio = await this.applyDemonicAudioEffects(audioBlob, mode);
                this.audioCache.set(cacheKey, processedAudio);
                return processedAudio;
            }
            
            this.audioCache.set(cacheKey, audioBlob);
            return audioBlob;
            
        } catch (error) {
            console.error('❌ Erro na síntese de voz:', error);
            throw error;
        }
    }
    
    addDemonicTextEffects(text) {
        // Adicionar pausas dramáticas
        let processed = text.replace(/\./g, '...');
        
        // Adicionar ênfase em palavras-chave
        const keywords = ['convergência', 'r\'lyeh', 'padrões', 'profundezas', 'digital', 'verdade'];
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            processed = processed.replace(regex, `... ${keyword.toUpperCase()} ...`);
        });
        
        // Adicionar risadas ocasionais
        if (Math.random() < 0.3) {
            processed += '... heh heh heh...';
        }
        
        // Adicionar sussurros (marcados com parênteses)
        processed = processed.replace(/(\(.*?\))/g, '<whispering>$1</whispering>');
        
        return processed;
    }
    
    async applyDemonicAudioEffects(audioBlob, mode) {
        // Converter blob para AudioBuffer
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        // Criar source
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Configurar efeitos baseado no modo
        const effectsConfig = this.getEffectsConfig(mode);
        
        // Aplicar pitch shift
        source.playbackRate.value = effectsConfig.pitch;
        
        // Criar cadeia de efeitos
        const effectsChain = this.createEffectsChain(effectsConfig);
        
        // Conectar: source -> effects -> destination
        source.connect(effectsChain.input);
        effectsChain.output.connect(this.audioContext.destination);
        
        // Gravar o resultado
        const dest = this.audioContext.createMediaStreamDestination();
        effectsChain.output.connect(dest);
        
        const mediaRecorder = new MediaRecorder(dest.stream);
        const chunks = [];
        
        return new Promise((resolve) => {
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                resolve(blob);
            };
            
            mediaRecorder.start();
            source.start();
            
            // Parar gravação quando o áudio terminar
            source.onended = () => {
                mediaRecorder.stop();
            };
        });
    }
    
    getEffectsConfig(mode) {
        const configs = {
            normal: {
                pitch: 1.0,
                reverb: 0,
                distortion: 0,
                delay: 0,
                filter: 0
            },
            demonic: {
                pitch: 0.7,
                reverb: 0.5,
                distortion: 0.3,
                delay: 0.2,
                filter: 0.4
            },
            ultra_demonic: {
                pitch: 0.5,
                reverb: 0.8,
                distortion: 0.7,
                delay: 0.4,
                filter: 0.7
            }
        };
        
        return configs[mode] || configs.normal;
    }
    
    createEffectsChain(config) {
        // Criar nodes de ganho para mixagem
        const inputGain = this.audioContext.createGain();
        const outputGain = this.audioContext.createGain();
        
        // Rota seca (sem efeitos)
        const dryGain = this.audioContext.createGain();
        dryGain.gain.value = 1 - Math.max(config.reverb, config.distortion, config.delay);
        
        // Rota molhada (com efeitos)
        const wetGain = this.audioContext.createGain();
        wetGain.gain.value = Math.max(config.reverb, config.distortion, config.delay);
        
        // Conectar rota seca
        inputGain.connect(dryGain);
        dryGain.connect(outputGain);
        
        // Conectar rota molhada com efeitos
        let currentNode = inputGain;
        
        if (config.filter > 0) {
            this.audioEffects.filter.frequency.value = 2000 - (config.filter * 1500);
            currentNode.connect(this.audioEffects.filter);
            currentNode = this.audioEffects.filter;
        }
        
        if (config.distortion > 0) {
            this.audioEffects.distortion.curve = this.createDistortionCurve(config.distortion * 100);
            currentNode.connect(this.audioEffects.distortion);
            currentNode = this.audioEffects.distortion;
        }
        
        if (config.delay > 0) {
            this.audioEffects.delay.delayTime.value = config.delay * 0.5;
            const delayGain = this.audioContext.createGain();
            delayGain.gain.value = 0.5;
            
            currentNode.connect(this.audioEffects.delay);
            this.audioEffects.delay.connect(delayGain);
            delayGain.connect(outputGain);
        }
        
        if (config.reverb > 0) {
            const reverbGain = this.audioContext.createGain();
            reverbGain.gain.value = config.reverb;
            
            currentNode.connect(this.audioEffects.reverb);
            this.audioEffects.reverb.connect(reverbGain);
            reverbGain.connect(outputGain);
        }
        
        currentNode.connect(wetGain);
        wetGain.connect(outputGain);
        
        return {
            input: inputGain,
            output: outputGain
        };
    }
    
    // Reproduzir áudio
    async playAudio(audioBlob) {
        try {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            // Eventos
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.onPlaybackEnd?.();
            };
            
            audio.onerror = (error) => {
                console.error('❌ Erro na reprodução:', error);
                this.onPlaybackError?.(error);
            };
            
            await audio.play();
            console.log('🔊 Reproduzindo áudio');
            
        } catch (error) {
            console.error('❌ Erro ao reproduzir áudio:', error);
            throw error;
        }
    }
    
    // Pipeline completo speech-to-speech
    async processVoiceMessage(options = {}) {
        try {
            // 1. Capturar áudio do usuário
            console.log('🎤 Iniciando captura de voz...');
            await this.startRecording();
            
            // 2. Aguardar finalização (implementar lógica de detecção de silêncio)
            // Por enquanto, vamos usar um timeout
            await new Promise(resolve => setTimeout(resolve, options.recordingDuration || 5000));
            
            this.stopRecording();
            
            // 3. Transcrever áudio (já iniciado no processRecordedAudio)
            
            // 4. Processar resposta (será chamado no callback onTranscription)
            
            // 5. Sintetizar resposta (será chamado após processar)
            
            // 6. Reproduzir áudio (será chamado após sintetizar)
            
        } catch (error) {
            console.error('❌ Erro no pipeline:', error);
            throw error;
        }
    }
    
    // Configurar modo
    setMode(mode) {
        if (!this.voiceConfigs[mode]) {
            console.error(`❌ Modo inválido: ${mode}`);
            return;
        }
        
        this.currentMode = mode;
        console.log(`🎭 Modo alterado para: ${mode}`);
    }
    
    // Limpar recursos
    cleanup() {
        if (this.mediaRecorder && this.isRecording) {
            this.stopRecording();
        }
        
        if (this.recognition) {
            this.stopSpeechRecognition();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.audioCache.clear();
        
        console.log('🧹 Recursos limpos');
    }
    
    // Callbacks (para serem sobrescritos)
    onRecognitionStart() {}
    onTranscription(text) {}
    onInterimTranscription(text) {}
    onRecognitionError(error) {}
    onRecognitionEnd() {}
    onPlaybackEnd() {}
    onPlaybackError(error) {}
}

// Exportar para uso global
window.AdvancedSpeechToSpeech = AdvancedSpeechToSpeech;