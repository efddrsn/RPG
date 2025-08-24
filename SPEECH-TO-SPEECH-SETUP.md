# Configuração do Speech-to-Speech da Eleven Labs

## Visão Geral

Este projeto usa exclusivamente a API Speech-to-Speech da Eleven Labs, que processa áudio diretamente (voz para voz) sem necessidade de transcrição intermediária.

## Configuração dos Secrets

### GitHub Actions

Os secrets são configurados no repositório do GitHub e injetados automaticamente durante o deploy:

1. Vá para Settings > Secrets and variables > Actions
2. Adicione os seguintes secrets:
   - `OPENAI_API_KEY`: Sua chave da API OpenAI
   - `ELEVENLABS_API_KEY`: Sua chave da API Eleven Labs

### Deploy Automático

O GitHub Actions irá:
1. Substituir os placeholders em `secrets-config.js`
2. Fazer deploy para GitHub Pages com os secrets injetados

## Como Usar

### Interface Principal (index.html)

1. Clique no botão 🎙️ para iniciar gravação
2. Fale sua mensagem
3. Clique em ⏹️ para parar e processar
4. O sistema enviará o áudio para a API Speech-to-Speech
5. A resposta será reproduzida automaticamente

### Modo de Teste (test-continuous-mode.html)

1. Acesse `/test-continuous-mode.html`
2. O botão central alterna entre gravar/parar
3. Visual feedback durante processamento

## Arquitetura

### Arquivos Principais

- `elevenlabs-speech-to-speech.js`: Implementação pura do Speech-to-Speech
- `elevenlabs-enhanced.js`: Funcionalidades adicionais da API
- `github-secrets.js`: Gerenciador de secrets
- `secrets-config.js`: Placeholder para secrets (substituído no deploy)

### Fluxo de Dados

1. **Captura de Áudio**: MediaRecorder API captura áudio do microfone
2. **Envio**: Áudio enviado diretamente para Eleven Labs Speech-to-Speech
3. **Resposta**: API retorna áudio processado
4. **Reprodução**: Áudio reproduzido automaticamente

## Troubleshooting

### Erro de API Key

Se receber erro de API key:
1. Verifique se os secrets estão configurados no GitHub
2. Em desenvolvimento local, use o painel DM para configurar

### Erro de Microfone

1. Certifique-se de estar em HTTPS ou localhost
2. Permita acesso ao microfone quando solicitado
3. Verifique configurações do navegador

### Sem Resposta de Áudio

1. Verifique o console para erros
2. Confirme que a API key do Eleven Labs é válida
3. Teste em `/test-continuous-mode.html` para debug

## Limitações

- Requer conexão com internet
- Latência depende da velocidade da conexão
- Suporta apenas formatos de áudio compatíveis com MediaRecorder