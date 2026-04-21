const commandInput = document.getElementById('commandInput');
const runBtn       = document.getElementById('runBtn');
const results      = document.getElementById('results');
const statusBox    = document.getElementById('status');
const statusText   = document.getElementById('statusText');
const modeBtns     = document.querySelectorAll('.mode-btn');

let currentMode = 'presentation';

// ── Mode config ──────────────────────────────────────────────
const modeConfig = {
  presentation: {
    quickId:     'quickPresentation',
    placeholder: 'give opening...',
  },
  spoken: {
    quickId:     'quickSpoken',
    placeholder: 'give daily...',
  },
  interview: {
    quickId:     'quickInterview',
    placeholder: 'give introduce...',
  },
  debate: {
    quickId:     'quickDebate',
    placeholder: 'give argue...',
  },
  vocabulary: {
    quickId:     'quickVocabulary',
    placeholder: 'give academic...',
  },
  grammar: {
    quickId:     'quickGrammar',
    placeholder: 'give tense...',
  },
  conversation: {
    quickId:     'quickConversation',
    placeholder: 'give explaining...',
  },
};

// ── Mode Toggle ──────────────────────────────────────────────
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    currentMode = mode;

    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Hide all quick button groups
    Object.values(modeConfig).forEach(cfg => {
      const el = document.getElementById(cfg.quickId);
      if (el) el.classList.add('hidden');
    });

    // Show relevant quick buttons
    const cfg = modeConfig[mode];
    const el = document.getElementById(cfg.quickId);
    if (el) el.classList.remove('hidden');

    commandInput.placeholder = cfg.placeholder;
    commandInput.value = 'give';
    results.innerHTML = '';
    clearStatus();
  });
});

// ── Status helpers ───────────────────────────────────────────
function setStatus(message, type = '') {
  statusBox.className = `status ${type}`.trim();
  statusText.textContent = message;
  statusBox.classList.remove('hidden');
}
function clearStatus() {
  statusBox.className = 'status hidden';
  statusText.textContent = '';
}

// ── Command helpers ──────────────────────────────────────────
function normalizeCommand(cmd) {
  return cmd.trim().replace(/\s+/g, ' ').toLowerCase();
}

function detectCategory(command, mode) {
  const cmd = normalizeCommand(command);

  const categoryMaps = {
    spoken: {
      daily: 'daily', opinion: 'opinion', storytelling: 'storytelling',
      emotion: 'emotion', polite: 'polite', advanced: 'advanced'
    },
    presentation: {
      opening: 'opening', body: 'body', closing: 'closing',
      qa: 'qa', advanced: 'advanced'
    },
    interview: {
      introduce: 'introduce', strength: 'strength', challenge: 'challenge',
      question: 'question', closing: 'closing', advanced: 'advanced'
    },
    debate: {
      agree: 'agree', disagree: 'disagree', argue: 'argue',
      rebut: 'rebut', conclude: 'conclude', advanced: 'advanced'
    },
    vocabulary: {
      academic: 'academic', business: 'business', descriptive: 'descriptive',
      emotion: 'emotion', phrasal: 'phrasal', advanced: 'advanced'
    },
    grammar: {
      tense: 'tense', conditionals: 'conditionals', passive: 'passive',
      modal: 'modal', relative: 'relative', advanced: 'advanced'
    },
    conversation: {
      explaining: 'explaining', happened: 'happened', describe: 'describe',
      asking: 'asking', refuse: 'refuse', advanced: 'advanced'
    }
  };

  const map = categoryMaps[mode] || {};
  for (const [keyword, cat] of Object.entries(map)) {
    if (cmd.includes(keyword)) return cat;
  }
  return 'general';
}

// ── Card renderer ────────────────────────────────────────────
function renderCards(items) {
  results.innerHTML = '';

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    if (currentMode === 'conversation') card.classList.add('card-conversation');
    card.style.animationDelay = `${index * 0.05}s`;

    const pronTipHTML = item.pronunciation_tip
      ? `<div class="line prontip">
           <span class="label">Tip</span>
           <span>${item.pronunciation_tip}</span>
         </div>`
      : '';

    // Conversation pattern mode — special layout
    if (currentMode === 'conversation') {
      const examplesHTML = Array.isArray(item.examples)
        ? item.examples.map((ex, i) => `
            <div class="conv-example">
              <span class="conv-ex-num">${i + 1}</span>
              <span>${ex}</span>
            </div>`).join('')
        : `<div class="conv-example"><span class="conv-ex-num">1</span><span>${item.example || '—'}</span></div>`;

      card.innerHTML = `
        <div class="card-number">Pattern ${String(index + 1).padStart(2, '0')}</div>
        <div class="conv-situation">${item.situation || item.use_when || '—'}</div>
        <h3 class="conv-pattern">${item.pattern || item.phrase || '—'}</h3>
        <div class="card-divider"></div>
        <div class="line sinhala">
          <span class="label">Sinhala</span>
          <span>${item.sinhala_meaning || '—'}</span>
        </div>
        <div class="conv-examples-label">Examples</div>
        <div class="conv-examples">${examplesHTML}</div>
        ${pronTipHTML}
        <button class="copy-btn">Copy pattern</button>
      `;

      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', async () => {
        const exLines = Array.isArray(item.examples)
          ? item.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')
          : `1. ${item.example}`;
        const lines = [
          `Pattern: ${item.pattern || item.phrase}`,
          `Situation: ${item.situation || item.use_when}`,
          `Sinhala: ${item.sinhala_meaning}`,
          `Examples:\n${exLines}`
        ];
        if (item.pronunciation_tip) lines.push(`Tip: ${item.pronunciation_tip}`);
        try {
          await navigator.clipboard.writeText(lines.join('\n'));
          copyBtn.textContent = '✓ Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => { copyBtn.textContent = 'Copy pattern'; copyBtn.classList.remove('copied'); }, 1500);
        } catch {
          copyBtn.textContent = 'Failed';
          setTimeout(() => { copyBtn.textContent = 'Copy pattern'; }, 1500);
        }
      });

      results.appendChild(card);
      return;
    }

    // Default card layout
    card.innerHTML = `
      <div class="card-number">Phrase ${String(index + 1).padStart(2, '0')}</div>
      <h3>${item.phrase || '—'}</h3>
      <div class="card-divider"></div>
      <div class="line sinhala">
        <span class="label">Sinhala</span>
        <span>${item.sinhala_meaning || '—'}</span>
      </div>
      <div class="line usewhen">
        <span class="label">Use when</span>
        <span>${item.use_when || '—'}</span>
      </div>
      <div class="line example">
        <span class="label">Example</span>
        <span>${item.example || '—'}</span>
      </div>
      ${pronTipHTML}
      <button class="copy-btn">Copy phrase</button>
    `;

    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      const lines = [
        item.phrase,
        `Sinhala: ${item.sinhala_meaning}`,
        `Use when: ${item.use_when}`,
        `Example: ${item.example}`
      ];
      if (item.pronunciation_tip) lines.push(`Tip: ${item.pronunciation_tip}`);
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        copyBtn.textContent = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copy phrase'; copyBtn.classList.remove('copied'); }, 1500);
      } catch {
        copyBtn.textContent = 'Failed';
        setTimeout(() => { copyBtn.textContent = 'Copy phrase'; }, 1500);
      }
    });

    results.appendChild(card);
  });
}

// ── Main run ─────────────────────────────────────────────────
async function runCommand(command) {
  const normalized = normalizeCommand(command);
  if (!normalized.startsWith('give')) {
    setStatus('Type a command starting with "give".', 'error');
    results.innerHTML = '';
    return;
  }

  clearStatus();
  results.innerHTML = '';

  const modeLabels = {
    presentation: 'presentation phrases',
    spoken:       'spoken English phrases',
    interview:    'interview phrases',
    debate:       'debate & discussion phrases',
    vocabulary:   'vocabulary words',
    grammar:      'grammar examples',
    conversation: 'conversation patterns'
  };
  setStatus(`Generating fresh ${modeLabels[currentMode] || 'phrases'}…`, 'loading');
  runBtn.disabled = true;

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command:  normalized,
        category: detectCategory(normalized, currentMode),
        mode:     currentMode
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Something went wrong.');
    if (!Array.isArray(data.items) || data.items.length === 0) throw new Error('No phrases received.');

    clearStatus();
    renderCards(data.items);
  } catch (error) {
    setStatus(`${error.message}`, 'error');
    results.innerHTML = '';
  } finally {
    runBtn.disabled = false;
  }
}

// ── Event listeners ──────────────────────────────────────────
runBtn.addEventListener('click', () => runCommand(commandInput.value));

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runCommand(commandInput.value);
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.quick-buttons button');
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  commandInput.value = cmd;
  runCommand(cmd);
});
