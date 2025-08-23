// Sistema de Voz para Delphos AI
// Suporta speech-to-text e text-to-speech com vozes diferentes para modo normal e irrestrito

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
            
            // Procurar voz em português para modo normal
            this.voices.normal = availableVoices.find(voice => 
                voice.lang.includes('pt-BR') && voice.name.includes('Google')
            ) || availableVoices.find(voice => 
                voice.lang.includes('pt-BR')
            ) || availableVoices[0];
            
            // Para voz demoníaca, preferir uma voz masculina grave
            this.voices.demonic = availableVoices.find(voice => 
                voice.lang.includes('pt-BR') && 
                (voice.name.toLowerCase().includes('male') || 
                 voice.name.toLowerCase().includes('masculino'))
            ) || this.voices.normal;
            
            console.log('🔊 Vozes carregadas:', {
                normal: this.voices.normal?.name,
                demonic: this.voices.demonic?.name
            });
        };
        
        // Carregar vozes quando disponíveis
        if (this.speechSynthesis.getVoices().length > 0) {
            setVoices();
        } else {
            this.speechSynthesis.onvoiceschanged = setVoices;
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
    
    // Sintetizar fala
    speak(text, isUnrestricted = false) {
        console.log(`🔊 speak chamado: "${text.substring(0, 50)}..." (modo ${isUnrestricted ? 'demoníaco' : 'normal'})`);
        
        return new Promise((resolve) => {
            if (!this.speechSynthesis) {
                console.error('❌ Síntese de voz não disponível');
                alert('Síntese de voz não está disponível no seu navegador.');
                resolve();
                return;
            }
            
            // Verificar se as vozes foram carregadas
            if (!this.voices.normal) {
                console.warn('⚠️ Vozes ainda não carregadas, tentando carregar...');
                this.loadVoices();
                // Tentar novamente após um delay
                setTimeout(() => this.speak(text, isUnrestricted).then(resolve), 500);
                return;
            }
            
            // Parar qualquer fala anterior
            this.stopSpeaking();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configurar voz baseada no modo
            if (isUnrestricted) {
                utterance.voice = this.voices.demonic;
                utterance.pitch = this.demonicEffects.pitch;
                utterance.rate = this.demonicEffects.rate;
                utterance.volume = this.demonicEffects.volume;
                
                // Adicionar efeitos extras se possível
                this.applyDemonicEffects(utterance);
            } else {
                utterance.voice = this.voices.normal;
                utterance.pitch = 1.0;
                utterance.rate = 1.0;
                utterance.volume = 1.0;
            }
            
            utterance.lang = 'pt-BR';
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateUI('speaking');
                console.log('🔊 Falando' + (isUnrestricted ? ' (modo demoníaco)' : '') + '...');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateUI('idle');
                resolve();
                
                // Reiniciar escuta se em modo conversacional
                if (this.autoListen) {
                    setTimeout(() => this.startListening(), 500);
                }
            };
            
            utterance.onerror = (event) => {
                console.error('Erro na síntese:', event);
                this.isSpeaking = false;
                this.updateUI('error');
                resolve();
            };
            
            this.speechSynthesis.speak(utterance);
        });
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
        if (this.isSpeaking) {
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.updateUI('idle');
        }
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
}

// Exportar para uso global
window.DelphosVoiceSystem = DelphosVoiceSystem;