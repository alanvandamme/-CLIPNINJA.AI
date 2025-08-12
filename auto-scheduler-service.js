// backend/services/auto-scheduler-service.js
import OpenAI from 'openai';

export class AutoSchedulerService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // Dados de engajamento baseados em estudos e tendências (pode ser atualizado)
    // Horários em UTC
    this.engagementData = {
      tiktok: [
        { day: 'segunda', hour: 14, score: 0.7 }, { day: 'segunda', hour: 17, score: 0.8 }, { day: 'segunda', hour: 20, score: 0.9 },
        { day: 'terca', hour: 13, score: 0.75 }, { day: 'terca', hour: 16, score: 0.85 }, { day: 'terca', hour: 19, score: 0.9 },
        { day: 'quarta', hour: 15, score: 0.8 }, { day: 'quarta', hour: 18, score: 0.9 }, { day: 'quarta', hour: 21, score: 0.95 },
        { day: 'quinta', hour: 14, score: 0.85 }, { day: 'quinta', hour: 17, score: 0.9 }, { day: 'quinta', hour: 20, score: 0.95 },
        { day: 'sexta', hour: 13, score: 0.7 }, { day: 'sexta', hour: 16, score: 0.8 }, { day: 'sexta', hour: 19, score: 0.9 },
        { day: 'sabado', hour: 10, score: 0.75 }, { day: 'sabado', hour: 14, score: 0.85 }, { day: 'sabado', hour: 18, score: 0.9 },
        { day: 'domingo', hour: 11, score: 0.8 }, { day: 'domingo', hour: 15, score: 0.9 }, { day: 'domingo', hour: 19, score: 0.95 }
      ],
      instagram: [
        { day: 'segunda', hour: 11, score: 0.75 }, { day: 'segunda', hour: 15, score: 0.8 }, { day: 'segunda', hour: 18, score: 0.85 },
        { day: 'terca', hour: 10, score: 0.7 }, { day: 'terca', hour: 14, score: 0.8 }, { day: 'terca', hour: 17, score: 0.85 },
        { day: 'quarta', hour: 12, score: 0.85 }, { day: 'quarta', hour: 16, score: 0.9 }, { day: 'quarta', hour: 19, score: 0.95 },
        { day: 'quinta', hour: 11, score: 0.8 }, { day: 'quinta', hour: 15, score: 0.85 }, { day: 'quinta', hour: 18, score: 0.9 },
        { day: 'sexta', hour: 10, score: 0.7 }, { day: 'sexta', hour: 14, score: 0.75 }, { day: 'sexta', hour: 17, score: 0.8 },
        { day: 'sabado', hour: 9, score: 0.7 }, { day: 'sabado', hour: 13, score: 0.8 }, { day: 'sabado', hour: 16, score: 0.85 },
        { day: 'domingo', hour: 10, score: 0.75 }, { day: 'domingo', hour: 14, score: 0.85 }, { day: 'domingo', hour: 17, score: 0.9 }
      ],
      youtube: [
        { day: 'segunda', hour: 16, score: 0.7 }, { day: 'segunda', hour: 19, score: 0.8 }, { day: 'segunda', hour: 21, score: 0.85 },
        { day: 'terca', hour: 15, score: 0.75 }, { day: 'terca', hour: 18, score: 0.85 }, { day: 'terca', hour: 20, score: 0.9 },
        { day: 'quarta', hour: 17, score: 0.8 }, { day: 'quarta', hour: 20, score: 0.9 }, { day: 'quarta', hour: 22, score: 0.95 },
        { day: 'quinta', hour: 16, score: 0.85 }, { day: 'quinta', hour: 19, score: 0.9 }, { day: 'quinta', hour: 21, score: 0.95 },
        { day: 'sexta', hour: 15, score: 0.7 }, { day: 'sexta', hour: 18, score: 0.75 }, { day: 'sexta', hour: 20, score: 0.8 },
        { day: 'sabado', hour: 12, score: 0.75 }, { day: 'sabado', hour: 16, score: 0.85 }, { day: 'sabado', hour: 19, score: 0.9 },
        { day: 'domingo', hour: 13, score: 0.8 }, { day: 'domingo', hour: 17, score: 0.9 }, { day: 'domingo', hour: 20, score: 0.95 }
      ],
      kwai: [
        { day: 'segunda', hour: 13, score: 0.7 }, { day: 'segunda', hour: 16, score: 0.8 }, { day: 'segunda', hour: 19, score: 0.85 },
        { day: 'terca', hour: 12, score: 0.75 }, { day: 'terca', hour: 15, score: 0.85 }, { day: 'terca', hour: 18, score: 0.9 },
        { day: 'quarta', hour: 14, score: 0.8 }, { day: 'quarta', hour: 17, score: 0.9 }, { day: 'quarta', hour: 20, score: 0.95 },
        { day: 'quinta', hour: 13, score: 0.85 }, { day: 'quinta', hour: 16, score: 0.9 }, { day: 'quinta', hour: 19, score: 0.95 },
        { day: 'sexta', hour: 12, score: 0.7 }, { day: 'sexta', hour: 15, score: 0.75 }, { day: 'sexta', hour: 18, score: 0.8 },
        { day: 'sabado', hour: 10, score: 0.75 }, { day: 'sabado', hour: 14, score: 0.85 }, { day: 'sabado', hour: 17, score: 0.9 },
        { day: 'domingo', hour: 11, score: 0.8 }, { day: 'domingo', hour: 15, score: 0.9 }, { day: 'domingo', hour: 18, score: 0.95 }
      ]
    };
  }

  // 🚀 CALCULA OS MELHORES HORÁRIOS PARA POSTAGEM
  async calculateOptimalTiming(clips, targetAudienceGeo = 'Brazil/São Paulo', timezone = '-03:00') {
    try {
      console.log('🚀 Calculando horários de postagem ideais...');
      const schedulingRecommendations = [];
      let globalOptimalTime = null;
      let highestGlobalScore = 0;

      const today = new Date();
      const daysOfWeek = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const currentDay = daysOfWeek[today.getDay()];

      for (const clip of clips) {
        const clipPlatforms = clip.platforms.map(p => p.name);
        const clipSchedule = {};

        for (const platform of clipPlatforms) {
          const platformData = this.engagementData[platform];
          if (!platformData) continue;

          let bestPlatformTime = null;
          let bestPlatformScore = 0;

          // Filtra horários do dia atual (ou pode ser dia seguinte para planejamento)
          const relevantTimings = platformData.filter(data => data.day === currentDay);

          if (relevantTimings.length > 0) {
            // Prioriza o horário mais próximo no futuro (se já passou, pega o melhor do dia)
            let optimalTimingForToday = relevantTimings[0];
            for (const timing of relevantTimings) {
              // Converte hora UTC para o timezone local
              const localHour = this.convertUtcToLocal(timing.hour, timezone);
              
              if (localHour > today.getHours()) {
                optimalTimingForToday = timing;
                break;
              } else if (timing.score > optimalTimingForToday.score) {
                optimalTimingForToday = timing; // Se já passou, pega o melhor do dia
              }
            }
            bestPlatformTime = `${this.formatHour(this.convertUtcToLocal(optimalTimingForToday.hour, timezone))}:00`;
            bestPlatformScore = optimalTimingForToday.score;
          }

          clipSchedule[platform] = {
            time: bestPlatformTime || 'N/A',
            score: bestPlatformScore,
            reason: `Baseado em dados de engajamento de ${platform} para ${currentDay} no seu fuso horário.`, // Adiciona timezone aqui
            timezone: timezone
          };

          // Atualiza o melhor horário global
          if (bestPlatformScore > highestGlobalScore) {
            highestGlobalScore = bestPlatformScore;
            globalOptimalTime = bestPlatformTime;
          }
        }
        schedulingRecommendations.push({
          clipId: clip.id,
          viralScore: clip.viralScore,
          recommendedSchedule: clipSchedule,
        });
      }

      console.log('✅ Horários de postagem calculados!');
      return {
        globalOptimal: globalOptimalTime || 'N/A',
        recommendations: schedulingRecommendations,
        notes: 'Considere o tipo de conteúdo e público específico para ajustes finos.'
      };

    } catch (error) {
      console.error('❌ Erro no agendamento automático:', error);
      throw error;
    }
  }

  // Converte hora UTC para o fuso horário local
  convertUtcToLocal(utcHour, timezoneOffset) {
    const offsetHours = parseInt(timezoneOffset.substring(0, 3));
    const offsetMinutes = parseInt(timezoneOffset.substring(4, 6) || '00');
    let localHour = utcHour + offsetHours;

    // Ajusta para o dia seguinte/anterior se passar de 24h/0h
    if (localHour >= 24) localHour -= 24;
    if (localHour < 0) localHour += 24;

    // Ignora minutos por enquanto, mas pode ser implementado
    return localHour;
  }

  // Formata a hora para exibição (ex: 9 -> 09)
  formatHour(hour) {
    return hour.toString().padStart(2, '0');
  }

  // Função auxiliar para obter o dia da semana em português
  getDayName(date) {
    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return days[date.getDay()];
  }
}