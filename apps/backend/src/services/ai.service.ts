// AI Service — modular provider abstraction
// Works with mock responses when no API key is set
// Swap to OpenAI/Claude by updating the provider implementation

export interface GrammarSuggestion {
  original: string;
  suggestion: string;
  reason: string;
  offset: number;
  length: number;
}

export interface AIProvider {
  suggestTitles(content: string): Promise<string[]>;
  suggestTags(content: string): Promise<string[]>;
  generateSummary(content: string): Promise<string>;
  checkGrammar(text: string): Promise<GrammarSuggestion[]>;
  generateImage(prompt: string): Promise<string>;
  generateContent(topic: string, tone?: string, length?: string): Promise<string>;
}

// ── Mock Provider (works without API key) ────────────────────────────────────

class MockAIProvider implements AIProvider {
  async suggestTitles(content: string): Promise<string[]> {
    const words = content.replace(/[#*`>\[\]]/g, '').split(/\s+/).filter(Boolean);
    const keyWords = words
      .filter(w => w.length > 4)
      .slice(0, 10)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    const uniqueWords = [...new Set(keyWords)].slice(0, 5);
    if (uniqueWords.length < 2) return ['Untitled Draft', 'My New Post', 'A Fresh Perspective'];

    return [
      `Understanding ${uniqueWords[0]} and ${uniqueWords[1]}`,
      `A Guide to ${uniqueWords[0]}`,
      `Why ${uniqueWords[0]} Matters in ${uniqueWords[1] || 'Today\'s World'}`,
      `${uniqueWords[0]}: What You Need to Know`,
      `The Complete ${uniqueWords[0]} Playbook`,
    ];
  }

  async suggestTags(content: string): Promise<string[]> {
    const text = content.toLowerCase().replace(/[#*`>\[\]]/g, '');

    const techKeywords: Record<string, string> = {
      'react': 'react', 'javascript': 'javascript', 'typescript': 'typescript',
      'python': 'python', 'node': 'nodejs', 'css': 'css', 'html': 'html',
      'api': 'api', 'database': 'database', 'sql': 'sql', 'docker': 'docker',
      'cloud': 'cloud', 'aws': 'aws', 'design': 'design', 'machine learning': 'machine-learning',
      'ai': 'artificial-intelligence', 'web': 'web-development', 'mobile': 'mobile',
      'security': 'security', 'devops': 'devops', 'testing': 'testing',
      'tutorial': 'tutorial', 'guide': 'guide', 'tips': 'tips',
      'beginner': 'beginners', 'career': 'career', 'productivity': 'productivity',
    };

    const found: string[] = [];
    for (const [keyword, tag] of Object.entries(techKeywords)) {
      if (text.includes(keyword)) found.push(tag);
    }

    return found.length > 0 ? found.slice(0, 5) : ['blog', 'article', 'general'];
  }

  async generateSummary(content: string): Promise<string> {
    const clean = content.replace(/[#*`>\[\]!()]/g, '').replace(/\n+/g, ' ').trim();
    const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 10);

    if (sentences.length === 0) return 'This article covers various topics of interest.';
    if (sentences.length === 1) return sentences[0].trim() + '.';

    // Pick first 2-3 meaningful sentences
    const summary = sentences.slice(0, 3).map(s => s.trim()).join('. ') + '.';
    return summary.length > 300 ? summary.slice(0, 297) + '...' : summary;
  }

  async checkGrammar(text: string): Promise<GrammarSuggestion[]> {
    // Basic common pattern checks
    const suggestions: GrammarSuggestion[] = [];

    const patterns: { regex: RegExp; suggestion: string; reason: string }[] = [
      { regex: /\bi\s/g, suggestion: 'I ', reason: 'Capitalize "I"' },
      { regex: /\.\s{2,}/g, suggestion: '. ', reason: 'Use single space after period' },
      { regex: /\s{2,}/g, suggestion: ' ', reason: 'Remove extra spaces' },
      { regex: /\bteh\b/gi, suggestion: 'the', reason: 'Common typo: "teh" → "the"' },
      { regex: /\brecieve\b/gi, suggestion: 'receive', reason: 'Spelling: "recieve" → "receive"' },
      { regex: /\boccured\b/gi, suggestion: 'occurred', reason: 'Spelling: "occured" → "occurred"' },
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        suggestions.push({
          original: match[0],
          suggestion: pattern.suggestion,
          reason: pattern.reason,
          offset: match.index,
          length: match[0].length,
        });
        if (suggestions.length >= 10) break;
      }
      if (suggestions.length >= 10) break;
    }

    return suggestions;
  }

  async generateImage(prompt: string): Promise<string> {
    // Generate a high-quality Unsplash placeholder based on keywords in prompt
    const keywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    const search = keywords.length > 0 ? keywords.join(',') : 'blog,technology';
    return `https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200&sig=${Math.floor(Math.random() * 1000)}&search=${encodeURIComponent(search)}`;
  }

  async generateContent(topic: string, tone: string = 'professional', length: string = 'medium'): Promise<string> {
    const wordCount = length === 'short' ? '300-400' : length === 'long' ? '900-1200' : '500-700';
    return [
      `# ${topic}`,
      '',
      `*A ${tone} guide covering the essentials of ${topic}.*`,
      '',
      `## Introduction`,
      '',
      `${topic} is a subject worth exploring thoroughly. In this article we'll walk through the key concepts, practical tips, and actionable insights you need to get started.`,
      '',
      `## Key Concepts`,
      '',
      `Understanding the fundamentals of ${topic} will help you build a strong foundation. Focus on the core principles before moving to advanced techniques.`,
      '',
      `## Practical Tips`,
      '',
      `1. Start with the basics and master them before advancing.`,
      `2. Practice consistently — even 15 minutes a day compounds quickly.`,
      `3. Seek feedback from peers and experts in the field.`,
      '',
      `## Conclusion`,
      '',
      `${topic} opens up a world of possibilities. Take the first step today and keep iterating as you learn more.`,
    ].join('\n');
  }
}

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Gemini Provider ──────────────────────────────────────────────────────────

class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async suggestTitles(content: string): Promise<string[]> {
    try {
      const prompt = `You are a professional blog editor. Suggest 5 catchy, SEO-friendly titles for the following content. Return only a JSON array of strings: ${content.slice(0, 4000)}`;
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      // Clean possible markdown wrappers
      const json = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(json);
    } catch (err) {
      console.error("Gemini suggestTitles error:", err);
      return new MockAIProvider().suggestTitles(content);
    }
  }

  async suggestTags(content: string): Promise<string[]> {
    try {
      const prompt = `Suggest 5 relevant tech/lifestyle tags for the following content. Return only a JSON array of strings: ${content.slice(0, 2000)}`;
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const json = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(json);
    } catch (err) {
      console.error("Gemini suggestTags error:", err);
      return new MockAIProvider().suggestTags(content);
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      const prompt = `Write a concise 2-sentence summary (max 250 chars) of the following blog post: ${content.slice(0, 3000)}`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error("Gemini generateSummary error:", err);
      return new MockAIProvider().generateSummary(content);
    }
  }

  async checkGrammar(text: string): Promise<GrammarSuggestion[]> {
    try {
      const prompt = `Identify grammar and spelling issues in the following text. Return ONLY a JSON array of objects with {original, suggestion, reason, offset, length}: ${text.slice(0, 2000)}`;
      const result = await this.model.generateContent(prompt);
      const output = result.response.text();
      const json = output.replace(/```json\n?|\n?```/g, '').trim();
      const issues = JSON.parse(json);
      return Array.isArray(issues) ? issues : (issues.issues || []);
    } catch (err) {
      console.error("Gemini checkGrammar error:", err);
      return new MockAIProvider().checkGrammar(text);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    return new MockAIProvider().generateImage(prompt);
  }

  async generateContent(topic: string, tone: string = 'professional', length: string = 'medium'): Promise<string> {
    try {
      const wordCount = length === 'short' ? '300-400' : length === 'long' ? '900-1200' : '500-700';
      const prompt = `Write a complete, well-structured blog post about "${topic}" in a ${tone} tone.
Target length: ${wordCount} words. Use proper markdown with headers (##), bullet points where helpful, and a clear intro/body/conclusion structure.
Do NOT include any meta-commentary — output only the blog post itself.`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error('Gemini generateContent error:', err);
      return new MockAIProvider().generateContent(topic, tone, length);
    }
  }
}

// -- Anthropic (Claude) Provider --

class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Call the Anthropic Messages API (works with claude-3-*, claude-haiku-*, claude-sonnet-* etc.)
   * Optionally pass a system prompt for richer instruction following.
   */
  private async callMessages(
    userMessage: string,
    systemPrompt: string,
    max_tokens = 1024,
  ): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';
    return text;
  }

  /** Strip markdown code fences if Claude wraps JSON output */
  private stripFences(raw: string): string {
    return raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/,'').trim();
  }

  async suggestTitles(content: string): Promise<string[]> {
    try {
      const system = 'You are a professional blog editor and SEO expert. Respond with ONLY a valid JSON array of exactly 5 strings — no markdown, no explanation.';
      const user = `Suggest 5 catchy, SEO-friendly blog titles for the following content:\n\n${content.slice(0, 4000)}`;
      const raw = await this.callMessages(user, system, 512);
      return JSON.parse(this.stripFences(raw));
    } catch (err) {
      console.error('Anthropic suggestTitles error:', err);
      return new MockAIProvider().suggestTitles(content);
    }
  }

  async suggestTags(content: string): Promise<string[]> {
    try {
      const system = 'You are a content tagging expert. Respond with ONLY a valid JSON array of exactly 5 lowercase, hyphenated tag strings — no markdown, no explanation.';
      const user = `Suggest 5 relevant tags for this blog post:\n\n${content.slice(0, 2000)}`;
      const raw = await this.callMessages(user, system, 256);
      return JSON.parse(this.stripFences(raw));
    } catch (err) {
      console.error('Anthropic suggestTags error:', err);
      return new MockAIProvider().suggestTags(content);
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      const system = 'You are a skilled content editor. Write a concise, engaging summary in 2 sentences (max 250 characters). Output only the summary text — no quotes, no labels.';
      const user = `Summarize this blog post:\n\n${content.slice(0, 3000)}`;
      return (await this.callMessages(user, system, 200)).trim();
    } catch (err) {
      console.error('Anthropic generateSummary error:', err);
      return new MockAIProvider().generateSummary(content);
    }
  }

  async checkGrammar(text: string): Promise<GrammarSuggestion[]> {
    try {
      const system = 'You are a grammar and spelling checker. Respond with ONLY a valid JSON array of objects — no markdown, no explanation. Each object must have: original (string), suggestion (string), reason (string), offset (number), length (number).';
      const user = `Find all grammar and spelling issues in this text:\n\n${text.slice(0, 2000)}`;
      const raw = await this.callMessages(user, system, 512);
      const parsed = JSON.parse(this.stripFences(raw));
      return Array.isArray(parsed) ? parsed : (parsed.issues ?? []);
    } catch (err) {
      console.error('Anthropic checkGrammar error:', err);
      return new MockAIProvider().checkGrammar(text);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    return new MockAIProvider().generateImage(prompt);
  }

  async generateContent(topic: string, tone: string = 'professional', length: string = 'medium'): Promise<string> {
    try {
      const wordCount = length === 'short' ? '300-400' : length === 'long' ? '900-1200' : '500-700';
      const system = 'You are an expert blog writer. Write complete, high-quality blog posts in markdown. Output only the blog post — no preamble, no meta-commentary.';
      const user = `Write a complete blog post about "${topic}".
- Tone: ${tone}
- Target length: ${wordCount} words
- Use markdown: H2 headers, bullet lists where appropriate, bold key terms
- Structure: engaging intro, 3-4 substantive sections, actionable conclusion`;
      return (await this.callMessages(user, system, 2048)).trim();
    } catch (err) {
      console.error('Anthropic generateContent error:', err);
      return new MockAIProvider().generateContent(topic, tone, length);
    }
  }
}

// ── OpenAI Provider ──────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async suggestTitles(content: string): Promise<string[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional blog editor. Suggest 5 catchy, SEO-friendly titles for the following content. Return ONLY a JSON object: {\"titles\": [\"...\", ...]}" },
          { role: "user", content: content.slice(0, 4000) }
        ],
        response_format: { type: "json_object" }
      });
      const data = JSON.parse(response.choices[0].message.content || '{"titles": []}');
      return data.titles || data.suggestions || [];
    } catch (err) {
      console.error("OpenAI suggestTitles error:", err);
      return new MockAIProvider().suggestTitles(content);
    }
  }

  async suggestTags(content: string): Promise<string[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Suggest 5 relevant tech/lifestyle tags for the following content. Return ONLY a JSON object: {\"tags\": [\"...\", ...]}" },
          { role: "user", content: content.slice(0, 2000) }
        ],
        response_format: { type: "json_object" }
      });
      const data = JSON.parse(response.choices[0].message.content || '{"tags": []}');
      return data.tags || [];
    } catch (err) {
      console.error("OpenAI suggestTags error:", err);
      return new MockAIProvider().suggestTags(content);
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Write a concise 2-sentence summary (max 250 chars) of the following blog post." },
          { role: "user", content: content.slice(0, 3000) }
        ]
      });
      return response.choices[0].message.content || "";
    } catch (err) {
      console.error("OpenAI generateSummary error:", err);
      return new MockAIProvider().generateSummary(content);
    }
  }

  async checkGrammar(text: string): Promise<GrammarSuggestion[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Identify grammar and spelling issues in the following text. Return ONLY a JSON object: {\"issues\": [{\"original\": ..., \"suggestion\": ..., \"reason\": ..., \"offset\": ..., \"length\": ...}]}" },
          { role: "user", content: text.slice(0, 2000) }
        ],
        response_format: { type: "json_object" }
      });
      const data = JSON.parse(response.choices[0].message.content || '{"issues": []}');
      return data.issues || [];
    } catch (err) {
      console.error("OpenAI checkGrammar error:", err);
      return new MockAIProvider().checkGrammar(text);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    // If we have an Unsplash key, we can use it here too, or just use the high-quality Unsplash source
    return new MockAIProvider().generateImage(prompt);
  }

  async generateContent(topic: string, tone: string = 'professional', length: string = 'medium'): Promise<string> {
    try {
      const wordCount = length === 'short' ? '300-400' : length === 'long' ? '900-1200' : '500-700';
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert blog writer. Write complete, high-quality blog posts in markdown. Output only the blog post — no preamble, no meta-commentary.' },
          { role: 'user', content: `Write a complete blog post about "${topic}".\n- Tone: ${tone}\n- Target length: ${wordCount} words\n- Use markdown: H2 headers, bullet lists where appropriate, bold key terms\n- Structure: engaging intro, 3-4 substantive sections, actionable conclusion` },
        ],
      });
      return response.choices[0].message.content?.trim() ?? '';
    } catch (err) {
      console.error('OpenAI generateContent error:', err);
      return new MockAIProvider().generateContent(topic, tone, length);
    }
  }
}

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const claudeModel = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Prefer Anthropic Claude if provided (use Haiku by default to save credits)
    if (anthropicKey && anthropicKey.length > 20) {
      console.log(`AI: Initializing Anthropic Provider (model=${claudeModel})`);
      provider = new AnthropicProvider(anthropicKey, claudeModel);
    } else if (openaiKey && openaiKey.startsWith('sk-') && openaiKey.length > 20) {
      console.log('AI: Initializing OpenAI Provider (gpt-4o-mini)');
      provider = new OpenAIProvider(openaiKey);
    } else if (geminiKey && geminiKey.startsWith('AIzaSy') && geminiKey.length > 20) {
      console.log('AI: Initializing Gemini Provider (will fallback to Mock on errors)');
      provider = new GeminiProvider(geminiKey);
    } else {
      console.log('AI: Using Mock Provider (no valid API key)');
      provider = new MockAIProvider();
    }
  }
  return provider!;
}

// Reset provider (useful if key changes)
export function resetAIProvider(): void {
  provider = null;
}
