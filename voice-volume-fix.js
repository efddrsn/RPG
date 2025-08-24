// Correção para o problema de volume da voz normal no Delphos AI

// Função para garantir que o volume esteja sempre configurado corretamente
function ensureVolumeSettings() {
    // Verificar se o sistema de síntese está disponível
    if (window.speechSynthesis) {
        console.log('🔊 Aplicando correções de volume...');
        
        // Forçar carregamento de vozes
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            console.log('⏳ Aguardando carregamento de vozes...');
            window.speechSynthesis.addEventListener('voiceschanged', ensureVolumeSettings);
            return;
        }
        
        console.log(`✅ ${voices.length} vozes disponíveis`);
        
        // Verificar vozes PT-BR
        const ptBRVoices = voices.filter(v => v.lang.includes('pt-BR'));
        console.log(`🇧🇷 ${ptBRVoices.length} vozes PT-BR encontradas:`, 
            ptBRVoices.map(v => ({ name: v.name, default: v.default }))
        );
    }
    
    // Patch para a classe DelphosVoiceSystem se ela existir
    if (typeof DelphosVoiceSystem !== 'undefined') {
        console.log('🔧 Aplicando patch no DelphosVoiceSystem...');
        
        // Salvar referência do método original
        const originalSpeak = DelphosVoiceSystem.prototype.speak;
        
        // Sobrescrever o método speak
        DelphosVoiceSystem.prototype.speak = async function(text, isUnrestricted = false) {
            console.log('🎯 [PATCH] Interceptando speak:', {
                text: text.substring(0, 50) + '...',
                isUnrestricted,
                ttsMode: this.ttsMode,
                voiceMode: this.voiceMode
            });
            
            // Se for TTS nativo e modo normal, garantir volume máximo
            if (this.ttsMode === 'native' && !isUnrestricted) {
                console.log('📢 [PATCH] Forçando configurações de volume para voz normal');
                
                // Criar uma função wrapper para processar utterances
                const processUtteranceWithVolume = (utterance) => {
                    // Garantir volume máximo
                    utterance.volume = 1.0;
                    
                    // Log detalhado
                    console.log('🔊 [PATCH] Configurações da utterance:', {
                        volume: utterance.volume,
                        pitch: utterance.pitch,
                        rate: utterance.rate,
                        voice: utterance.voice?.name || 'Padrão',
                        lang: utterance.lang
                    });
                    
                    // Adicionar listener para debug
                    const originalOnStart = utterance.onstart;
                    utterance.onstart = (event) => {
                        console.log('🎤 [PATCH] Utterance iniciada com volume:', utterance.volume);
                        if (originalOnStart) originalOnStart(event);
                    };
                    
                    return utterance;
                };
                
                // Salvar referência do processUtteranceQueue original
                const originalProcessQueue = this.processUtteranceQueue;
                
                // Temporariamente sobrescrever processUtteranceQueue
                this.processUtteranceQueue = function() {
                    console.log('🔄 [PATCH] Processando fila com correção de volume');
                    
                    // Verificar e corrigir volume de todas as utterances na fila
                    this.utteranceQueue = this.utteranceQueue.map(processUtteranceWithVolume);
                    
                    // Chamar método original
                    originalProcessQueue.call(this);
                };
            }
            
            // Chamar método original
            return originalSpeak.call(this, text, isUnrestricted);
        };
        
        console.log('✅ Patch aplicado com sucesso');
    }
    
    // Verificar configurações do Eleven Labs
    if (typeof ElevenLabsTTS !== 'undefined' || typeof ElevenLabsEnhanced !== 'undefined') {
        console.log('🔍 Verificando configuração do Eleven Labs...');
        
        const apiKey = localStorage.getItem('elevenlabs_api_key');
        if (apiKey) {
            console.log('✅ API Key do Eleven Labs encontrada');
            
            // Verificar se está usando a voz correta
            if (window.voiceSystem && window.voiceSystem.elevenLabsTTS) {
                const elevenLabs = window.voiceSystem.elevenLabsTTS;
                console.log('🎯 Configuração atual do Eleven Labs:', {
                    normalVoiceId: elevenLabs.voiceIds?.normal,
                    demonicVoiceId: elevenLabs.voiceIds?.demonic,
                    modelId: elevenLabs.modelId
                });
            }
        } else {
            console.log('⚠️ API Key do Eleven Labs não encontrada');
        }
    }
    
    // Adicionar botão de teste de volume
    addVolumeTestButton();
}

// Adicionar botão de teste na interface
function addVolumeTestButton() {
    // Verificar se já existe
    if (document.getElementById('volume-test-btn')) return;
    
    // Procurar container de controles
    const controlsContainer = document.querySelector('.voice-controls') || 
                           document.querySelector('.controls-section') ||
                           document.querySelector('.top-controls');
    
    if (controlsContainer) {
        console.log('📌 Adicionando botão de teste de volume...');
        
        const testBtn = document.createElement('button');
        testBtn.id = 'volume-test-btn';
        testBtn.className = 'control-btn';
        testBtn.innerHTML = '🔊 Testar Volume';
        testBtn.title = 'Testar volume da voz';
        
        testBtn.addEventListener('click', () => {
            testVoiceVolume();
        });
        
        controlsContainer.appendChild(testBtn);
        
        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            #volume-test-btn {
                background: #ff9800;
                color: white;
                border: none;
                padding: 8px 16px;
                margin: 0 5px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }
            #volume-test-btn:hover {
                background: #f57c00;
                transform: translateY(-2px);
            }
            #volume-test-btn:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
}

// Função de teste de volume
function testVoiceVolume() {
    console.log('🧪 Iniciando teste de volume...');
    
    const testPhrases = [
        "Teste de volume nível 1 - Volume baixo",
        "Teste de volume nível 2 - Volume médio",
        "Teste de volume nível 3 - Volume alto"
    ];
    
    const volumes = [0.3, 0.7, 1.0];
    
    // Cancelar qualquer fala em andamento
    window.speechSynthesis.cancel();
    
    let index = 0;
    
    function speakNext() {
        if (index >= testPhrases.length) {
            console.log('✅ Teste de volume concluído');
            
            // Testar com o sistema Delphos se disponível
            if (window.voiceSystem) {
                console.log('🎯 Testando com sistema Delphos...');
                setTimeout(() => {
                    window.voiceSystem.speak("Este é um teste final com o sistema Delphos em modo normal", false);
                }, 1000);
            }
            return;
        }
        
        const text = testPhrases[index];
        const volume = volumes[index];
        
        console.log(`🔊 Teste ${index + 1}: Volume ${volume}`);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = volume;
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
            index++;
            setTimeout(speakNext, 500);
        };
        
        utterance.onerror = (event) => {
            console.error('❌ Erro no teste:', event.error);
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    speakNext();
}

// Função para verificar e corrigir problemas de áudio do sistema
function checkSystemAudioIssues() {
    console.log('🔍 Verificando problemas de áudio do sistema...');
    
    // Verificar se o áudio está mutado
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
                console.log('🔊 Dispositivos de saída de áudio:', audioOutputs);
                
                if (audioOutputs.length === 0) {
                    console.error('❌ Nenhum dispositivo de saída de áudio encontrado!');
                    alert('Nenhum dispositivo de saída de áudio foi detectado. Verifique suas configurações de som.');
                }
            })
            .catch(err => {
                console.error('❌ Erro ao enumerar dispositivos:', err);
            });
    }
    
    // Criar um teste de áudio simples
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Tom de teste muito breve
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        
        console.log('✅ AudioContext funcionando corretamente');
    } catch (error) {
        console.error('❌ Erro ao testar AudioContext:', error);
    }
}

// Executar correções quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Aplicando correções de volume da voz...');
        ensureVolumeSettings();
        checkSystemAudioIssues();
    });
} else {
    console.log('🚀 Aplicando correções de volume da voz (documento já carregado)...');
    ensureVolumeSettings();
    checkSystemAudioIssues();
}

// Exportar funções para uso global
window.delphosVoiceFix = {
    ensureVolumeSettings,
    testVoiceVolume,
    checkSystemAudioIssues
};