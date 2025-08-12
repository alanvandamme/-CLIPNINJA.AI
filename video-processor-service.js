// backend/services/video-processor-service.js
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export class VideoProcessorService {
  constructor() {
    // Certifique-se de que o ffmpeg e ffprobe estão instalados e no PATH
    // ou configure-os explicitamente aqui, por exemplo:
    // ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg');
    // ffmpeg.setFfprobePath('/usr/local/bin/ffprobe');
    this.outputDir = path.join(process.cwd(), 'processed_clips');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // 📱 OTIMIZA CLIPES PARA PLATAFORMAS ESPECÍFICAS
  async optimizeForPlatforms(clip, originalVideoPath) {
    console.log(`📱 Otimizando clipe ${clip.id} para diferentes plataformas...`);
    const optimizedVersions = [];

    // Mapeamento de perfis de plataforma
    const platformProfiles = {
      tiktok: { aspectRatio: '9:16', quality: 'high', duration: 60, preset: 'veryfast' }, // TikTok ideal 15-60s
      instagram: { aspectRatio: '9:16', quality: 'high', duration: 90, preset: 'fast' }, // Reels 9:16, até 90s
      youtube: { aspectRatio: '16:9', quality: 'veryhigh', duration: 90, preset: 'medium' }, // Shorts até 60s, mas YouTube aceita mais
      kwai: { aspectRatio: '9:16', quality: 'medium', duration: 60, preset: 'superfast' },
      twitter: { aspectRatio: '16:9', quality: 'medium', duration: 140, preset: 'fast' },
      facebook: { aspectRatio: '16:9', quality: 'high', duration: 240, preset: 'fast' },
    };

    for (const platform of clip.platforms) {
      const profile = platformProfiles[platform.name];
      if (!profile) {
        console.warn(`Profile for platform ${platform.name} not found, skipping.`);
        continue;
      }

      const outputPath = path.join(this.outputDir, `${clip.id}_${platform.name}_optimized.mp4`);
      const finalDuration = Math.min(clip.duration, profile.duration);
      const finalStartTime = clip.startTime;

      try {
        await this.processVideo(
          originalVideoPath,
          outputPath,
          finalStartTime,
          finalDuration,
          profile.aspectRatio,
          profile.quality,
          profile.preset
        );
        optimizedVersions.push({
          platform: platform.name,
          outputPath: outputPath,
          aspectRatio: profile.aspectRatio,
          quality: profile.quality,
          duration: finalDuration,
          originalClipDetails: clip,
        });
        console.log(`✅ Clipe ${clip.id} otimizado para ${platform.name}`);
      } catch (error) {
        console.error(`❌ Erro otimizando clipe ${clip.id} para ${platform.name}:`, error);
      }
    }
    return optimizedVersions;
  }

  // Função genérica para processar vídeo com FFmpeg
  async processVideo(
    inputPath,
    outputPath,
    startTime,
    duration,
    aspectRatio,
    quality = 'medium',
    preset = 'fast'
  ) {
    return new Promise((resolve, reject) => {
      let crf;
      switch (quality) {
        case 'veryhigh': crf = 18; break;
        case 'high': crf = 23; break;
        case 'medium': crf = 28; break;
        case 'low': crf = 32; break;
        default: crf = 23; // Default to high
      }

      let scaleFilter = '';
      if (aspectRatio === '9:16') {
        scaleFilter = 'scale=-2:1280,crop=720:1280'; // Vertical video (e.g., 720x1280)
      } else if (aspectRatio === '1:1') {
        scaleFilter = 'scale=1080:-2,crop=1080:1080'; // Square video (e.g., 1080x1080)
      } else if (aspectRatio === '16:9') {
        scaleFilter = 'scale=1920:-2,crop=1920:1080'; // Horizontal video (e.g., 1920x1080)
      } else { // Default to 16:9 or source aspect if not specified
        scaleFilter = 'scale=1920:-2'; // Maintain aspect, scale width to 1920 if source is wider
      }

      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .videoFilters(`scale='iw*min(1280/iw,720/ih)':'ih*min(1280/iw,720/ih)',pad=1280:720:(1280-iw)/2:(720-ih)/2`)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', preset,
          '-crf', crf.toString(),
          '-c:a', 'aac',
          '-b:a', '192k',
          '-ar', '48000',
          '-movflags', 'faststart'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  // Função para adicionar introdução/outro dinâmico (opcional)
  async addIntroOutro(clipPath, introPath, outroPath, finalOutputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(introPath)
        .input(clipPath)
        .input(outroPath)
        .on('error', (err) => reject(err))
        .on('end', () => resolve(finalOutputPath))
        .mergeToFile(finalOutputPath, '/tmp/');
    });
  }

  // Geração de thumbnails (futuro)
  async generateThumbnail(videoPath, timestamp, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x360'
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err));
    });
  }

  // Adiciona transições dinâmicas (exemplo - complexo com ffmpeg)
  async addDynamicTransition(clip1Path, clip2Path, outputPath) {
    // Isso geralmente envolve filtros complexos do FFmpeg ou composição com libs como sharp/graphicsmagick
    // Para simplificar, esta é uma funcionalidade avançada que exigiria mais desenvolvimento.
    console.log(`Adicionando transição entre ${clip1Path} e ${clip2Path}`);
    return Promise.resolve(outputPath); // Simulação
  }
}
