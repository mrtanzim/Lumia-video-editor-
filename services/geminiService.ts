import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const geminiService = {
  /**
   * Analyzes video description to suggest viral cuts.
   */
  analyzeVideoContent: async (description: string, totalDuration: number): Promise<AIAnalysisResult> => {
    if (!apiKey) {
      console.warn("No API Key provided for Gemini");
      return { segments: [] };
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a professional video editor. Analyze the following video description and timestamp data. Identify the most engaging segments suitable for a viral short video (approx 30-60s). The total video duration is ${totalDuration} seconds.
        
        Video Context: ${description}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    start: { type: Type.NUMBER, description: "Start time in seconds" },
                    end: { type: Type.NUMBER, description: "End time in seconds" },
                    reason: { type: Type.STRING, description: "Why this segment is engaging" },
                    score: { type: Type.NUMBER, description: "Engagement score 1-10" },
                  },
                  required: ["start", "end", "reason", "score"],
                },
              },
            },
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as AIAnalysisResult;
      }
      return { segments: [] };
    } catch (error) {
      console.error("Gemini AI Error:", error);
      throw error;
    }
  },

  /**
   * Generates subtitles/captions for a given text segment.
   */
  generateSubtitles: async (text: string): Promise<string> => {
    if (!apiKey) return "API Key missing";
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Convert the following text into SRT subtitle format. Ensure accurate timing estimation based on average reading speed (approx 150-200 wpm). Assume start time is 00:00:00.
        
        Text: "${text}"`,
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini AI Subtitle Error:", error);
      return "Error generating subtitles.";
    }
  },

  /**
   * Suggests a title and thumbnail description.
   */
  generateMetadata: async (projectSummary: string) => {
    if (!apiKey) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on this video project summary, suggest a viral YouTube title and a visual description for a high-CTR thumbnail.
            
            Summary: ${projectSummary}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        thumbnailDescription: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error(e);
        return null;
    }
  }
};
