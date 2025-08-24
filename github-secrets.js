/**
 * Gerenciador de Secrets do GitHub
 * Este arquivo gerencia o acesso aos secrets configurados no repositório
 */

class GitHubSecretsManager {
    constructor() {
        // URL base para acessar os secrets via GitHub Pages
        this.secretsEndpoint = window.location.hostname === 'localhost' 
            ? '/api/secrets' // Para desenvolvimento local
            : `${window.location.origin}/api/secrets`; // Para produção
        
        this.cachedSecrets = null;
        this.cacheExpiry = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Busca os secrets do GitHub
     * Os secrets devem estar disponíveis através de um endpoint configurado no GitHub Actions
     */
    async getSecrets() {
        // Verifica cache
        if (this.cachedSecrets && this.cacheExpiry && Date.now() < this.cacheExpiry) {
            return this.cachedSecrets;
        }

        try {
            // Para GitHub Pages, os secrets são injetados durante o build
            // Vamos usar variáveis globais que serão definidas pelo GitHub Actions
            if (window.GITHUB_SECRETS) {
                this.cachedSecrets = {
                    OPENAI_API_KEY: window.GITHUB_SECRETS.OPENAI_API_KEY,
                    ELEVENLABS_API_KEY: window.GITHUB_SECRETS.ELEVENLABS_API_KEY
                };
                this.cacheExpiry = Date.now() + this.cacheTimeout;
                return this.cachedSecrets;
            }

            // Fallback para localStorage durante desenvolvimento
            const localSecrets = {
                OPENAI_API_KEY: localStorage.getItem('openai_api_key') || '',
                ELEVENLABS_API_KEY: localStorage.getItem('elevenlabs_api_key') || ''
            };

            if (localSecrets.OPENAI_API_KEY || localSecrets.ELEVENLABS_API_KEY) {
                console.warn('Usando secrets do localStorage. Em produção, os secrets devem vir do GitHub.');
                return localSecrets;
            }

            throw new Error('Secrets não encontrados');
        } catch (error) {
            console.error('Erro ao buscar secrets:', error);
            throw error;
        }
    }

    /**
     * Retorna a API key da OpenAI
     */
    async getOpenAIKey() {
        const secrets = await this.getSecrets();
        return secrets.OPENAI_API_KEY;
    }

    /**
     * Retorna a API key do Eleven Labs
     */
    async getElevenLabsKey() {
        const secrets = await this.getSecrets();
        return secrets.ELEVENLABS_API_KEY;
    }

    /**
     * Verifica se os secrets estão disponíveis
     */
    async areSecretsAvailable() {
        try {
            const secrets = await this.getSecrets();
            return !!(secrets.OPENAI_API_KEY && secrets.ELEVENLABS_API_KEY);
        } catch {
            return false;
        }
    }

    /**
     * Limpa o cache dos secrets
     */
    clearCache() {
        this.cachedSecrets = null;
        this.cacheExpiry = null;
    }
}

// Exporta uma instância única
const secretsManager = new GitHubSecretsManager();

// Para compatibilidade com módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = secretsManager;
}