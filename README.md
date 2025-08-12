# 🎭 CLIPNINJA.AI - Seu Estúdio de Edição de Vídeos Virais com IA

![ClipNinja.AI Banner](https://clipninja.ai/banner.png) <!-- Substitua com um banner real do projeto -->

Bem-vindo ao **ClipNinja.AI**! Esta é uma ferramenta poderosa que utiliza Inteligência Artificial para transformar vídeos brutos em clipes curtos e virais, otimizados para diversas plataformas de redes sociais como TikTok, Instagram Reels, YouTube Shorts e Kwai.

Com o ClipNinja.AI, você pode:
- **Detectar Momentos Virais:** A IA analisa seu vídeo e identifica os trechos com maior potencial de engajamento.
- **Sincronizar com Batidas Musicais (Beat Sync):** Gere clipes que pulsam no ritmo da sua trilha sonora, prendendo a atenção do público.
- **Otimizar para Multi-plataformas:** Formate seu conteúdo automaticamente para as especificações ideais de cada rede social (proporção, duração, qualidade).
- **Gerar Legendas Inteligentes:** Adicione legendas precisas em vários idiomas (Português, Inglês, Espanhol) de forma automática.
- **Agendamento Inteligente (Auto-Scheduler):** Receba recomendações dos melhores horários para postar em cada plataforma, maximizando seu alcance.

--- 

## 🚀 Funcionalidades Principais

- **Backend (Node.js/Express):** Gerencia uploads, processamento de vídeo com FFmpeg e interação com APIs de IA.
- **Frontend (HTML/CSS/JavaScript):** Interface de usuário intuitiva para upload e visualização de resultados.
- **Serviços de IA:**
    - `ViralDetectorService`: Utiliza OpenAI (GPT-4 Vision/Whisper) para identificar picos de emoção e ação.
    - `BeatSyncService`: Analisa trilhas de áudio para sincronizar cortes de vídeo.
    - `VideoProcessorService`: Otimiza vídeos para diferentes aspect ratios e qualidades (FFmpeg).
    - `SubtitleService`: Gera e queima legendas com base em transcrição de áudio.
    - `AutoSchedulerService`: Recomenda horários de postagem ideais baseados em dados de engajamento por plataforma.
- **Docker & Docker Compose:** Para um ambiente de desenvolvimento e deploy consistente e isolado.
- **GitHub Actions:** Para automação de CI/CD (integração contínua e deploy contínuo).
- **Supabase (Plano Futuro):** Armazenamento de dados e autenticação (atualmente mockado/simulado para testes iniciais).

--- 

## 🛠️ Configuração e Instalação (Local)

Siga estes passos para configurar e rodar o ClipNinja.AI na sua máquina local.

### Pré-requisitos

Certifique-se de ter o seguinte instalado:
- **Node.js** (versão 18 ou superior)
- **npm** (gerenciador de pacotes do Node.js)
- **FFmpeg**: Uma ferramenta essencial para processamento de vídeo. Baixe e instale-o e certifique-se de que ele está no seu `PATH`.
  - [Download FFmpeg](https://ffmpeg.org/download.html)
- **Git**

### 1. Clone o Repositório

```bash
git clone https://github.com/alanvandamme/-CLIPNINJA.AI.git
cd -CLIPNINJA.AI
```

### 2. Variáveis de Ambiente (`.env`)

Crie um arquivo chamado `.env` na raiz do seu projeto. Este arquivo irá armazenar suas chaves de API e outras configurações sensíveis. Substitua os placeholders com suas informações reais:

```env
# Chaves de API
OPENAI_API_KEY="SEU_OPENAI_API_KEY_AQUI"

# Supabase (para futuro uso ou se já tiver)
SUPABASE_URL="SUA_URL_SUPABASE_AQUI"
SUPABASE_KEY="SUA_CHAVE_SUPABASE_AQUI"

# Configurações do Servidor
PORT=3000
NODE_ENV=development # ou production

# URL do Frontend (se estiver rodando em um domínio diferente em prod)
FRONTEND_URL="http://localhost:3000"

# Cloudinary (para armazenamento de arquivos grandes, se for usar)
CLOUDINARY_CLOUD_NAME="SEU_CLOUD_NAME"
CLOUDINARY_API_KEY="SEU_API_KEY"
CLOUDINARY_API_SECRET="SEU_API_SECRET"

# JWT Secret (para autenticação de usuários, se implementar)
JWT_SECRET="sua_chave_secreta_jwt_bem_forte_e_aleatoria"

# Outros
TEMP_FILES_DIR="./uploads" # Diretório temporário para uploads
PROCESSED_CLIPS_DIR="./processed_clips" # Diretório para clipes gerados
```

-   **`OPENAI_API_KEY`**: Essencial para os serviços de IA (detecção viral, transcrição de legendas).
-   **`SUPABASE_URL` e `SUPABASE_KEY`**: Se você pretende integrar com um banco de dados Supabase para usuários, armazenamento de clipes, etc. Para testes iniciais, você pode deixar como placeholders, pois o sistema está usando dados mockados.

### 3. Instale as Dependências

```bash
npm install
```

### 4. Inicie o Servidor

```bash
npm start
# Ou para desenvolvimento com auto-reload:
npm run dev
```

O servidor deve iniciar e você verá uma mensagem no console como:

```
🎭 CLIPNINJA.AI SERVIDOR ATIVO!

🌐 URL: http://localhost:3000
... (outras informações)
```

### 5. Acesse o Frontend

Abra seu navegador e vá para:

[http://localhost:3000](http://localhost:3000)

Você verá a interface do ClipNinja.AI pronta para o upload do seu vídeo!

--- 

## 🐳 Executando com Docker (Opcional, mas Recomendado)

Para um ambiente de execução mais isolado e consistente, você pode usar Docker e Docker Compose.

### Pré-requisitos (para Docker)

- **Docker Desktop** (inclui Docker Engine e Docker Compose)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)

### 1. Build da Imagem Docker

```bash
docker-compose build
```

### 2. Inicie os Serviços Docker

```bash
docker-compose up
# Para rodar em background:
docker-compose up -d
```

O servidor estará acessível em `http://localhost:3000`.

### 3. Parar os Serviços Docker

```bash
docker-compose down
```

--- 

## 🧪 Testes

O projeto utiliza **Playwright** para testes de ponta a ponta.

### Rodar todos os testes

```bash
npm test
```

### Rodar testes específicos

```bash
npx playwright test tests/upload.spec.js
```

--- 

## 🤝 Contribuição

Sinta-se à vontade para contribuir! Faça um fork do repositório, crie sua branch de recurso e envie um Pull Request.

--- 

## 📄 Licença

Este projeto está licenciado sob a licença MIT.

--- 

## 📞 Suporte

Em caso de dúvidas ou problemas, abra uma issue no GitHub ou entre em contato com o time do ClipNinja.AI.

---

*Feito com ❤️ e IA para revolucionar a criação de conteúdo viral.*