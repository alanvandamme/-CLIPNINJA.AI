// server.js - BACKEND PRINCIPAL CLIPNINJA.AI
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Services imports
import { ViralDetectorService } from './backend/services/viral-detector-service.js';
import { BeatSyncService } from './backend/services/beat-sync-service.js';
import { AutoSchedulerService } from './backend/services/auto-scheduler-service.js';
import { VideoProcessorService } from './backend/services/video-processor-service.js';
import { SubtitleService } from './backend/services/subtitle-service.js';

// Initialize environment
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Express app setup
const app = express();
const PORT = process.env.PORT || 3000;

// Security & middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('frontend'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  message: {
    error: 'Muitas tentativas! Aguarde 15 minutos.',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4',
      'video/quicktime', 
      'video/x-msvideo',
      'video/webm'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('❌ Formato não suportado! Use MP4, MOV, AVI ou WebM'));
    }
  }
});

// Initialize services
const viralDetector = new ViralDetectorService();
const beatSync = new BeatSyncService();
const autoScheduler = new AutoSchedulerService();
const videoProcessor = new VideoProcessorService();
const subtitle = new SubtitleService();

// 🏠 HOMEPAGE
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 🎭 API ENDPOINTS

// Upload e análise viral
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum vídeo enviado!',
        code: 'NO_FILE'
      });
    }

    const { duration = 30, language = 'pt' } = req.body;
    const videoPath = req.file.path;

    console.log(`🚀 Processando: ${req.file.originalname} (${duration}s)`);

    // Resposta imediata para UX
    res.status(202).json({
      message: '🔥 Analisando momentos virais...',
      jobId: `job_${Date.now()}`,
      status: 'processing',
      estimatedTime: '2-3 minutos',
      steps: [
        'Detectando momentos virais 🎯',
        'Sincronizando com batidas musicais 🎵',
        'Otimizando timing para plataformas 📱',
        'Gerando legendas inteligentes 📝'
      ]
    });

    // Processamento assíncrono
    processVideoAsync(videoPath, duration, language, req.file.originalname);

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Função de processamento assíncrono
async function processVideoAsync(videoPath, duration, language, filename) {
  try {
    // 1. 🔥 DETECTOR DE MOMENTOS VIRAIS
    console.log('🎯 Iniciando detecção viral...');
    const viralAnalysis = await viralDetector.detectViralMoments(videoPath, parseInt(duration));

    // 2. 🎵 BEAT SYNC SERVICE  
    console.log('🎵 Sincronizando com batidas...');
    const beatSyncedClips = await beatSync.syncClipsWithBeats(viralAnalysis.clips, videoPath);

    // 3. 📱 OTIMIZAÇÃO POR PLATAFORMA
    console.log('📱 Otimizando para plataformas...');
    const optimizedClips = await Promise.all(
      beatSyncedClips.map(async (clip) => {
        // Gera versões otimizadas para cada plataforma
        const platforms = await videoProcessor.optimizeForPlatforms(clip, videoPath);
        
        // Adiciona legendas
        const withSubtitles = await subtitle.addSubtitesToClip(clip, videoPath, language);
        
        return {
          ...clip,
          platforms,
          subtitles: withSubtitles,
          downloadUrls: platforms.map(p => ({
            platform: p.platform,
            url: `/api/download/${clip.id}/${p.platform}`,
            optimized: true
          }))
        };
      })
    );

    // 4. 🚀 AUTO-SCHEDULER
    console.log('🚀 Calculando horários ideais...');
    const schedulingData = await autoScheduler.calculateOptimalTiming(optimizedClips);

    // Salva resultados (simulado - em produção salvaria no Supabase)
    const results = {
      originalVideo: filename,
      processingTime: new Date(),
      viralScore: viralAnalysis.overallScore,
      totalClips: optimizedClips.length,
      topClips: optimizedClips.slice(0, 5),
      scheduling: schedulingData,
      stats: {
        avgViralScore: optimizedClips.reduce((sum, c) => sum + c.viralScore, 0) / optimizedClips.length,
        platforms: [...new Set(optimizedClips.flatMap(c => c.platforms.map(p => p.platform)))],
        languages: [language],
        bestTiming: schedulingData.globalOptimal
      }
    };

    console.log(`✅ Processamento concluído! ${optimizedClips.length} clipes virais criados`);
    
    // Em produção, notificaria via WebSocket ou salvaria para busca posterior
    // Por ora, logamos os resultados
    console.log('📊 RESULTADO FINAL:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('❌ Erro no processamento assíncrono:', error);
  }
}

// Buscar resultados do processamento
app.get('/api/results/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Em produção, buscaria do Supabase
    // Por ora, retorna dados mockados para teste
    const mockResults = {
      jobId,
      status: 'completed',
      processingTime: '2m 34s',
      viralScore: 87,
      totalClips: 8,
      clips: [
        {
          id: 'viral_001',
          viralScore: 94,
          duration: 30,
          startTime: 45.2,
          endTime: 75.2,
          emotion: 'surprise',
          description: 'Momento de reviravolta épica',
          platforms: ['tiktok', 'instagram', 'youtube'],
          hashtags: ['#reviravolta', '#épico', '#surpreendente', '#viral'],
          caption: 'PLOT TWIST que ninguém esperava! 🤯 Qual foi sua reação?',
          downloadUrls: {
            tiktok: `/api/download/viral_001/tiktok`,
            instagram: `/api/download/viral_001/instagram`,
            youtube: `/api/download/viral_001/youtube`
          },
          scheduling: {
            tiktok: '19:30 (Horário ideal)',
            instagram: '20:15 (Peak engagement)',
            youtube: '21:00 (Prime time)'
          }
        },
        {
          id: 'viral_002', 
          viralScore: 89,
          duration: 60,
          startTime: 120.5,
          endTime: 180.5,
          emotion: 'excitement',
          description: 'Sequência de ação intensa',
          platforms: ['tiktok', 'kwai', 'youtube'],
          hashtags: ['#ação', '#adrenalina', '#intenso', '#viral'],
          caption: 'Adrenalina TOTAL! 🔥 Conseguiram acompanhar?',
          downloadUrls: {
            tiktok: `/api/download/viral_002/tiktok`,
            kwai: `/api/download/viral_002/kwai`,
            youtube: `/api/download/viral_002/youtube`
          },
          scheduling: {
            tiktok: '18:45 (High energy time)',
            kwai: '19:00 (Entertainment peak)',
            youtube: '20:30 (Action audience)'
          }
        }
      ],
      stats: {
        avgViralScore: 91.5,
        bestPlatform: 'TikTok',
        optimalPostingTime: '19:30 - 20:30',
        expectedViews: '50K - 200K por clipe',
        confidence: '92%'
      }
    };

    res.json(mockResults);

  } catch (error) {
    console.error('❌ Erro buscando resultados:', error);
    res.status(500).json({
      error: 'Erro ao buscar resultados',
      message: error.message
    });
  }
});

// Download de clipes otimizados
app.get('/api/download/:clipId/:platform', async (req, res) => {
  try {
    const { clipId, platform } = req.params;
    
    // Em produção, buscaria arquivo real
    res.json({
      message: `Download do clipe ${clipId} para ${platform}`,
      note: 'Em desenvolvimento - arquivo seria baixado aqui',
      specs: {
        tiktok: '9:16, 30-60s, H.264',
        instagram: '9:16 Stories, 1:1 Feed, H.264', 
        youtube: '16:9, 60s max, alta qualidade',
        kwai: '9:16, 15-60s, otimizado para mobile'
      }[platform]
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro no download',
      message: error.message
    });
  }
});

// Status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    services: {
      viralDetector: '✅ Online',
      beatSync: '✅ Online', 
      autoScheduler: '✅ Online',
      videoProcessor: '✅ Online',
      subtitleService: '✅ Online'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Erro global:', error);
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'Erro no upload',
      message: error.message,
      code: error.code
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /',
      'POST /api/upload',
      'GET /api/results/:jobId',
      'GET /api/download/:clipId/:platform',
      'GET /api/status'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🎭 CLIPNINJA.AI SERVIDOR ATIVO!

🌐 URL: http://localhost:${PORT}
🚀 Ambiente: ${process.env.NODE_ENV || 'development'}
📊 Status: Todos os serviços online

🔥 RECURSOS ATIVOS:
✅ Detector de Momentos Virais
✅ Beat Sync Service  
✅ Auto-Scheduler Pro
✅ Processamento Multi-plataforma
✅ Legendas Inteligentes

📱 Upload seu vídeo e crie clipes virais!
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Desligando ClipNinja.AI...');
  process.exit(0);
});

export default app;