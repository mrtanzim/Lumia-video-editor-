
const API_KEY = 'sk_cef39f75c213dcb001398663c6bbf23fcc4f7fdf5825e18d';

export const elevenLabsService = {
  /**
   * Generates speech from text using ElevenLabs API.
   * Falls back to Google Translate TTS if the API fails (e.g. invalid key/quota).
   */
  textToSpeech: async (text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<string | null> => {
    if (!text) return null;

    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      });

      if (!response.ok) throw new Error("TTS Proxy failed");

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.warn("Primary TTS failed. Switching to Fallback...", error);

      try {
        const encoded = encodeURIComponent(text);
        const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob`;
        return fallbackUrl;
      } catch (fallbackError) {
        console.error("All TTS methods failed:", fallbackError);
        return null;
      }
    }
  },

  getVoices: () => [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (American, Calm)' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (American, Strong)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (American, Soft)' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (American, Well-rounded)' },
  ]
};
