const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const ELEVEN_LABS_KEY = process.env.ELEVEN_LABS_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

router.post('/chat', async (req, res) => {
    const { messages, userMessage } = req.body;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages,
                model: "llama3-70b-8192",
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (response.ok) {
            const data = await response.json();
            return res.json({ content: data.choices[0].message.content });
        }
    } catch (e) {
        console.error("Groq failed in proxy", e);
    }

    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(userMessage);
            return res.json({ content: result.response.text() });
        } catch (e) {
            console.error("Gemini failed in proxy", e);
        }
    }

    res.status(500).json({ error: 'All AI models failed' });
});

router.post('/tts', async (req, res) => {
    const { text, voiceId } = req.body;

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || '21m00Tcm4TlvDq8ikWAM'}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVEN_LABS_KEY,
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            }),
        });

        if (!response.ok) throw new Error("ElevenLabs failed");

        const buffer = await response.arrayBuffer();
        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(500).json({ error: 'TTS failed' });
    }
});

module.exports = router;
