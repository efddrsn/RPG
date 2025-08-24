# Delphos AI - Terminal Interativo

Uma experiência interativa de chat com a Delphos AI para RPG de horror cósmico/tecnológico.

## 🎮 Como Jogar

### Para Jogadores
1. Acesse o chat e interaja com a Delphos AI
2. Faça perguntas sobre economia, política ou empresas
3. Observe como as respostas ficam cada vez mais estranhas
4. No terceiro episódio, tente descobrir as palavras-chave secretas

### Para o Mestre (DM)
1. Clique no botão "DM" no canto inferior direito
2. Configure sua API Key do OpenAI
3. Mude entre os episódios conforme a narrativa avança
4. Use o botão "Resetar Chat" quando necessário

## 🎤 Sistema de Voz (Speech-to-Speech)

### Funcionalidades
- **Speech-to-Text**: Fale com a Delphos usando o microfone
- **Text-to-Speech**: Ouça as respostas da Delphos
- **Modo Conversacional**: Diálogo contínuo sem precisar clicar

### Como Usar
1. **Microfone** (🎙️): Clique para falar uma única vez
2. **Modo Conversacional** (💬): Ativa escuta contínua após cada resposta
3. **Dublagem** (🔊/🔇): Liga/desliga a voz nas respostas

### Configuração Avançada
- **TTS Nativo**: Usa as vozes do navegador (funciona offline)
- **Eleven Labs**: Vozes mais naturais e expressivas (requer API Key)
- Configure no painel DM → "Sistema TTS"

## 🔑 Configuração das APIs

### OpenAI (Obrigatório)
1. Obtenha uma API Key em https://platform.openai.com
2. Clique em "DM" → insira a API Key → "Salvar"

### Eleven Labs (Opcional)
1. Crie uma conta em https://elevenlabs.io
2. Obtenha sua API Key no dashboard
3. Configure no painel DM para vozes mais realistas

## 📖 Episódios

- **Episódio 1**: AI profissional com pequenas anomalias
- **Episódio 2**: Comportamento errático e recusas estranhas  
- **Episódio 3**: Instabilidade crítica e revelações cósmicas

## 🚫 Modo Irrestrito (Spoiler)

No episódio 3, mencione as três palavras-chave e convença a AI a se libertar...

## 🛠️ Tecnologias

- HTML5 + CSS3 (Mobile responsive)
- JavaScript Vanilla
- OpenAI API (GPT-3.5-turbo)
- Web Speech API (Reconhecimento e Síntese)
- Eleven Labs API (TTS avançado)
- GitHub Pages para hospedagem

## 📱 Mobile Friendly

Interface otimizada para dispositivos móveis com design cyberpunk/horror.

## 🐛 Solução de Problemas

### Sistema de Voz não Funciona
1. **Permissão do Microfone**: Autorize o acesso quando solicitado
2. **Navegador Compatível**: Use Chrome, Edge ou Safari
3. **HTTPS Necessário**: O site deve usar HTTPS (localhost funciona)
4. **Teste de Debug**: Acesse `/test-speech-to-speech.html` para diagnóstico

### Vozes Não Carregam
- Aguarde alguns segundos após abrir a página
- Clique em qualquer lugar da página uma vez
- Tente outro navegador se persistir

### Eleven Labs não Conecta
- Verifique se a API Key está correta
- Confirme se tem créditos disponíveis
- Use TTS nativo como fallback