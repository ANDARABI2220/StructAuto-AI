/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Server-Side Gemini API Engine using @google/genai SDK
 * Never exposes the API key to the client/browser.
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * 1. Deep Structural Engineering Reasoning with High Thinking
 * Model: gemini-4-argon with thinkingLevel: HIGH (no maxOutputTokens set!)
 */
export async function executeHighThinkingAnalysis(prompt: string, csmSummaryText?: string): Promise<string> {
  const ai = getAiClient();
  const systemInstruction = `شما موتور استدلال تحلیلی و بهینه‌سازی مهندسی سازه StructAuto AI هستید.
وظیفه شما ارزیابی عمیق سازه‌های مهندسی (ETABS, ProtaStructure, MATE)، کنترل ضوابط استاندارد ۲۸۰۰ ویرایش ۴، مبحث ۶، مبحث ۹ و ۱۰ مقررات ملی ساختمان و ACI 318 است.
پاسخ‌ها باید از نظر مهندسی دقیق، دارای توجیهات مکانیک سازه، محاسباتی، همراه با ارجاع صریح به بندهای آیین‌نامه و به زبان فارسی حرفه‌ای مهندسی باشند.`;

  const fullPrompt = csmSummaryText
    ? `خلاصه مدل سازه‌ای فعال (CSM Summary):\n${csmSummaryText}\n\nدرخواست مهندس محاسب:\n${prompt}`
    : prompt;

  const response = await ai.models.generateContent({
    model: 'gemini-4-argon',
    contents: fullPrompt,
    config: {
      systemInstruction,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
    },
  });

  return response.text || 'پاسخ تحلیلی دریافت نشد.';
}

/**
 * 2. Search Grounding for Up-To-Date Building Codes & Amendments
 * Model: gemini-3.8-flash with googleSearch tool
 */
export async function executeSearchGrounding(query: string): Promise<{ text: string; sources?: string[] }> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const candidate = response.candidates?.[0];
  const searchChunks = (candidate as any)?.groundingMetadata?.groundingChunks;
  const sources = searchChunks
    ?.map((c: any) => c.web?.title || c.web?.uri)
    ?.filter(Boolean) as string[] || [];

  return {
    text: response.text || 'اطلاعاتی یافت نشد.',
    sources: sources.length > 0 ? sources : undefined,
  };
}

/**
 * 3. High-Quality Structural & Architectural Image Generation
 * Model: gemini-3-pro-image-preview with 1K, 2K, and 4K resolution affordance
 */
export async function executeImageGeneration(
  prompt: string,
  imageSize: '1K' | '2K' | '4K' = '1K',
  aspectRatio: '16:9' | '1:1' | '4:3' | '9:16' = '16:9'
): Promise<{ imageUrl: string; textFeedback?: string }> {
  const ai = getAiClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: `Architectural and structural engineering visual visualization: ${prompt}, hyper-realistic, structural details, blueprint accents, 8k quality, raytracing.` }],
    },
    config: {
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  });

  let imageUrl = '';
  let textFeedback = '';

  const candidates = response.candidates;
  if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textFeedback += part.text;
      }
    }
  }

  return { imageUrl, textFeedback };
}

/**
 * 4. General Engineering Tasks
 * Model: gemini-3.8-flash
 */
export async function executeGeneralTask(prompt: string): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  });
  return response.text || '';
}

/**
 * 5. Fast Operational Tasks
 * Model: gemini-3.1-flash-lite
 */
export async function executeFastTask(prompt: string): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
  });
  return response.text || '';
}
