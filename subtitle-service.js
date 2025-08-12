// backend/services/subtitle-service.js
import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export class SubtitleService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    this.tempDir = path.join(process.cwd(), 'temp_audio');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // 📝 ADICIONA LEGENDAS INTELIGENTES AOS CLIPES
  async addSubtitesToClip(clip, originalVideoPath, language = 'pt') {
    try {
      console.log(`📝 Gerando e adicionando legendas para o clipe ${clip.id} em ${language}...`);

      // 1. Extrai o áudio do clipe
      const audioPath = await this.extractAudioFromClip(originalVideoPath, clip.startTime, clip.duration, clip.id);

      // 2. Transcreve o áudio usando a OpenAI (Whisper)
      const transcription = await this.transcribeAudio(audioPath, language);

      // 3. Gera o arquivo SRT (SubRip Subtitle)
      const srtContent = this.generateSrt(transcription);
      const srtFilePath = path.join(this.tempDir, `${clip.id}_${language}.srt`);
      fs.writeFileSync(srtFilePath, srtContent);
      console.log(`SRT gerado em: ${srtFilePath}`);

      // 4. Queima as legendas no vídeo (hardcoded)
      const outputVideoPath = path.join(this.outputDir || path.join(process.cwd(), 'processed_clips'), `${clip.id}_${language}_final.mp4`);
      await this.burnSubtitlesIntoVideo(originalVideoPath, srtFilePath, outputVideoPath, clip.startTime, clip.duration);
      
      // Limpa arquivos temporários
      fs.unlinkSync(audioPath);
      fs.unlinkSync(srtFilePath);

      console.log(`✅ Legendas adicionadas ao clipe ${clip.id}!`);
      return { 
        language,
        filePath: outputVideoPath,
        srtContent,
        transcription: transcription.text
      };

    } catch (error) {
      console.error(`❌ Erro ao adicionar legendas para o clipe ${clip.id}:`, error);
      return null; // Retorna nulo em caso de erro
    }
  }

  // Extrai áudio de um segmento de vídeo
  async extractAudioFromClip(videoPath, startTime, duration, clipId) {
    const audioOutputPath = path.join(this.tempDir, `${clipId}_audio.mp3`);
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions('-vn', '-acodec', 'libmp3lame', '-q:a', '2')
        .output(audioOutputPath)
        .on('end', () => {
          console.log(`Áudio extraído: ${audioOutputPath}`);
          resolve(audioOutputPath);
        })
        .on('error', (err) => {
          console.error('Erro ao extrair áudio:', err);
          reject(err);
        })
        .run();
    });
  }

  // Transcreve áudio para texto usando OpenAI Whisper
  async transcribeAudio(audioPath, language) {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
        language: language, // Ex: 'pt', 'en', 'es'
        response_format: "verbose_json",
        timestamp_granularities: ["word"]
      });
      console.log('Transcrição completa!');
      return transcription;
    } catch (error) {
      console.error('Erro na transcrição com OpenAI:', error);
      throw error;
    }
  }

  // Gera conteúdo SRT a partir da transcrição
  generateSrt(transcription) {
    let srt = '';
    let segmentIndex = 1;

    for (const segment of transcription.segments) {
      for (const word of segment.words) {
        const start = this.formatTime(word.start);
        const end = this.formatTime(word.end);
        srt += `${segmentIndex}\n`;
        srt += `${start} --> ${end}\n`;
        srt += `${word.word.trim()}\n\n`;
        segmentIndex++;
      }
    }
    return srt;
  }

  // Formata tempo para o formato SRT (HH:MM:SS,MS)
  formatTime(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    const ms = (seconds - Math.floor(seconds)) * 1000;
    return date.toISOString().substr(11, 8) + ',' + Math.floor(ms).toString().padStart(3, '0');
  }

  // Queima as legendas no vídeo usando FFmpeg (hardcode)
  async burnSubtitlesIntoVideo(originalVideoPath, srtPath, outputPath, startTime, duration) {
    return new Promise((resolve, reject) => {
      // Garante que o diretório de saída existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      ffmpeg(originalVideoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .videoFilters({
          filter: 'subtitles',
          options: {
            filename: srtPath,
            force_style: 'Fontname=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0,Alignment=2'
          }
        })
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'copy',
          '-movflags', 'faststart'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log(`Legendas queimadas no vídeo: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Erro ao queimar legendas:', err);
          reject(err);
        })
        .run();
    });
  }
}