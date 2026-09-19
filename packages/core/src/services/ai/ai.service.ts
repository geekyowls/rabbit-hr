import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  cacheSystemPrompt?: boolean;
}

export interface GenerateTextResponse {
  content: string;
  success: boolean;
}

export abstract class AiService {
  abstract generateText(
    options: GenerateTextOptions,
  ): Promise<GenerateTextResponse>;
}

export class NoOpAiService implements AiService {
  async generateText(
    _options: GenerateTextOptions,
  ): Promise<GenerateTextResponse> {
    return {
      content:
        'AI features are disabled. Please configure AI_PROVIDER and the corresponding API key (OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY) in your environment variables.',
      success: false,
    };
  }
}

export class OpenAiService implements AiService {
  private client: OpenAI | null = null;
  private model: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateText(
    options: GenerateTextOptions,
  ): Promise<GenerateTextResponse> {
    if (!this.client) {
      return {
        content:
          'OpenAI is not configured. Please set OPENAI_API_KEY in your environment variables.',
        success: false,
      };
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: options.prompt,
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      return {
        content,
        success: true,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate text via OpenAI: ${error.message}`);
    }
  }
}

export class GeminiAiService implements AiService {
  private client: GoogleGenAI | null = null;
  private model: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  async generateText(
    options: GenerateTextOptions,
  ): Promise<GenerateTextResponse> {
    if (!this.client) {
      return {
        content:
          'Gemini is not configured. Please set GEMINI_API_KEY in your environment variables.',
        success: false,
      };
    }

    try {
      const result = await this.client.models.generateContent({
        model: this.model,
        contents: options.prompt,
        config: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2000,
          ...(options.systemPrompt && {
            systemInstruction: options.systemPrompt,
          }),
        },
      });

      const content = result.text;

      if (!content) {
        throw new Error('No content generated from Gemini');
      }

      return {
        content,
        success: true,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate text via Gemini: ${error.message}`);
    }
  }
}

export class ClaudeAiService implements AiService {
  private client: Anthropic | null = null;
  private model: string;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
    this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  }

  async generateText(
    options: GenerateTextOptions,
  ): Promise<GenerateTextResponse> {
    if (!this.client) {
      return {
        content:
          'Claude (Anthropic) is not configured. Please set ANTHROPIC_API_KEY in your environment variables.',
        success: false,
      };
    }

    try {
      const systemBlocks = options.systemPrompt
        ? [
            {
              type: 'text' as const,
              text: options.systemPrompt,
              ...(options.cacheSystemPrompt && {
                cache_control: { type: 'ephemeral' as const },
              }),
            },
          ]
        : undefined;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        ...(systemBlocks && { system: systemBlocks }),
        messages: [
          {
            role: 'user',
            content: options.prompt,
          },
        ],
      });

      const textBlock = message.content.find((block) => block.type === 'text');
      const content = textBlock?.type === 'text' ? textBlock.text : '';

      if (!content) {
        throw new Error('No content generated from Claude');
      }

      return {
        content,
        success: true,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate text via Claude: ${error.message}`);
    }
  }
}
