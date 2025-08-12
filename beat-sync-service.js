// backend/services/beat-sync-service.js
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export class BeatSyncService {
  constructor() {
    // Configuração do FFmpeg (se necessário)
    // ffmpeg.setFfmpegPath('/path/to/ffmpeg');
    // ffmpeg.setFfprobePath('/path/to/ffprobe');
  }

  // 🎵 DETECTA BATIDAS E SINCRONIZA CLIPES
  async syncClipsWithBeats(clips, videoPath) {
    try {
      console.log('🎵 Iniciando detecção de batidas...');
      const beatTimestamps = await this.detectBeats(videoPath);
      console.log(`Batidas detectadas: ${beatTimestamps.length}`);

      const syncedClips = clips.map(clip => {
        const bestStartTime = this.findBestBeatSyncPoint(clip.startTime, beatTimestamps, clip.duration);
        return {
          ...clip,
          startTime: bestStartTime,
          endTime: bestStartTime + clip.duration,
          syncedToBeat: true,
          beatSyncDetails: {
            originalStartTime: clip.startTime,
            newStartTime: bestStartTime,
            offset: bestStartTime - clip.startTime,
            nearbyBeats: beatTimestamps.filter(ts => 
              ts >= Math.max(0, bestStartTime - 5) && ts <= (bestStartTime + clip.duration + 5)
            )
          }
        };
      });

      console.log('✅ Clipes sincronizados com as batidas!');
      return syncedClips;

    } catch (error) {
      console.error('❌ Erro na sincronização de batidas:', error);
      return clips; // Retorna os clipes originais em caso de erro
    }
  }

  // Usa ffprobe para detectar batidas
  async detectBeats(videoPath) {
    return new Promise((resolve, reject) => {
      const beatTimestamps = [];
      ffmpeg.ffprobe(videoPath, ['-show_entries', 'frame=pkt_pts_time', '-select_streams', 'a', '-of', 'json'], (err, metadata) => {
        if (err) {
          console.error('Erro ffprobe:', err);
          return reject(err);
        }

        // Isso é uma simulação de detecção de batidas
        // Em um cenário real, usaria bibliotecas de análise de áudio (e.g., Aubio, Essentia via WASM/Python)
        // Para este exemplo, vamos simular batidas a cada 0.8 a 1.2 segundos
        const duration = metadata.format.duration;
        let currentTime = 0;
        while (currentTime < duration) {
          beatTimestamps.push(parseFloat(currentTime.toFixed(2)));
          currentTime += (0.8 + Math.random() * 0.4); // Simula batida irregular
        }
        resolve(beatTimestamps);
      });
    });
  }

  // Encontra o ponto de início mais próximo de uma batida
  findBestBeatSyncPoint(originalStartTime, beatTimestamps, clipDuration) {
    let bestTime = originalStartTime;
    let minDifference = Infinity;

    // Encontra a batida mais próxima antes ou no início do clipe
    for (const beat of beatTimestamps) {
      const diff = Math.abs(beat - originalStartTime);
      if (diff < minDifference) {
        minDifference = diff;
        bestTime = beat;
      }
    }

    // Garante que o clipe não começa muito antes do momento viral
    // E não termina antes do momento viral + duração mínima
    const adjustedStartTime = Math.max(0, bestTime);
    
    // Se o clipe original tinha um momento crítico em X segundos, tente manter isso
    // Para simplificar, focamos apenas no início aqui.

    return adjustedStartTime;
  }

  // GERAÇÃO DE CLIPE COM BEAT-SYNC (exemplo - será parte do VideoProcessor)
  async generateBeatSyncedClip(videoPath, startTime, duration, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23')
        .output(outputPath)
        .on('end', () => {
          console.log(`Clipe beat-sync gerado: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Erro ao gerar clipe beat-sync:', err);
          reject(err);
        })
        .run();
    });
  }
}