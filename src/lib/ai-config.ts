import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Embedded API Keys from User
export const AI_CONFIG = {
  GEMINI: {
    KEY: process.env.GEMINI_API_KEY || "",
    MODEL: "gemini-3.1-pro-preview",
    FLASH_MODEL: "gemini-3-flash-preview"
  },
  OPENAI: {
    KEY: import.meta.env.VITE_OPENAI_API_KEY || "",
    BASE_URL: import.meta.env.VITE_OPEN_AI_BASE_URL || "https://api.openai.com/v1",
    MODEL: "gpt-4o"
  },
  DEEPSEEK: {
    KEY: import.meta.env.VITE_DEEPSEEK_API_KEY || "",
    BASE_URL: import.meta.env.VITE_DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    MODEL: "deepseek-chat"
  }
};

export const getGeminiClient = () => {
  // Explicitly set the base URL via httpOptions to bypass environment-injected proxies
  return new GoogleGenAI({ 
    apiKey: AI_CONFIG.GEMINI.KEY,
    httpOptions: {
      baseUrl: "https://generativelanguage.googleapis.com"
    }
  });
};

export const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: AI_CONFIG.OPENAI.KEY,
    baseURL: AI_CONFIG.OPENAI.BASE_URL,
    dangerouslyAllowBrowser: true
  });
};

export const getDeepSeekClient = () => {
  return new OpenAI({
    apiKey: AI_CONFIG.DEEPSEEK.KEY,
    baseURL: AI_CONFIG.DEEPSEEK.BASE_URL,
    dangerouslyAllowBrowser: true
  });
};
