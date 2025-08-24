# Guia de Solução - Permissões do Microfone

## Erro: "The request is not allowed by the user agent or the platform in the current context"

Este erro ocorre quando o navegador bloqueia o acesso ao microfone. Aqui estão as soluções:

## 🔧 Soluções Rápidas

### 1. Use o Botão de Permissão
1. Abra a página: https://efddrsn.github.io/RPG/test-advanced-speech
2. Configure sua API Key da ElevenLabs
3. **Clique em "🎤 Solicitar Permissão do Microfone"**
4. Quando o navegador perguntar, clique em **"Permitir"**

### 2. Verifique o Status do Sistema
1. Clique em "🔍 Verificar Status do Sistema"
2. Verifique se:
   - **Contexto Seguro**: Deve mostrar "Seguro ✓"
   - **Permissão do Microfone**: Deve mostrar "Permitido ✓"

## 📋 Verificações Importantes

### Contexto Seguro (HTTPS)
O GitHub Pages usa HTTPS por padrão, então isso não deve ser um problema. Mas verifique se:
- A URL começa com `https://`
- Não há avisos de segurança no navegador

### Permissões do Navegador

#### Chrome/Edge:
1. Clique no ícone de **cadeado** na barra de endereço
2. Encontre "Microfone"
3. Selecione **"Permitir"**
4. Recarregue a página

#### Firefox:
1. Clique no ícone de **cadeado** na barra de endereço
2. Clique em ">" ao lado de "Permissões"
3. Encontre "Usar o Microfone"
4. Desmarque "Usar padrão" e selecione **"Permitir"**
5. Recarregue a página

#### Safari:
1. Vá em Safari > Preferências > Sites
2. Selecione "Microfone" na barra lateral
3. Encontre o site e selecione **"Permitir"**

## 🚫 Problemas Comuns

### 1. Microfone Bloqueado Globalmente
Se você bloqueou o microfone para todos os sites:

**Chrome**: `chrome://settings/content/microphone`
**Edge**: `edge://settings/content/microphone`
**Firefox**: `about:preferences#privacy` (role até "Permissões")

### 2. Microfone em Uso
- Feche outros aplicativos que possam estar usando o microfone
- Verifique se há outras abas do navegador usando o microfone

### 3. Extensões do Navegador
Algumas extensões de privacidade podem bloquear o acesso ao microfone:
- Desative temporariamente extensões de privacidade
- Teste em uma janela anônima/privada

## 🎯 Fluxo Recomendado

1. **Primeiro Acesso**:
   ```
   1. Abra a página
   2. Configure a API Key
   3. Clique em "Solicitar Permissão do Microfone"
   4. Permita quando solicitado
   5. Clique em "Verificar Status do Sistema"
   6. Confirme que tudo está ✓
   7. Use normalmente
   ```

2. **Se o Erro Persistir**:
   ```
   1. Recarregue a página (F5)
   2. Limpe as permissões do site (ícone de cadeado)
   3. Tente novamente o processo acima
   ```

## 💡 Dicas Adicionais

1. **Teste o Microfone**: Use outro site (como Google Meet) para verificar se o microfone funciona
2. **Console do Navegador**: Pressione F12 e veja se há erros adicionais
3. **Modo Privado**: Teste em uma janela anônima para descartar problemas de cache

## 🆘 Se Nada Funcionar

1. Tente outro navegador (Chrome, Edge, Firefox)
2. Verifique as configurações de privacidade do sistema operacional:
   - **Windows**: Configurações > Privacidade > Microfone
   - **macOS**: Preferências do Sistema > Segurança e Privacidade > Microfone
   - **Linux**: Verifique as configurações de áudio do sistema

## 📝 Logs Úteis

Quando reportar o problema, inclua:
1. O navegador e versão
2. O sistema operacional
3. Screenshot do "Status do Sistema"
4. Mensagens do console (F12)

## ✅ Confirmação de Funcionamento

Quando tudo estiver correto, você verá:
- Status do Sistema: **Inicializado ✓**
- Contexto Seguro: **Seguro ✓**
- Permissão do Microfone: **Permitido ✓**
- API ElevenLabs: **Conectada ✓**

E poderá usar o sistema normalmente com o botão "Iniciar Conversa"!