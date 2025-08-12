/* frontend/script.js - CLIPNINJA.AI INTERFACE LOGIC */

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const videoFile = document.getElementById('videoFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const messageDiv = document.getElementById('message');
    const messageText = document.getElementById('message-text');
    const progressSteps = document.getElementById('progress-steps');
    const progressBar = document.getElementById('progressBar');
    const uploadSection = document.getElementById('upload-section');
    const resultsSection = document.getElementById('results-section');
    const viralScoreSpan = document.getElementById('viralScore');
    const optimalTimeSpan = document.getElementById('optimalTime');
    const bestPlatformSpan = document.getElementById('bestPlatform');
    const clipListDiv = document.getElementById('clip-list');

    const API_BASE_URL = window.location.origin; // Assume a API está no mesmo host
    let currentJobId = null;

    // ⚡ SUBMISSÃO DO FORMULÁRIO DE UPLOAD
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!videoFile.files.length) {
            showMessage('Por favor, selecione um arquivo de vídeo para upload.', 'error');
            return;
        }

        const file = videoFile.files[0];
        const formData = new FormData();
        formData.append('video', file);
        formData.append('duration', document.getElementById('clipDuration').value);
        formData.append('language', document.getElementById('subtitleLanguage').value);

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'ENVIANDO VÍDEO...';
        showMessage('Carregando seu vídeo... Isso pode levar um tempo.', 'info', true); // Mostra barra de progresso

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Erro desconhecido no upload');
            }

            currentJobId = data.jobId;
            showMessage(
                `🔥 Vídeo enviado! ${data.message} ${data.estimatedTime}.`,
                'info',
                true,
                data.steps
            );
            pollResults(currentJobId);

        } catch (error) {
            console.error('Erro no upload:', error);
            showMessage(`❌ Falha no upload: ${error.message}. Tente novamente.`, 'error');
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'GERAR CLIPES NINJA! ⚡';
            progressBar.style.width = '0%'; // Reset progress bar
        }
    });

    // 📊 SONDA OS RESULTADOS DO PROCESSAMENTO
    function pollResults(jobId) {
        let progress = 0;
        const interval = setInterval(async () => {
            // Simula o progresso com base nos passos
            const steps = document.querySelectorAll('#progress-steps li');
            const totalSteps = steps.length;
            if (totalSteps > 0) {
                progress = Math.min(99, Math.floor((Array.from(steps).filter(li => li.classList.contains('completed')).length / totalSteps) * 100));
                progressBar.style.width = `${progress}%`;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/results/${jobId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Erro ao buscar resultados');
                }

                // Simula o progresso com base no status
                if (data.status === 'processing') {
                    updateProgressSteps(data.steps);
                    // Continue polling
                } else if (data.status === 'completed') {
                    clearInterval(interval);
                    progressBar.style.width = '100%';
                    showMessage('✅ Seus clipes virais estão prontos! Redirecionando...', 'success');
                    setTimeout(() => displayResults(data), 2000);
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    showMessage(`❌ Processamento falhou: ${data.message}`, 'error');
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = 'GERAR CLIPES NINJA! ⚡';
                    progressBar.style.width = '0%';
                }
            } catch (error) {
                clearInterval(interval);
                console.error('Erro ao sondar resultados:', error);
                showMessage(`❌ Erro ao buscar resultados: ${error.message}`, 'error');
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'GERAR CLIPES NINJA! ⚡';
                progressBar.style.width = '0%';
            }
        }, 5000); // Sonda a cada 5 segundos
    }

    // 🎨 ATUALIZA OS PASSOS DE PROGRESSO
    function updateProgressSteps(steps) {
        progressSteps.innerHTML = '';
        steps.forEach((step, index) => {
            const li = document.createElement('li');
            li.textContent = step;
            // Simulação de passos concluídos (em um sistema real, viria do backend)
            if (index < 2) { // Primeiros dois passos como concluídos para dar a impressão de progresso
                li.classList.add('completed');
                li.innerHTML = `✅ ${step}`; // Adiciona tick verde
            }
            progressSteps.appendChild(li);
        });
    }

    // ✨ EXIBE OS RESULTADOS FINAIS
    function displayResults(data) {
        uploadSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        viralScoreSpan.textContent = data.viralScore || 'N/A';
        optimalTimeSpan.textContent = data.stats.optimalPostingTime || 'N/A';
        bestPlatformSpan.textContent = data.stats.bestPlatform || 'N/A';

        clipListDiv.innerHTML = '';
        if (data.clips && data.clips.length > 0) {
            data.clips.forEach(clip => {
                const clipItem = document.createElement('div');
                clipItem.classList.add('clip-item');

                const platformsHtml = clip.platforms ? clip.platforms.map(p => `<li>${p}</li>`).join('') : '';
                const hashtagsHtml = clip.hashtags ? clip.hashtags.map(h => `<li>${h}</li>`).join('') : '';
                
                // Cria links de download dinamicamente
                const downloadLinksHtml = Object.entries(clip.downloadUrls || {}).map(([platform, url]) => {
                    return `<a href="${API_BASE_URL}${url}" target="_blank" class="btn btn-primary btn-small">Baixar ${platform}</a>`;
                }).join('');

                clipItem.innerHTML = `
                    <h4>Clipe Viral ID: ${clip.id}</h4>
                    <p><strong>Score Viral:</strong> ${clip.viralScore}/100 🔥</p>
                    <p><strong>Duração:</strong> ${clip.duration}s</p>
                    <p><strong>Emoção Principal:</strong> ${clip.emotion}</p>
                    <p><strong>Descrição:</strong> ${clip.description}</p>
                    <p><strong>Plataformas Recomendadas:</strong></p>
                    <ul class="platforms-list">${platformsHtml}</ul>
                    <p><strong>Hashtags Virais:</strong></p>
                    <ul class="hashtags-list">${hashtagsHtml}</ul>
                    <div class="download-links">
                        ${downloadLinksHtml}
                    </div>
                    <p><strong>Agendamento Ideal:</strong></p>
                    <ul class="scheduling-list">
                        ${Object.entries(clip.scheduling || {}).map(([platform, time]) => `<li>${platform}: ${time}</li>`).join('')}
                    </ul>
                `;
                clipListDiv.appendChild(clipItem);
            });
        } else {
            clipListDiv.innerHTML = '<p>Nenhum clipe gerado. Tente outro vídeo ou configurações.</p>';
        }
    }

    // 🚨 MOSTRA MENSAGENS PARA O USUÁRIO
    function showMessage(msg, type = 'info', showProgress = false, steps = []) {
        messageDiv.classList.remove('hidden', 'error');
        messageText.textContent = msg;
        if (type === 'error') {
            messageDiv.classList.add('error');
        }

        if (showProgress) {
            progressSteps.classList.remove('hidden');
            progressBar.parentNode.classList.remove('hidden'); // Mostra o container da barra
            updateProgressSteps(steps);
        } else {
            progressSteps.classList.add('hidden');
            progressBar.parentNode.classList.add('hidden'); // Esconde o container
            progressBar.style.width = '0%';
        }
    }
});
