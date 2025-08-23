// Sistema de Voz para Delphos AI
// Suporta speech-to-text e text-to-speech com vozes diferentes para modo normal e irrestrito
// Agora com suporte para Eleven Labs API

class DelphosVoiceSystem {
    constructor() {
        // Verificar suporte do navegador
        this.speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.speechSynthesis = window.speechSynthesis;
        
        // Estado do sistema
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceMode = 'normal'; // 'normal' ou 'demonic'
        this.autoListen = false; // Para modo conversacional contínuo
        this.voicesLoaded = false;
        this.utteranceQueue = []; // Fila para garantir que utterances sejam processadas
        
        // Configuração de TTS
        this.ttsMode = 'native'; // 'native' ou 'elevenlabs'
        this.elevenLabsApiKey = localStorage.getItem('elevenlabs_api_key') || '';
        this.elevenLabsTTS = null;
        
        // Inicializar Eleven Labs se houver API key
        if (this.elevenLabsApiKey) {
            this.initializeElevenLabs();
        }
        
        // Configurações de voz
        this.voices = {
            normal: null,
            demonic: null
        };
        
        // Configurações de efeitos para voz demoníaca
        this.demonicEffects = {
            pitch: 0.3,      // Tom mais grave
            rate: 0.8,       // Velocidade mais lenta
            volume: 1.0,
            // Efeitos adicionais serão aplicados via Web Audio API
            reverb: 0.7,
            distortion: 0.5
        };
        
        // Inicializar reconhecimento de voz
        if (this.speechRecognition) {
            this.recognition = new this.speechRecognition();
            this.setupRecognition();
        }
        
        // Carregar vozes disponíveis
        this.loadVoices();
        
        // Configurar Web Audio API para efeitos demoníacos
        this.audioContext = null;
        this.setupAudioEffects();
        
        // Forçar carregamento de vozes em alguns navegadores
        this.initializeSpeechSynthesis();
    }
    
    // Inicializar Eleven Labs TTS
    initializeElevenLabs() {
        if (window.ElevenLabsTTS) {
            try {
                this.elevenLabsTTS = new window.ElevenLabsTTS(this.elevenLabsApiKey);
                this.ttsMode = 'elevenlabs';
                console.log('✅ Eleven Labs TTS inicializado');
            } catch (error) {
                console.error('❌ Erro ao inicializar Eleven Labs:', error);
                this.ttsMode = 'native';
            }
        } else {
            console.warn('⚠️ Eleven Labs TTS não está carregado');
        }
    }
    
    // Configurar API key do Eleven Labs
    setElevenLabsApiKey(apiKey) {
        this.elevenLabsApiKey = apiKey;
        localStorage.setItem('elevenlabs_api_key', apiKey);
        
        if (apiKey) {
            this.initializeElevenLabs();
        } else {
            this.ttsMode = 'native';
            this.elevenLabsTTS = null;
        }
    }
    
    // Alternar entre TTS nativo e Eleven Labs
    setTTSMode(mode) {
        if (mode === 'elevenlabs' && !this.elevenLabsTTS) {
            console.warn('⚠️ Eleven Labs não está configurado. Usando TTS nativo.');
            this.ttsMode = 'native';
            return false;
        }
        
        this.ttsMode = mode;
        console.log(`🔊 Modo TTS alterado para: ${mode}`);
        return true;
    }
    
    // Inicializar Speech Synthesis para garantir que funcione
    initializeSpeechSynthesis() {
        // Alguns navegadores precisam de uma interação inicial para carregar vozes
        if (this.speechSynthesis) {
            // Criar um utterance vazio para forçar inicialização
            const initUtterance = new SpeechSynthesisUtterance('');
            initUtterance.volume = 0;
            this.speechSynthesis.speak(initUtterance);
            this.speechSynthesis.cancel();
            
            // Adicionar listener para mudanças de voz
            if (this.speechSynthesis.onvoiceschanged !== undefined) {
                this.speechSynthesis.onvoiceschanged = () => {
                    console.log('🔊 Evento voiceschanged disparado');
                    this.loadVoices();
                };
            }
        }
    }
    
    // Configurar reconhecimento de voz
    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pt-BR';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUI('listening');
            console.log('🎤 Ouvindo...');
        };
        
        this.recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            
            if (event.results[current].isFinal) {
                console.log('📝 Transcrição final:', transcript);
                this.handleVoiceInput(transcript);
            } else {
                // Mostrar transcrição parcial
                this.updateTranscript(transcript, false);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Erro no reconhecimento:', event.error);
            this.isListening = false;
            this.updateUI('error', event.error);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateUI('idle');
            
            // Reiniciar se estiver em modo conversacional
            if (this.autoListen && !this.isSpeaking) {
                setTimeout(() => this.startListening(), 500);
            }
        };
    }
    
    // Carregar vozes disponíveis
    loadVoices() {
        const setVoices = () => {
            const availableVoices = this.speechSynthesis.getVoices();
            
            console.log(`🔊 Carregando vozes... Total disponível: ${availableVoices.length}`);
            
            if (availableVoices.length === 0) {
                console.warn('⚠️ Nenhuma voz disponível ainda');
                return;
            }
            
            // Procurar voz em português para modo normal
            this.voices.normal = availableVoices.find(voice => 
                voice.lang.includes('pt-BR') && voice.name.includes('Google')
            ) || availableVoices.find(voice => 
                voice.lang.includes('pt-BR')
            ) || availableVoices.find(voice =>
                voice.lang.includes('pt')
            ) || availableVoices[0];
            
            // Para voz demoníaca, preferir uma voz masculina grave
            this.voices.demonic = availableVoices.find(voice => 
                voice.lang.includes('pt-BR') && 
                (voice.name.toLowerCase().includes('male') || 
                 voice.name.toLowerCase().includes('masculino'))
            ) || this.voices.normal;
            
            this.voicesLoaded = true;
            
            console.log('🔊 Vozes carregadas:', {
                normal: this.voices.normal?.name,
                demonic: this.voices.demonic?.name,
                total: availableVoices.length
            });
        };
        
        // Carregar vozes quando disponíveis
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            setVoices();
        } else {
            // Tentar novamente após um pequeno delay
            setTimeout(() => {
                const voicesRetry = this.speechSynthesis.getVoices();
                if (voicesRetry.length > 0) {
                    setVoices();
                }
            }, 100);
        }
    }
    
    // Configurar Web Audio API para efeitos
    setupAudioEffects() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Criar nós de efeitos
            this.effects = {
                distortion: this.createDistortion(),
                reverb: this.createReverb(),
                lowpass: this.audioContext.createBiquadFilter()
            };
            
            // Configurar filtro passa-baixa para som mais grave
            this.effects.lowpass.type = 'lowpass';
            this.effects.lowpass.frequency.value = 800;
            
        } catch (error) {
            console.warn('⚠️ Web Audio API não disponível:', error);
        }
    }
    
    // Criar efeito de distorção
    createDistortion() {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + 10) * x * 20 * deg) / (Math.PI + 10 * Math.abs(x));
        }
        
        const distortion = this.audioContext.createWaveShaper();
        distortion.curve = curve;
        distortion.oversample = '4x';
        return distortion;
    }
    
    // Criar efeito de reverberação
    createReverb() {
        const convolver = this.audioContext.createConvolver();
        const length = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }
    
    // Iniciar reconhecimento de voz
    startListening() {
        console.log('🎤 startListening chamado');
        
        if (!this.speechRecognition) {
            const msg = 'Seu navegador não suporta reconhecimento de voz! Use Chrome, Edge ou Safari.';
            console.error('❌', msg);
            alert(msg);
            return;
        }
        
        if (this.isListening) {
            console.log('⚠️ Já está ouvindo');
            return;
        }
        
        // Parar síntese se estiver falando
        if (this.isSpeaking) {
            this.stopSpeaking();
        }
        
        // Solicitar permissão do microfone se necessário
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                console.log('✅ Permissão de microfone concedida');
                try {
                    this.recognition.start();
                    console.log('✅ Reconhecimento iniciado');
                } catch (error) {
                    console.error('❌ Erro ao iniciar reconhecimento:', error);
                    if (error.message.includes('already started')) {
                        // Tentar parar e reiniciar
                        this.recognition.stop();
                        setTimeout(() => {
                            try {
                                this.recognition.start();
                            } catch (e) {
                                console.error('❌ Erro ao reiniciar:', e);
                            }
                        }, 100);
                    }
                }
            })
            .catch((error) => {
                console.error('❌ Erro ao obter permissão do microfone:', error);
                alert('Por favor, permita o acesso ao microfone para usar o reconhecimento de voz.');
            });
    }
    
    // Parar reconhecimento
    stopListening() {
        if (this.isListening) {
            this.recognition.stop();
        }
    }
    
    // Sintetizar fala - agora com suporte para Eleven Labs
    async speak(text, isUnrestricted = false) {
        console.log(`🔊 speak chamado: "${text.substring(0, 50)}..." (modo ${isUnrestricted ? 'demoníaco' : 'normal'}, TTS: ${this.ttsMode})`);
        
        // Parar qualquer fala anterior
        this.stopSpeaking();
        
        // Usar Eleven Labs se disponível e configurado
        if (this.ttsMode === 'elevenlabs' && this.elevenLabsTTS) {
            try {
                this.isSpeaking = true;
                this.updateUI('speaking');
                
                await this.elevenLabsTTS.speak(text, isUnrestricted);
                
                this.isSpeaking = false;
                this.updateUI('idle');
                
                // Reiniciar escuta se em modo conversacional
                if (this.autoListen) {
                    setTimeout(() => this.startListening(), 500);
                }
                
                return;
            } catch (error) {
                console.error('❌ Erro no Eleven Labs, voltando para TTS nativo:', error);
                this.ttsMode = 'native';
                // Continua para usar TTS nativo como fallback
            }
        }
        
        // Usar TTS nativo
        return new Promise((resolve, reject) => {
            if (!this.speechSynthesis) {
                console.error('❌ Síntese de voz não disponível');
                reject(new Error('Síntese de voz não está disponível no seu navegador.'));
                return;
            }
            
            // Verificar se as vozes foram carregadas
            if (!this.voicesLoaded || !this.voices.normal) {
                console.warn('⚠️ Vozes ainda não carregadas, tentando carregar...');
                this.loadVoices();
                
                // Tentar novamente após um delay
                setTimeout(() => {
                    this.speak(text, isUnrestricted)
                        .then(resolve)
                        .catch(reject);
                }, 500);
                return;
            }
            
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Configurar voz baseada no modo
                if (isUnrestricted && this.voices.demonic) {
                    utterance.voice = this.voices.demonic;
                    utterance.pitch = this.demonicEffects.pitch;
                    utterance.rate = this.demonicEffects.rate;
                    utterance.volume = this.demonicEffects.volume;
                    
                    // Adicionar efeitos extras se possível
                    this.applyDemonicEffects(utterance);
                } else if (this.voices.normal) {
                    utterance.voice = this.voices.normal;
                    utterance.pitch = 1.0;
                    utterance.rate = 1.0;
                    utterance.volume = 1.0;
                }
                
                utterance.lang = 'pt-BR';
                
                utterance.onstart = () => {
                    this.isSpeaking = true;
                    this.updateUI('speaking');
                    console.log('🔊 Iniciando fala' + (isUnrestricted ? ' (modo demoníaco)' : '') + '...');
                };
                
                utterance.onend = () => {
                    this.isSpeaking = false;
                    this.updateUI('idle');
                    console.log('✅ Fala concluída');
                    resolve();
                    
                    // Reiniciar escuta se em modo conversacional
                    if (this.autoListen) {
                        setTimeout(() => this.startListening(), 500);
                    }
                };
                
                utterance.onerror = (event) => {
                    console.error('❌ Erro na síntese:', event.error, event);
                    this.isSpeaking = false;
                    this.updateUI('error', event.error);
                    
                    // Tentar novamente com configurações básicas se falhar
                    if (event.error === 'synthesis-failed' || event.error === 'synthesis-unavailable') {
                        console.log('🔄 Tentando com configurações básicas...');
                        const basicUtterance = new SpeechSynthesisUtterance(text);
                        basicUtterance.lang = 'pt-BR';
                        
                        basicUtterance.onend = () => {
                            console.log('✅ Fala básica concluída');
                            resolve();
                        };
                        
                        basicUtterance.onerror = () => {
                            reject(new Error('Falha na síntese de voz'));
                        };
                        
                        this.speechSynthesis.speak(basicUtterance);
                    } else {
                        reject(new Error(`Erro na síntese: ${event.error}`));
                    }
                };
                
                // Adicionar à fila e processar
                this.utteranceQueue.push(utterance);
                this.processUtteranceQueue();
                
            } catch (error) {
                console.error('❌ Erro ao criar utterance:', error);
                reject(error);
            }
        });
    }
    
    // Processar fila de utterances
    processUtteranceQueue() {
        if (this.utteranceQueue.length === 0) return;
        
        const utterance = this.utteranceQueue.shift();
        
        // Garantir que o speechSynthesis esteja pronto
        if (this.speechSynthesis.speaking || this.speechSynthesis.pending) {
            this.speechSynthesis.cancel();
        }
        
        // Pequeno delay para garantir que o sistema esteja pronto
        setTimeout(() => {
            try {
                this.speechSynthesis.speak(utterance);
            } catch (error) {
                console.error('❌ Erro ao falar:', error);
            }
        }, 50);
    }
    
    // Aplicar efeitos demoníacos adicionais
    applyDemonicEffects(utterance) {
        // Adicionar pequenas pausas aleatórias para efeito sinistro
        const words = utterance.text.split(' ');
        const modifiedText = words.map((word, index) => {
            if (index > 0 && Math.random() < 0.2) {
                return '... ' + word;
            }
            return word;
        }).join(' ');
        
        utterance.text = modifiedText;
        
        // Adicionar risada demoníaca ocasional
        if (Math.random() < 0.1) {
            utterance.text += '... há há há...';
        }
    }
    
    // Parar síntese
    stopSpeaking() {
        // Parar TTS nativo
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            this.utteranceQueue = [];
        }
        
        // Parar Eleven Labs se estiver tocando
        // (Eleven Labs usa elementos <audio> que param automaticamente quando um novo é criado)
        
        this.isSpeaking = false;
        this.updateUI('idle');
    }
    
    // Lidar com entrada de voz
    handleVoiceInput(transcript) {
        // Enviar para o chat principal
        const userInput = document.getElementById('user-input');
        userInput.value = transcript;
        
        // Disparar evento de envio
        const sendBtn = document.getElementById('send-btn');
        sendBtn.click();
        
        this.updateTranscript(transcript, true);
    }
    
    // Atualizar transcrição na UI
    updateTranscript(text, isFinal) {
        const indicator = document.getElementById('voice-transcript');
        if (indicator) {
            indicator.textContent = text;
            indicator.classList.toggle('final', isFinal);
        }
    }
    
    // Atualizar interface de usuário
    updateUI(state, error = null) {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceIndicator = document.getElementById('voice-indicator');
        
        if (!voiceBtn || !voiceIndicator) return;
        
        // Remover todas as classes de estado
        voiceIndicator.classList.remove('listening', 'speaking', 'error');
        
        switch (state) {
            case 'listening':
                voiceBtn.textContent = '🎤';
                voiceIndicator.classList.add('listening');
                voiceIndicator.title = 'Ouvindo...';
                break;
                
            case 'speaking':
                voiceBtn.textContent = '🔊';
                voiceIndicator.classList.add('speaking');
                voiceIndicator.title = 'Falando...';
                break;
                
            case 'error':
                voiceBtn.textContent = '❌';
                voiceIndicator.classList.add('error');
                voiceIndicator.title = `Erro: ${error || 'Desconhecido'}`;
                break;
                
            default: // idle
                voiceBtn.textContent = '🎙️';
                voiceIndicator.title = 'Clique para falar';
        }
    }
    
    // Alternar modo conversacional
    toggleConversationalMode() {
        this.autoListen = !this.autoListen;
        
        if (this.autoListen) {
            console.log('🔄 Modo conversacional ativado');
            if (!this.isListening && !this.isSpeaking) {
                this.startListening();
            }
        } else {
            console.log('⏸️ Modo conversacional desativado');
        }
        
        return this.autoListen;
    }
    
    // Definir modo de voz (normal ou demoníaco)
    setVoiceMode(mode) {
        this.voiceMode = mode;
        console.log(`🎭 Modo de voz alterado para: ${mode}`);
    }

    // Obter status do sistema
    getStatus() {
        return {
            ttsMode: this.ttsMode,
            elevenLabsConfigured: !!this.elevenLabsTTS,
            nativeTTSAvailable: !!this.speechSynthesis,
            speechRecognitionAvailable: !!this.speechRecognition,
            voicesLoaded: this.voicesLoaded,
            isListening: this.isListening,
            isSpeaking: this.isSpeaking
        };
    }
}

// Exportar para uso global
window.DelphosVoiceSystem = DelphosVoiceSystem;