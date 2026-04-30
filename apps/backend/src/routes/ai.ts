import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';
import { getAIProvider } from '../services/ai.service';
import { analyzeReadability } from '../services/readability.service';

const router = Router();

// Helper: try syncUser, return null on auth failure instead of throwing
async function tryGetUser(req: any): Promise<any> {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return null;
    return await syncUser(req);
  } catch (err: any) {
    console.warn('[AI] Auth/sync error:', err.message);
    return null;
  }
}

// POST /api/ai/suggest-titles — generate title suggestions from content
router.post('/suggest-titles', writeLimiter, async (req, res: any) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const provider = getAIProvider();
    const titles = await provider.suggestTitles(content);
    return res.json({ titles });
  } catch (err) {
    console.error('[AI] Error generating titles:', err);
    return res.status(500).json({ error: 'Failed to generate title suggestions' });
  }
});

// POST /api/ai/suggest-tags — recommend tags based on content
router.post('/suggest-tags', writeLimiter, async (req, res: any) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const provider = getAIProvider();
    const tags = await provider.suggestTags(content);
    return res.json({ tags });
  } catch (err) {
    console.error('Error suggesting tags:', err);
    return res.status(500).json({ error: 'Failed to suggest tags' });
  }
});

// POST /api/ai/generate-summary — auto-generate blog summary
router.post('/generate-summary', writeLimiter, async (req, res: any) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const provider = getAIProvider();
    const summary = await provider.generateSummary(content);
    return res.json({ summary });
  } catch (err) {
    console.error('Error generating summary:', err);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/ai/readability — calculate readability score (local, no API key)
router.post('/readability', async (req, res: any) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const result = analyzeReadability(content);
    return res.json(result);
  } catch (err) {
    console.error('Error analyzing readability:', err);
    return res.status(500).json({ error: 'Failed to analyze readability' });
  }
});

// POST /api/ai/grammar-check — check grammar in text
router.post('/grammar-check', writeLimiter, async (req, res: any) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });

    const provider = getAIProvider();
    const suggestions = await provider.checkGrammar(text);
    return res.json({ suggestions });
  } catch (err) {
    console.error('Error checking grammar:', err);
    return res.status(500).json({ error: 'Failed to check grammar' });
  }
});

// POST /api/ai/generate-image — generate cover image from prompt
router.post('/generate-image', writeLimiter, async (req, res: any) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required' });

    const provider = getAIProvider();
    const imageUrl = await provider.generateImage(prompt);
    return res.json({ imageUrl });
  } catch (err) {
    console.error('Error generating image:', err);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
});

// POST /api/ai/generate-content — generate full blog post body from a topic
// Body: { topic: string, tone?: "professional"|"casual"|"educational"|"humorous", length?: "short"|"medium"|"long" }
router.post('/generate-content', writeLimiter, async (req, res: any) => {
  try {
    const { topic, tone = 'professional', length = 'medium' } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'topic is required' });

    const validTones = ['professional', 'casual', 'educational', 'humorous', 'inspirational'];
    const validLengths = ['short', 'medium', 'long'];
    if (tone && !validTones.includes(tone))
      return res.status(400).json({ error: `tone must be one of: ${validTones.join(', ')}` });
    if (length && !validLengths.includes(length))
      return res.status(400).json({ error: `length must be one of: ${validLengths.join(', ')}` });

    const provider = getAIProvider();
    const content = await provider.generateContent(topic, tone, length);
    return res.json({ content });
  } catch (err) {
    console.error('Error generating content:', err);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
});

export default router;
