/**
 * Multi-provider AI Integration Layer
 * Securely executed ONLY on the server.
 * Never leaks API keys or secrets to the client.
 */

interface AIRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProviderResult {
  text: string;
  provider: 'openai' | 'gemini' | 'anthropic' | 'fallback_engine';
  isFallback: boolean;
}

/**
 * Checks which AI provider credentials are configured
 */
export function getActiveAIProvider(): 'openai' | 'gemini' | 'anthropic' | 'fallback_engine' {
  if (process.env.OPENAI_API_KEY || (process.env.AI_API_KEY && process.env.AI_PROVIDER === 'openai')) {
    return 'openai';
  }
  if (process.env.GEMINI_API_KEY || (process.env.AI_API_KEY && process.env.AI_PROVIDER === 'gemini')) {
    return 'gemini';
  }
  if (process.env.ANTHROPIC_API_KEY || (process.env.AI_API_KEY && process.env.AI_PROVIDER === 'anthropic')) {
    return 'anthropic';
  }
  // If generic AI_API_KEY is provided without explicit provider, default to OpenAI compatible endpoint
  if (process.env.AI_API_KEY) {
    return 'openai';
  }
  return 'fallback_engine';
}

/**
 * Executes an AI generation request server-side
 */
export async function generateAICompletion(options: AIRequestOptions): Promise<AIProviderResult> {
  const provider = getActiveAIProvider();

  // Try calling real AI provider if configured
  if (provider === 'openai') {
    try {
      const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt },
          ],
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 700,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return { text, provider: 'openai', isFallback: false };
        }
      } else {
        console.warn('OpenAI API returned non-OK response:', res.status, await res.text());
      }
    } catch (err) {
      console.warn('OpenAI request failed, switching to local intelligence fallback:', err);
    }
  } else if (provider === 'gemini') {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
      const configuredModel = process.env.AI_MODEL || 'gemini-flash-lite-latest';
      const candidateModels = Array.from(new Set([configuredModel, 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-flash-latest']));

      for (const m of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${options.systemPrompt}\n\nTask:\n${options.userPrompt}` }],
                },
              ],
              generationConfig: {
                temperature: options.temperature ?? 0.3,
                maxOutputTokens: options.maxTokens ?? 700,
              },
            }),
            signal: AbortSignal.timeout(12000),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) {
              return { text, provider: 'gemini', isFallback: false };
            }
          } else {
            console.warn(`Gemini model ${m} returned non-OK response:`, res.status);
            // Only retry with alternate model if 503 (high demand) or 404 (model moved)
            if (res.status !== 503 && res.status !== 404) {
              break;
            }
          }
        } catch (innerErr) {
          console.warn(`Gemini candidate model ${m} attempt failed:`, innerErr);
        }
      }
    } catch (err) {
      console.warn('Gemini request failed, switching to local intelligence fallback:', err);
    }
  } else if (provider === 'anthropic') {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'claude-3-5-haiku-latest',
          system: options.systemPrompt,
          messages: [{ role: 'user', content: options.userPrompt }],
          max_tokens: options.maxTokens ?? 700,
          temperature: options.temperature ?? 0.3,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text?.trim();
        if (text) {
          return { text, provider: 'anthropic', isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Anthropic request failed, switching to local intelligence fallback:', err);
    }
  }

  // Fallback: Return null indicating caller should run contextual deterministic synthesis
  return {
    text: '',
    provider: 'fallback_engine',
    isFallback: true,
  };
}
