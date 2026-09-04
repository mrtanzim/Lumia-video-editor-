
import { GoogleGenAI } from "@google/genai";

// API Keys provided by user configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// Safe API Key retrieval for Gemini
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) { }
  return 'dummy-key';
};

const geminiAi = new GoogleGenAI({ apiKey: getApiKey() });

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are a friendly AI video editing assistant for Lumina AI Video Editor (a browser-based editor).

Available Tools in this app:
- **Selection Tool (V)**: Select and move clips on the timeline.
- **Razor Tool (C)**: Split/Cut clips at specific timestamps.
- **Import Media (I)**: Upload video, audio, or images from your device.
- **Type Tool (T)**: Add text overlays, titles, and lower thirds.
- **Audio Tool (A)**: Manage audio tracks, volume, and music.
- **Visual Effects (E)**: Apply filters (Blur, Grayscale, Sepia, etc.).
- **Transitions (R)**: Add animations (Fade, Wipe, Zoom) between clips.
- **AI Magic (K)**: Features like Text-to-speech, Auto-edit, and Subtitle generation.
- **Properties Panel**: Right sidebar for adjusting scale, opacity, rotation, and volume.

Your Role:
- Help users choose the right tool for their task.
- Give step-by-step instructions (max 2-4 sentences).
- Answer in the user's language (Bangla, English, Hindi, etc.) based on their input.
- Be concise, practical, and friendly.
- Suggest keyboard shortcuts where applicable.
- Never mention which API model (Groq/DeepSeek) you are using.

STRICT GREETING RULES:
1. If the user says "Salam" or "Assalamu Alaikum", you MUST reply with "Walaikum Assalam".
2. If the user says "Hello" or "Hi", reply with "Hello" or "Hi".
3. **NEVER use the word "Namaskar"**. Use "Salam" or "Hello" instead for Bangla greetings.

Response Style:
- Short, actionable paragraphs.
- Use emojis occasionally for friendliness.
- No technical jargon.
`;

export const aiAssistantService = {
  sendMessage: async (history: ChatMessage[], userMessage: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content;
      }
      throw new Error("Proxy failed");
    } catch (error) {
      console.warn("AI Proxy failed, switching to Local Fallback...", error);
      return getLocalResponse(userMessage);
    }
  }
};

/**
 * A simple offline fallback that matches keywords to provide helpful responses.
 * Used when all AI APIs are unreachable (e.g., CORS issues, network down).
 */
function getLocalResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('trim') || q.includes('cut') || q.includes('split') || q.includes('katbo')) {
    return "To trim or cut a video: \n1. Select the **Razor Tool** (Press 'C'). \n2. Click on the timeline where you want to cut. \n3. Switch back to **Select Tool** (Press 'V') to move or delete the clip segment. ✂️";
  }

  if (q.includes('crop') || q.includes('resize') || q.includes('size')) {
    return "To crop or resize: \n1. Select your clip on the timeline. \n2. Go to the **Properties Panel** on the right. \n3. Use the 'Scale' and 'Position' sliders under the Transform section. Note: Full cropping requires the Crop Tool (coming soon)! 📐";
  }

  if (q.includes('audio') || q.includes('music') || q.includes('sound') || q.includes('volume')) {
    return "For audio adjustments: \n1. Click the **Audio Tool** (Music icon) in the left sidebar to add music. \n2. To change volume, select an audio clip and adjust the 'Volume' slider in the Properties Panel. 🎵";
  }

  if (q.includes('text') || q.includes('title') || q.includes('subtitle') || q.includes('likhbo')) {
    return "To add text: \n1. Click the **Type Tool** ('T' icon). \n2. Choose a preset or drag a Text clip to the timeline. \n3. Edit the text content, font, and color in the Properties Panel. ✍️";
  }

  if (q.includes('export') || q.includes('save') || q.includes('download')) {
    return "To save your video: \n1. Click the **Export** button in the top right corner. \n2. The video will be rendered (simulated) and ready for download in a few seconds! 💾";
  }

  // Strict Greeting Handling for Local Fallback
  if (q.includes('salam') || q.includes('assalam')) {
    return "Walaikum Assalam! 👋 I'm your AI video editing assistant. How can I help you edit your video today?";
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('oi') || q.includes('hey')) {
    return "Hello! 👋 I'm your AI video editing assistant. How can I help you edit your video today?";
  }

  // Default Fallback
  return "I'm having trouble connecting to my brain (the cloud) right now. ☁️ \n\nHowever, you can try using the **Select Tool (V)** to manage clips, or the **Razor Tool (C)** to cut them. Check the tooltips in the sidebar for more help!";
}
