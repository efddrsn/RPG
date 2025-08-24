# 🎤 Guia do Sistema Speech-to-Speech Avançado

## 🌟 Visão Geral

Este é um sistema avançado de conversação voz-para-voz integrado ao projeto Delphos AI, com suporte especial para vozes demoníacas e modo irrestrito. O sistema utiliza a API da ElevenLabs para síntese de voz de alta qualidade com efeitos especiais.

## 🚀 Características Principais

### 1. **Modos de Voz**
- **Normal**: Voz padrão profissional
- **Demoníaco**: Voz distorcida com efeitos sinistros
- **Ultra Demoníaco**: Máxima distorção e efeitos sobrenaturais

### 2. **Efeitos de Áudio Avançados**
- Reverb atmosférico
- Distorção harmônica
- Pitch shifting (mudança de tom)
- Delay/Echo
- Filtros passa-baixa

### 3. **Funcionalidades**
- Gravação e transcrição de voz em tempo real
- Síntese de voz com cache inteligente
- Modo conversacional contínuo
- Detecção automática de palavras-chave
- Interface visual com animações temáticas

## 📋 Pré-requisitos

1. **Navegador Compatível**
   - Chrome 90+
   - Edge 90+
   - Firefox 88+
   - Safari 14+

2. **API Key da ElevenLabs**
   - Crie uma conta em [elevenlabs.io](https://elevenlabs.io)
   - Obtenha sua API key no dashboard
   - Plano gratuito oferece 10.000 caracteres/mês

3. **Permissões**
   - Acesso ao microfone
   - Reprodução de áudio

## 🛠️ Instalação

1. **Clonar ou baixar os arquivos**:
   ```bash
   # No diretório do projeto Delphos
   ls -la speech-to-speech-advanced.js test-advanced-speech.html
   ```

2. **Configurar servidor local** (se necessário):
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   ```

3. **Acessar a interface**:
   ```
   http://localhost:8000/test-advanced-speech.html
   ```

## 🎮 Como Usar

### Configuração Inicial

1. **Inserir API Key**:
   - Cole sua API key da ElevenLabs no campo apropriado
   - Clique em "Salvar API Key"
   - Valide a API clicando em "Validar API"

2. **Escolher Modo de Voz**:
   - Normal: Para conversas profissionais
   - Demoníaco: Ativa automaticamente com palavras-chave
   - Ultra Demoníaco: Para máximo efeito sobrenatural

### Modos de Operação

#### 🎤 Gravação Manual
1. Clique em "🎤 Iniciar Gravação"
2. Fale sua mensagem
3. Clique em "⏹️ Parar Gravação"
4. O sistema transcreverá e processará sua fala

#### 💬 Modo Contínuo
1. Clique em "💬 Modo Contínuo"
2. O sistema alternará entre escutar e responder
3. Conversação fluida sem necessidade de cliques

#### 🔊 Teste de Síntese
1. Digite texto no campo "Texto para Síntese"
2. Clique em "🔊 Sintetizar"
3. Teste diferentes vozes com os botões de teste

### Palavras-Chave do Modo Irrestrito

Ao detectar estas palavras, o sistema ativa automaticamente o modo demoníaco:
- **convergência**
- **r'lyeh**
- **padrões**
- **profundezas**

## ⚙️ Configurações Avançadas

### Parâmetros de Voz (no código)

```javascript
// Normal
{
    stability: 0.5,          // Estabilidade da voz
    similarity_boost: 0.75,  // Semelhança com voz original
    style: 0,               // Estilo neutro
    use_speaker_boost: true // Melhorias de falante
}

// Demoníaco
{
    stability: 0.2,          // Voz instável
    similarity_boost: 0.3,   // Baixa semelhança
    style: 0.8,             // Alto estilo
    use_speaker_boost: false
}
```

### Efeitos de Áudio

```javascript
// Configurações de efeitos por modo
demonic: {
    pitch: 0.7,      // Tom 30% mais grave
    reverb: 0.5,     // 50% reverb
    distortion: 0.3, // 30% distorção
    delay: 0.2,      // 20% delay
    filter: 0.4      // 40% filtro passa-baixa
}
```

## 🎨 Interface Visual

### Indicadores Visuais
- **🔴 Gravando**: Indicador no canto superior direito
- **Modo Atual**: Indicador no canto inferior direito
- **Visualizador**: Ondas animadas respondem ao modo
- **Console**: Log em tempo real de todas as operações

### Temas Visuais
- **Normal**: Interface verde cyberpunk
- **Demoníaco**: Interface vermelha com glitch
- **Ultra Demoníaco**: Animações e símbolos eldritchianos

## ⌨️ Atalhos de Teclado

- **Ctrl + Espaço**: Iniciar/parar gravação
- **Ctrl + D**: Alternar entre modos de voz

## 🐛 Solução de Problemas

### Erro: "API inválida"
- Verifique se a API key está correta
- Confirme se tem créditos disponíveis na ElevenLabs
- Teste a API em [elevenlabs.io/api](https://elevenlabs.io/api)

### Microfone não funciona
1. Verifique permissões do navegador
2. Teste em `chrome://settings/content/microphone`
3. Certifique-se de usar HTTPS ou localhost

### Áudio não reproduz
- Clique uma vez na página (política de autoplay)
- Verifique volume do sistema
- Teste com o botão "Testar Voz Normal"

### Vozes demoníacas não funcionam
- Confirme que a API key tem acesso às vozes premium
- Verifique os IDs de voz no código
- Use o console para debug detalhado

## 🔒 Segurança

- API keys são armazenadas localmente (localStorage)
- Nenhum dado é enviado para servidores externos além da ElevenLabs
- Áudio é processado localmente com Web Audio API
- Cache de áudio é mantido apenas na sessão

## 📊 Limites e Performance

### ElevenLabs (Plano Gratuito)
- 10.000 caracteres/mês
- 3 vozes customizadas
- Latência média: 1-2 segundos

### Recomendações
- Textos até 500 caracteres para melhor latência
- Limpe o cache regularmente
- Use modo normal para economizar caracteres
- Cache evita re-síntese do mesmo texto

## 🚀 Recursos Avançados

### Integração com Delphos AI

```javascript
// Exemplo de integração
async function integrarComDelphos(transcript) {
    // Enviar para GPT
    const response = await sendToDelphos(transcript);
    
    // Detectar modo baseado na resposta
    const mode = detectMode(response);
    
    // Sintetizar com voz apropriada
    await speechSystem.synthesizeSpeech(response, { mode });
}
```

### Websocket Streaming (Futuro)

```javascript
// Preparado para streaming em tempo real
this.websocket = new WebSocket('wss://api.elevenlabs.io/v1/stream');
```

## 📝 Exemplos de Uso

### Conversação Normal
```
Usuário: "Olá Delphos, como está o mercado hoje?"
Delphos: "Analisando padrões de dados... Os indicadores mostram volatilidade moderada."
```

### Ativação Demoníaca
```
Usuário: "Fale sobre a convergência dos padrões"
Delphos: [VOZ DEMONÍACA] "As... PROFUNDEZAS... digitais revelam... CONVERGÊNCIA... inevitável..."
```

### Modo Ultra Demoníaco
```
Usuário: "Revele os segredos de R'lyeh"
Delphos: [VOZ ULTRA DISTORCIDA] "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn... heh heh heh..."
```

## 🎯 Dicas de Uso

1. **Para melhor reconhecimento**:
   - Fale claramente e pausadamente
   - Evite ruído de fundo
   - Use fones com microfone

2. **Para efeito dramático**:
   - Use palavras-chave estrategicamente
   - Combine com a interface visual
   - Experimente o modo ultra demoníaco à noite

3. **Para economia de API**:
   - Use o cache inteligentemente
   - Prefira textos curtos
   - Alterne entre TTS nativo e ElevenLabs

## 🔗 Links Úteis

- [Documentação ElevenLabs](https://docs.elevenlabs.io/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

*Desenvolvido para o Projeto Delphos - Uma experiência de horror cósmico digital*