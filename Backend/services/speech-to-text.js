'use strict';

/**
 * Google Cloud Speech-to-Text REST API wrapper.
 * Utilise la même clé API que Google Translate.
 */
async function transcribe(audioBase64, languageCode) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY manquante');

    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode,
                enableAutomaticPunctuation: true,
                model: 'default'
            },
            audio: {
                content: audioBase64
            }
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Speech-to-Text API ${response.status}: ${errBody}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return ''; // Pas de parole détectée
    }

    // Concaténer tous les résultats
    return data.results
        .map(r => r.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();
}

module.exports = { transcribe };
