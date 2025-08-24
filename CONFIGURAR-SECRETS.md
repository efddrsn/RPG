# Configuração de Secrets no GitHub

Este documento explica como configurar os secrets necessários para o deploy automático do projeto.

## Secrets Necessários

O projeto requer os seguintes secrets:

1. **OPENAI_API_KEY** - Chave de API da OpenAI
2. **ELEVENLABS_API_KEY** - Chave de API do Eleven Labs

## Como Configurar os Secrets

1. Acesse as configurações do seu repositório no GitHub
2. No menu lateral, clique em **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret:
   - Nome: `OPENAI_API_KEY`
   - Valor: Sua chave de API da OpenAI
   
   - Nome: `ELEVENLABS_API_KEY`
   - Valor: Sua chave de API do Eleven Labs

## Verificando a Configuração

Após configurar os secrets:

1. Faça um commit e push para a branch `main` ou `master`
2. Acesse a aba **Actions** do repositório
3. Verifique se o workflow "Deploy with Secrets" foi executado com sucesso

## Desenvolvimento Local

Durante o desenvolvimento local, as chaves de API são obtidas do localStorage. Para configurá-las:

```javascript
// No console do navegador:
localStorage.setItem('openai_api_key', 'sua-chave-aqui');
localStorage.setItem('elevenlabs_api_key', 'sua-chave-aqui');
```

## Segurança

- **NUNCA** commite chaves de API reais no código
- Os secrets são injetados automaticamente durante o deploy
- O arquivo `secrets-config.js` sempre deve conter apenas placeholders no repositório
- Use o `.gitignore` para evitar commits acidentais de arquivos com secrets

## Troubleshooting

### Logs do GitHub Actions

**Importante**: O GitHub mascara automaticamente os valores dos secrets nos logs. Se você vir `***` nos logs, isso é normal e indica que o secret foi reconhecido e está sendo protegido. O workflow agora mostra o número de caracteres do secret para confirmar que foi carregado corretamente.

### Erro: "Placeholders não foram substituídos completamente"

Este erro indica que os secrets não foram configurados corretamente no GitHub. Verifique:

1. Se os nomes dos secrets estão corretos (OPENAI_API_KEY e ELEVENLABS_API_KEY)
2. Se os valores não estão vazios
3. Se não há caracteres especiais problemáticos nos valores

### Erro: "OPENAI_API_KEY não está definida"

Este erro indica que o secret OPENAI_API_KEY não foi configurado no repositório.

### Erro: "ELEVENLABS_API_KEY não está definida"

Este erro indica que o secret ELEVENLABS_API_KEY não foi configurado no repositório.