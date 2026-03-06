'use strict';

// Cache en mémoire : "sourceLang|targetLang|text" → texte traduit
const cache = new Map();
const CACHE_MAX = 500;

/**
 * Traduit un texte via Google Translate REST API.
 * @param {string} text       - Texte à traduire
 * @param {string} sourceLang - Code source ('fr' ou 'id')
 * @param {string} targetLang - Code cible ('id' ou 'fr')
 * @returns {Promise<string>} - Texte traduit
 */
async function translate(text, sourceLang, targetLang) {
    if (!text || !text.trim()) return '';
    if (sourceLang === targetLang) return text;

    const cacheKey = `${sourceLang}|${targetLang}|${text}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY manquante dans le fichier .env');

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text'
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Google Translate API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const translated = data.data.translations[0].translatedText;

    // Nettoyage LRU basique : on vide quand on atteint la limite
    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(cacheKey, translated);

    return translated;
}

module.exports = { translate };
