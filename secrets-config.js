/**
 * Arquivo de configuração de secrets
 * Este arquivo será substituído pelo GitHub Actions durante o deploy
 * 
 * NÃO COLOQUE SECRETS REAIS AQUI!
 */

// Este objeto será preenchido automaticamente pelo GitHub Actions
window.GITHUB_SECRETS = {
    OPENAI_API_KEY: '{{OPENAI_API_KEY}}',
    ELEVENLABS_API_KEY: '{{ELEVENLABS_API_KEY}}'
};

// Validação para garantir que os secrets foram injetados
if (window.GITHUB_SECRETS.OPENAI_API_KEY.includes('{{') || 
    window.GITHUB_SECRETS.ELEVENLABS_API_KEY.includes('{{')) {
    console.warn('Secrets não foram injetados pelo GitHub Actions. Usando modo de desenvolvimento.');
    // Remove o objeto se não foi configurado corretamente
    delete window.GITHUB_SECRETS;
}