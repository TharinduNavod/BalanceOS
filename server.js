import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

function buildPrompt(mode, category, command) {

  // ── Spoken English ──────────────────────────────────────────
  if (mode === 'spoken') {
    const labels = {
      general:      'general spoken English',
      daily:        'daily conversation',
      opinion:      'expressing opinions and agreeing/disagreeing',
      storytelling: 'storytelling and narrative',
      emotion:      'expressing emotions and feelings',
      polite:       'polite requests and formal spoken English',
      advanced:     'advanced spoken English with idioms and natural flow'
    };
    const style = labels[category] || labels.general;
    return `You are generating fresh spoken English phrases for someone who wants to improve their everyday English speaking.

Task: Generate exactly 10 fresh and varied ${style} phrases/expressions.
User command: ${command}

Requirements:
- Return ONLY valid JSON, no markdown, no backticks.
- Schema:
{
  "items": [
    {
      "phrase": "...",
      "sinhala_meaning": "...",
      "use_when": "...",
      "example": "...",
      "pronunciation_tip": "..."
    }
  ]
}
- Exactly 10 items.
- Each phrase must be natural, commonly used spoken English (not textbook).
- sinhala_meaning: natural and simple — how a Sri Lankan would say it.
- use_when: explain the everyday situation clearly.
- example: a short, natural spoken sentence using the phrase.
- pronunciation_tip: one short tip on stress, linking, or common mistakes.
- Include phrasal verbs, fillers, idioms, collocations, and natural transitions.
- Make the set fresh and genuinely useful each time.`;
  }

  // ── Presentation ────────────────────────────────────────────
  if (mode === 'presentation') {
    const labels = {
      general:  'general presentation',
      opening:  'presentation opening',
      body:     'presentation body / explaining content',
      closing:  'presentation closing and conclusion',
      qa:       'presentation Q&A handling',
      advanced: 'advanced academic or professional presentation'
    };
    const style = labels[category] || labels.general;
    return `You are generating fresh English phrases for presentation practice.

Task: Generate exactly 10 fresh and varied ${style} phrases.
User command: ${command}

Requirements:
- Return ONLY valid JSON, no markdown, no backticks.
- Schema:
{
  "items": [
    {
      "phrase": "...",
      "sinhala_meaning": "...",
      "use_when": "...",
      "example": "...",
      "pronunciation_tip": "..."
    }
  ]
}
- Exactly 10 items.
- Each phrase must be useful in real presentations.
- sinhala_meaning: natural and simple Sinhala translation.
- use_when: explain the presentation situation clearly.
- example: a short natural sentence using the phrase in a presentation context.
- pronunciation_tip: one short tip on stress, rhythm, or confident delivery.
- Avoid very common overused phrases unless necessary.
- Make the set fresh each time.`;
  }

  // ── Interview English ───────────────────────────────────────
  if (mode === 'interview') {
    const labels = {
      general:   'general job interview English',
      introduce: 'self-introduction in interviews',
      strength:  'talking about strengths and skills',
      challenge: 'describing challenges and problem-solving',
      question:  'asking smart questions to the interviewer',
      closing:   'closing the interview strongly',
      advanced:  'advanced professional interview language'
    };
    const style = labels[category] || labels.general;
    return `You are generating fresh English phrases for someone preparing for job interviews in English.

Task: Generate exactly 10 fresh and varied ${style} phrases.
User command: ${command}

Requirements:
- Return ONLY valid JSON, no markdown, no backticks.
- Schema:
{
  "items": [
    {
      "phrase": "...",
      "sinhala_meaning": "...",
      "use_when": "...",
      "example": "...",
      "pronunciation_tip": "..."
    }
  ]
}
- Exactly 10 items.
- Each phrase must be professional, natural, and suitable for English job interviews.
- sinhala_meaning: simple natural Sinhala meaning a Sri Lankan job seeker would understand.
- use_when: describe the specific interview moment this phrase fits.
- example: a realistic sentence an interview candidate would say.
- pronunciation_tip: a tip on stress, clarity, or confident delivery.
- Include a mix of: STAR-method phrases, diplomatic language, confident assertions, and professional transitions.
- Make the set fresh and genuinely useful for real interviews.`;
  }

  // ── Debate & Discussion ─────────────────────────────────────
  if (mode === 'debate') {
    const labels = {
      general:  'general debate and discussion English',
      agree:    'agreeing and building on others points',
      disagree: 'disagreeing politely and firmly',
      argue:    'making a strong argument and presenting evidence',
      rebut:    'rebutting and countering arguments',
      conclude: 'concluding a debate point',
      advanced: 'advanced academic debate language'
    };
    const style = labels[category] || labels.general;
    return `You are generating fresh English phrases for debate, discussion, and critical thinking practice.

Task: Generate exactly 10 fresh and varied ${style} phrases.
User command: ${command}

Requirements:
- Return ONLY valid JSON, no markdown, no backticks.
- Schema:
{
  "items": [
    {
      "phrase": "...",
      "sinhala_meaning": "...",
      "use_when": "...",
      "example": "...",
      "pronunciation_tip": "..."
    }
  ]
}
- Exactly 10 items.
- Each phrase must be useful in academic debates, classroom discussions, or professional meetings.
- sinhala_meaning: natural, simple Sinhala.
- use_when: describe the exact debate/discussion moment to use this phrase.
- example: a realistic sentence someone would say in a debate or discussion.
- pronunciation_tip: a tip on emphasis, tone, or assertive delivery.
- Include: hedging language, strong assertions, linking words, concession phrases, and critical reasoning expressions.
- Make the set fresh and powerful each time.`;
  }

  // ── Vocabulary Builder ──────────────────────────────────────
  if (mode === 'vocabulary') {
    const labels = {
      general:     'general advanced English vocabulary',
      academic:    'academic and formal vocabulary',
      business:    'business and professional vocabulary',
      descriptive: 'descriptive and creative vocabulary',
      emotion:     'vocabulary for expressing emotions and feelings',
      phrasal:     'advanced phrasal verbs and multi-word expressions',
      advanced:    'C1-C2 level sophisticated vocabulary'
    };
    const style = labels[category] || labels.general;
    return `You are generating fresh English vocabulary for someone who wants to expand their word power.

Task: Generate exactly 10 fresh and varied ${style} words or expressions.
User command: ${command}

Requirements:
- Return ONLY valid JSON, no markdown, no backticks.
- Schema:
{
  "items": [
    {
      "phrase": "...",
      "sinhala_meaning": "...",
      "use_when": "...",
      "example": "...",
      "pronunciation_tip": "..."
    }
  ]
}
- Exactly 10 items.
- "phrase" field: the word or expression (include part of speech in brackets, e.g. "meticulous (adj)").
- sinhala_meaning: natural Sinhala meaning or equivalent concept.
- use_when: describe when and in what context to use this word.
- example: a vivid, memorable example sentence that makes the meaning clear.
- pronunciation_tip: syllable stress, IPA hint, or common mispronunciation to avoid.
- Choose words that are genuinely useful, interesting, and at upper-intermediate to advanced level.
- Vary between adjectives, verbs, nouns, adverbs, and expressions.
- Make the set feel curated — like a vocabulary teacher carefully picked them.`;
  }

  // ── Grammar in Context ──────────────────────────────────────
  if (mode === 'grammar') {
    const labels = {
      general:      'general English grammar in context',
      tense:        'verb tenses used naturally in context',
      conditionals: 'conditionals (if/unless/provided that)',
      passive:      'passive voice and formal structures',
      modal:        'modal verbs (can, could, should, might, must)',
      relative:     'relative clauses and complex sentences',
      advanced:     'advanced grammar structures (inversion, cleft sentences, subjunctive)'
    };
    const style = labels[category] || labels.general;
    return `You are generating English grammar examples shown in real-world context for someone learning grammar through usage.

Task: Generate exactly 10 fresh examples of ${style}.
User command: ${command}

Requirements:
- Return ONLY valid JSON, no markdown, no backticks.
- Schema:
{
  "items": [
    {
      "phrase": "...",
      "sinhala_meaning": "...",
      "use_when": "...",
      "example": "...",
      "pronunciation_tip": "..."
    }
  ]
}
- Exactly 10 items.
- "phrase" field: the grammar structure or pattern shown as a template (e.g. "If I had [past perfect], I would have [past perfect]").
- sinhala_meaning: explain the grammar concept simply in Sinhala — what it means and what it does.
- use_when: describe the real-life situation where this grammar structure is used.
- example: a natural, realistic sentence using the structure.
- pronunciation_tip: a note on stress/intonation changes with this structure, or a common mistake Sinhala speakers make.
- Focus on grammar that is genuinely useful and commonly confused by Sinhala speakers.
- Show grammar in memorable, real-world context — not dry textbook examples.
- Make the set feel like a lesson from a friendly, practical teacher.`;
  }

  // ── Conversation Patterns ───────────────────────────────────
  if (mode === 'conversation') {
    const labels = {
      general:    'general real-life conversation patterns',
      explaining: 'explaining something in detail to someone',
      happened:   'describing what happened / telling what occurred',
      describe:   'describing a person, place, or thing in conversation',
      asking:     'asking someone for something politely or directly',
      refuse:     'politely refusing or saying no to someone',
      advanced:   'advanced natural conversation patterns with complex structures'
    };
    const style = labels[category] || labels.general;
    return `You are generating English conversation pattern cards for a Sri Lankan learner who wants to practice real spoken English.

Task: Generate exactly 10 fresh and varied sentence patterns for: ${style}.
User command: ${command}

These are NOT just phrases. Each item is a PATTERN that the learner can reuse by swapping parts.
Think of it like: when you're in a real conversation and you want to explain something, say what happened, describe something, ask for something, or say no politely — what sentence structures do native speakers naturally use?

Requirements:
- Return ONLY valid JSON, no markdown, no backticks.
- Schema:
{
  "items": [
    {
      "situation": "...",
      "pattern": "...",
      "sinhala_meaning": "...",
      "examples": ["...", "...", "..."],
      "pronunciation_tip": "..."
    }
  ]
}
- Exactly 10 items.
- "situation": one short sentence describing WHEN you use this pattern in real life (e.g. "When explaining why something went wrong to a friend").
- "pattern": the reusable sentence structure. Use [brackets] for the swappable parts. Example: "The reason I [did X] was because [Y]." or "I was just about to [verb] when [something happened]."
- "sinhala_meaning": explain what this pattern means and does — naturally in Sinhala, like a teacher explaining to a student.
- "examples": exactly 3 natural, realistic example sentences using this pattern in real conversations. Each should feel like something a real person would say.
- "pronunciation_tip": one short, practical tip — stress pattern, natural linking, or a common mistake Sinhala speakers make with this structure.
- Cover a variety of everyday situations: talking about past events, feelings, plans, problems, opinions, requests, etc.
- The patterns should feel natural and conversational — not formal or textbook-like.
- Make each pattern genuinely reusable — the learner should be able to swap the [bracketed] parts and use it immediately.
- Make the set fresh and varied each time.`;
  }

  return '';

app.post('/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in .env file.' });
  }

  const command  = (req.body?.command  || 'give').trim();
  const category = (req.body?.category || 'general').trim();
  const mode     = (req.body?.mode     || 'presentation').trim();
  const prompt   = buildPrompt(mode, category, command);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.1, responseMimeType: 'application/json' }
        })
      }
    );

    const raw = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: raw?.error?.message || 'Gemini API request failed.' });
    }

    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'Empty response from Gemini.' });

    let parsed;
    try { parsed = JSON.parse(text); }
    catch { return res.status(500).json({ error: 'Could not parse Gemini JSON response.' }); }

    if (!Array.isArray(parsed.items)) {
      return res.status(500).json({ error: 'Gemini response format was invalid.' });
    }

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error.' });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
