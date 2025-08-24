# Guia de Troubleshooting - Eleven Labs TTS

## Resumo das Mudanças Implementadas

### 1. **Novo Sistema Aprimorado (`elevenlabs-enhanced.js`)**
- Melhor tratamento de erros com mensagens específicas
- Suporte para API de speech-to-speech
- Validação automática da API Key
- Log detalhado para debug
- Cache inteligente de áudio

### 2. **Arquivo de Debug (`test-elevenlabs-debug.html`)**
- Interface completa para testar a API
- Verificação de status da conta
- Teste de diferentes configurações
- Log exportável

### 3. **Melhorias no Sistema de Voz**
- Fallback automático para TTS nativo
- Detecção de erros específicos (401, 429, etc)
- Retry automático em caso de rate limit

## Como Debugar o Problema

### Passo 1: Verificar a API Key
1. Abra o arquivo `test-elevenlabs-debug.html` no navegador
2. Cole sua API Key da Eleven Labs
3. Clique em "Verificar Status"
4. Verifique se aparecem informações da conta

### Passo 2: Testar TTS Básico
1. No arquivo de debug, clique em "Testar TTS"
2. Observe o log para mensagens de erro
3. Se houver erro 401: API Key inválida
4. Se houver erro 403: Problema de permissões
5. Se houver erro 429: Rate limit excedido

### Passo 3: Verificar Permissões da API Key
No painel da Eleven Labs:
1. Acesse https://elevenlabs.io/api-keys
2. Verifique se sua key tem permissões para:
   - Text-to-speech
   - Speech-to-speech (se quiser usar)
   - Voice cloning (opcional)

### Passo 4: Testar no Sistema Principal
1. Abra o `index.html`
2. Configure a API Key no painel DM
3. Selecione "Eleven Labs" no sistema TTS
4. Digite uma mensagem e veja se funciona

## Possíveis Problemas e Soluções

### Problema 1: "API Key inválida"
**Solução:**
- Gere uma nova API Key no site da Eleven Labs
- Certifique-se de copiar a key completa
- Verifique se não há espaços extras

### Problema 2: "Rate limit excedido"
**Solução:**
- Aguarde alguns minutos
- Verifique seu limite de caracteres na conta
- Considere fazer upgrade do plano

### Problema 3: "Sem som mas sem erros"
**Solução:**
- Verifique o volume do navegador
- Teste com TTS nativo primeiro
- Verifique permissões de áudio do navegador

### Problema 4: "CORS Error"
**Solução:**
- Use a aplicação através de um servidor HTTP (não file://)
- Use o comando: `python -m http.server 8000`
- Acesse: http://localhost:8000

## API Speech-to-Speech

A API de speech-to-speech permite converter áudio em áudio com diferentes vozes.

### Como Usar:
1. No arquivo de debug, grave ou faça upload de um áudio
2. Selecione a voz desejada
3. Clique em "Testar Speech-to-Speech"

### Requisitos:
- API Key com permissões para speech-to-speech
- Formato de áudio: MP3, WAV, M4A, etc
- Tamanho máximo: 10MB

### Exemplo de Código:
```javascript
const elevenLabs = new ElevenLabsEnhanced(apiKey);

// Converter arquivo de áudio
const result = await elevenLabs.speechToSpeech(audioFile, {
    voiceId: 'voice_id_aqui',
    removeBackgroundNoise: true
});

// Reproduzir resultado
await elevenLabs.playAudio(result.audioUrl);
```

## Configuração Recomendada

Para melhor qualidade em PT-BR:
- Modelo: `eleven_multilingual_v2`
- Stability: 0.5
- Similarity: 0.75
- Style: 0.3
- Speaker Boost: ON

## Links Úteis

- [Documentação Eleven Labs](https://docs.elevenlabs.io/)
- [Painel de Controle](https://elevenlabs.io/)
- [Status da API](https://status.elevenlabs.io/)

## Comandos de Console para Debug

Abra o console do navegador (F12) e teste:

```javascript
// Verificar se o sistema está carregado
console.log(window.ElevenLabsEnhanced);

// Testar API diretamente
const tts = new ElevenLabsEnhanced('sua_api_key_aqui');
const validation = await tts.validateApiKey();
console.log(validation);

// Testar TTS simples
const result = await tts.textToSpeech('Teste de áudio');
await tts.playAudio(result.audioUrl);
```

## Suporte

Se o problema persistir após seguir este guia:
1. Exporte o log do arquivo de debug
2. Verifique o console do navegador para erros
3. Entre em contato com o suporte da Eleven Labs
4. Considere usar o TTS nativo como fallback temporário