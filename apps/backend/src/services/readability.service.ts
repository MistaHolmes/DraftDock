// Readability scoring — runs entirely locally, no API key needed

export interface ReadabilityResult {
  score: number;           // 0-100 Flesch Reading Ease
  grade: string;           // e.g. "College", "10th Grade"
  level: 'easy' | 'moderate' | 'difficult';
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  wordCount: number;
  sentenceCount: number;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjustments
  if (word.endsWith('e') && count > 1) count--;
  if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) count++;
  return Math.max(1, count);
}

export function analyzeReadability(text: string): ReadabilityResult {
  // Strip markdown syntax
  const clean = text
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/`[^`]+`/g, '')            // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '')    // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links
    .replace(/#{1,6}\s+/g, '')          // headings
    .replace(/[*_~]{1,3}/g, '')         // bold/italic/strike
    .replace(/>\s+/g, '')              // blockquotes
    .replace(/[-*+]\s+/g, '')           // list markers
    .replace(/\d+\.\s+/g, '')           // ordered list markers
    .trim();

  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = clean.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);

  if (words.length === 0 || sentences.length === 0) {
    return { score: 0, grade: 'N/A', level: 'moderate', avgWordsPerSentence: 0, avgSyllablesPerWord: 0, wordCount: 0, sentenceCount: 0 };
  }

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease
  const score = Math.round(206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord));
  const clampedScore = Math.max(0, Math.min(100, score));

  let grade: string;
  let level: 'easy' | 'moderate' | 'difficult';

  if (clampedScore >= 90) { grade = '5th Grade'; level = 'easy'; }
  else if (clampedScore >= 80) { grade = '6th Grade'; level = 'easy'; }
  else if (clampedScore >= 70) { grade = '7th Grade'; level = 'easy'; }
  else if (clampedScore >= 60) { grade = '8th-9th Grade'; level = 'moderate'; }
  else if (clampedScore >= 50) { grade = '10th-12th Grade'; level = 'moderate'; }
  else if (clampedScore >= 30) { grade = 'College'; level = 'difficult'; }
  else { grade = 'College Graduate'; level = 'difficult'; }

  return {
    score: clampedScore,
    grade,
    level,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    wordCount: words.length,
    sentenceCount: sentences.length,
  };
}
