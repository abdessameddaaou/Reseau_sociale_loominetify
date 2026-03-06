'use strict';

const express = require('express');
const router = express.Router();
const { translate } = require('../services/translation');

/**
 * POST /api/translate
 * Body : { text, sourceLang, targetLang }
 * Retourne : { translated }
 */
router.post('/', async (req, res) => {
    const { text, sourceLang, targetLang } = req.body;

    if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: 'text, sourceLang et targetLang sont requis' });
    }

    if (!['fr', 'id'].includes(sourceLang) || !['fr', 'id'].includes(targetLang)) {
        return res.status(400).json({ error: 'Langues supportées : fr, id' });
    }

    try {
        const translated = await translate(text.trim(), sourceLang, targetLang);
        res.json({ translated });
    } catch (err) {
        console.error('[Translation Route] Erreur:', err.message);
        res.status(500).json({ error: 'Erreur lors de la traduction' });
    }
});

module.exports = router;
