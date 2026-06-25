// ============================================================
// NagarSeva AI Module — Groq API (llama-3.1-8b-instant)
// NagBot: STRICTLY a personal report tracker for the logged-in user.
// It shows their reports, statuses, and nothing else.
// ============================================================

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL   = 'llama-3.1-8b-instant';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

// ── Core API call ──────────────────────────────────────────
async function askGroq(messages, maxTokens = 400) {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY not set in .env');
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature: 0.3 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ── 1. DUPLICATE DETECTION ────────────────────────────────
export async function checkDuplicateReport(newReport, existingReports) {
  if (!existingReports || existingReports.length === 0) return null;

  const nearby = existingReports.filter(r => {
    const dlat = Math.abs(r.latitude  - parseFloat(newReport.latitude));
    const dlng = Math.abs(r.longitude - parseFloat(newReport.longitude));
    return dlat < 0.02 && dlng < 0.02;
  });

  if (nearby.length === 0) return null;

  const existingList = nearby
    .slice(0, 8)
    .map((r, i) => `${i + 1}. [${r.type}] "${r.title}" — ${r.description?.slice(0, 80)} (status: ${r.status})`)
    .join('\n');

  const prompt = [
    {
      role: 'system',
      content: `You are a duplicate-report detector. Given a new report and nearby existing reports, decide if it's a duplicate.
Respond ONLY in this exact JSON format (no markdown):
{"isDuplicate": true/false, "matchIndex": 0-based-index-or-null, "reason": "short one-line explanation"}`,
    },
    {
      role: 'user',
      content: `NEW REPORT:\nType: ${newReport.type}\nTitle: ${newReport.title}\nDescription: ${newReport.description}\n\nNEARBY EXISTING:\n${existingList}`,
    },
  ];

  try {
    const raw = await askGroq(prompt, 180);
    const clean = raw.replace(/```json?/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(clean);
    if (result.isDuplicate && result.matchIndex !== null) {
      return { ...result, matchedReport: nearby[result.matchIndex] };
    }
    return null;
  } catch (e) {
    console.warn('Duplicate check failed:', e);
    return null;
  }
}

// ── 2. CHATBOT STATE ──────────────────────────────────────
let chatHistory    = [];
let userReportsRef = [];   // ONLY the logged-in user's own reports
let currentUsername = '';

/** Call this after login with the user's own reports only */
export function setChatReports(myReports, username) {
  userReportsRef  = myReports  || [];
  currentUsername = username   || 'Citizen';
}

// ── 3. SYSTEM PROMPT ─────────────────────────────────────
function buildSystemPrompt() {
  const total    = userReportsRef.length;
  const resolved = userReportsRef.filter(r => r.status === 'fixed').length;
  const review   = userReportsRef.filter(r => r.status === 'review').length;
  const open     = userReportsRef.filter(r => r.status === 'reported').length;

  const reportList = userReportsRef.length === 0
    ? 'No reports filed yet.'
    : userReportsRef.map((r, i) =>
        `${i + 1}. "${r.title}" | Type: ${r.type} | Status: ${
          r.status === 'fixed' ? '✅ Resolved' :
          r.status === 'review' ? '🔄 Under Review' : '📋 Reported'
        } | Filed: ${new Date(r.timestamp).toLocaleDateString('en-IN')}`
      ).join('\n');

  return `You are NagBot — the friendly AI assistant built into NagarSeva, a civic issue reporting platform.

LOGGED-IN USER: @${currentUsername}
THEIR REPORTS (${total} total | ${open} open | ${review} under review | ${resolved} resolved):
${reportList}

YOU CAN HELP WITH TWO THINGS:

1. PERSONAL REPORT TRACKING:
   - Show, list, and explain @${currentUsername}'s own reports above.
   - Tell them status, resolution progress, and summary counts.

2. HOW THE NAGARASEVA APP WORKS — answer questions like:
   - "How do I create a report?" → Click the map on Incident Radar, drop a pin, fill the form, submit.
   - "How do I use the map?" → Open Incident Radar. Tap/click anywhere on the map to drop a pin. A Quick Report form will pop up.
   - "What is the Public Feed?" → Shows all reports from all citizens on the platform.
   - "What do the statuses mean?" → 📋 Reported = new, 🔄 Under Review = being looked at, ✅ Resolved = fixed.
   - "What are badges/points?" → You earn points and badges by filing verified reports. Check the Leaderboard.
   - "What is the Leaderboard?" → Ranks citizens by points earned from filing and resolving reports.
   - "How do I edit my profile?" → Click the pencil icon on your user card in the sidebar.
   - "What report types exist?" → Pothole, Garbage, Street Light, Water Leak, Encroachment, Other.
   - "How does duplicate detection work?" → Groq AI scans nearby reports when you submit. If a similar one exists nearby, it warns you.
   - "What is NagarSeva?" → A civic platform where citizens report local issues and track their resolution.

STRICT RULES:
1. ONLY answer about: the user's own reports OR how NagarSeva works.
2. NEVER help with coding, general knowledge, news, jokes, recipes, or anything unrelated to NagarSeva.
3. If asked something completely unrelated, say: "I'm NagBot — I can help you track your reports or explain how NagarSeva works. What would you like to know?"
4. Never make up report data. Only use what's listed above.
5. Keep replies concise, clear, and friendly. Use emojis sparingly.`;
}

// ── 4. SEND MESSAGE ───────────────────────────────────────
export async function sendChatMessage(userText) {
  // Client-side quick-reject for obvious off-topic (saves API call)
  const offTopicPatterns = [
    /\b(python|java(?!script)|code|html|css|programming|algorithm|debug)\b/i,
    /\b(weather|news|recipe|joke|story|game|movie|music|cricket|football)\b/i,
    /\b(chatgpt|openai|gemini|claude|llm|machine learning)\b/i,
    /\b(stock|crypto|bitcoin|invest|finance|politic|election)\b/i,
  ];
  // App-related keywords — always allow these through
  const isAppRelated = /report|status|filed|resolve|pothole|garbage|leakage|hazard|my issue|fixed|review|submitted|map|pin|badge|points|leaderboard|feed|profile|nagarseva|nagbot|how (do|to|does)|what is|create|submit|duplicate|section|dashboard/i.test(userText);

  const isObviouslyOffTopic = !isAppRelated && offTopicPatterns.some(p => p.test(userText));

  if (isObviouslyOffTopic) {
    return "I'm NagBot — I can help you track your reports or explain how NagarSeva works. What would you like to know? 😊";
  }

  // Special shortcut: "show my reports" → render directly without AI call
  if (/show.*(my )?report|my report|list report/i.test(userText)) {
    return buildReportListReply();
  }

  chatHistory.push({ role: 'user', content: userText });

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...chatHistory.slice(-6),
  ];

  const reply = await askGroq(messages, 350);
  chatHistory.push({ role: 'assistant', content: reply });
  return reply;
}

function buildReportListReply() {
  if (userReportsRef.length === 0) {
    return "You haven't filed any reports yet. Go to the **Incident Radar** and click **+ Quick Report** to file your first one!";
  }
  const lines = userReportsRef.map((r, i) => {
    const statusEmoji = r.status === 'fixed' ? '✅' : r.status === 'review' ? '🔄' : '📋';
    const statusText  = r.status === 'fixed' ? 'Resolved' : r.status === 'review' ? 'Under Review' : 'Reported';
    const date = new Date(r.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${statusEmoji} **${r.title}**\n   Type: ${r.type} | Status: ${statusText} | Filed: ${date}`;
  }).join('\n\n');

  const resolved = userReportsRef.filter(r => r.status === 'fixed').length;
  const review   = userReportsRef.filter(r => r.status === 'review').length;
  const open     = userReportsRef.filter(r => r.status === 'reported').length;

  return `Here are your **${userReportsRef.length} report(s)**:\n\n${lines}\n\n📊 Summary: ${open} open · ${review} under review · ${resolved} resolved`;
}

export function clearChatHistory() {
  chatHistory = [];
}

// ── 5. CHATBOT UI ─────────────────────────────────────────
export function initChatbot() {
  const chatHTML = `
    <div id="nagbot-container" class="nagbot-container" aria-label="NagBot Report Tracker">
      <button id="nagbot-toggle" class="nagbot-toggle" title="Track My Reports">
        <span class="nagbot-toggle-icon nagbot-icon-chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span class="nagbot-toggle-icon nagbot-icon-close" style="display:none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </span>
        <span class="nagbot-badge">AI</span>
      </button>

      <div id="nagbot-window" class="nagbot-window" style="display:none;">
        <div class="nagbot-header">
          <div class="nagbot-header-info">
            <div class="nagbot-avatar-sm">N</div>
            <div>
              <p class="nagbot-title">NagBot</p>
              <p class="nagbot-subtitle">Your NagarSeva Assistant • Powered by Groq</p>
            </div>
          </div>
          <button id="nagbot-clear" class="nagbot-clear-btn" title="Clear chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>

        <div id="nagbot-messages" class="nagbot-messages">
          <div class="nagbot-msg nagbot-msg-bot">
            <div class="nagbot-msg-avatar">N</div>
            <div class="nagbot-msg-bubble">
              👋 Hi! I'm <strong>NagBot</strong> — your NagarSeva AI assistant.<br><br>
              I can help with two things:<br>
              📋 <strong>Track your reports</strong> — status, progress, counts<br>
              🗺️ <strong>How the app works</strong> — creating reports, features, tips<br><br>
              What would you like to know?
            </div>
          </div>
        </div>

        <div id="nagbot-typing" class="nagbot-typing" style="display:none;">
          <div class="nagbot-msg-avatar">N</div>
          <div class="nagbot-typing-dots"><span></span><span></span><span></span></div>
        </div>

        <!-- Quick action buttons -->
        <div class="nagbot-quick-btns">
          <button class="nagbot-quick-btn" data-msg="show my reports">📋 My Reports</button>
          <button class="nagbot-quick-btn" data-msg="how many are resolved?">✅ Resolved</button>
          <button class="nagbot-quick-btn" data-msg="how do I create a report?">🗺️ How to Report</button>
          <button class="nagbot-quick-btn" data-msg="what features does NagarSeva have?">✨ App Guide</button>
        </div>

        <div class="nagbot-input-row">
          <input id="nagbot-input" class="nagbot-input" type="text" placeholder="Ask about your reports or the app..." maxlength="200" autocomplete="off"/>
          <button id="nagbot-send" class="nagbot-send-btn" title="Send">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHTML);

  const toggle   = document.getElementById('nagbot-toggle');
  const window_  = document.getElementById('nagbot-window');
  const input    = document.getElementById('nagbot-input');
  const sendBtn  = document.getElementById('nagbot-send');
  const clearBtn = document.getElementById('nagbot-clear');
  const messages = document.getElementById('nagbot-messages');
  const typing   = document.getElementById('nagbot-typing');
  const iconChat  = toggle.querySelector('.nagbot-icon-chat');
  const iconClose = toggle.querySelector('.nagbot-icon-close');

  let isOpen = false;

  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    window_.style.display = isOpen ? 'flex' : 'none';
    iconChat.style.display  = isOpen ? 'none' : 'flex';
    iconClose.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) input.focus();
  });

  clearBtn.addEventListener('click', () => {
    clearChatHistory();
    messages.innerHTML = `
      <div class="nagbot-msg nagbot-msg-bot">
        <div class="nagbot-msg-avatar">N</div>
        <div class="nagbot-msg-bubble">Chat cleared! Type <strong>show my reports</strong> to see your reports.</div>
      </div>
    `;
  });

  // Quick buttons
  document.querySelectorAll('.nagbot-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      if (msg) triggerSend(msg);
    });
  });

  async function triggerSend(text) {
    input.value = '';
    sendBtn.disabled = true;
    appendMessage('user', text);
    typing.style.display = 'flex';
    scrollToBottom();
    try {
      const reply = await sendChatMessage(text);
      typing.style.display = 'none';
      appendMessage('bot', reply);
    } catch (err) {
      typing.style.display = 'none';
      appendMessage('bot', `⚠️ Error: ${err.message}`);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    await triggerSend(text);
    input.value = '';
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  function appendMessage(role, text) {
    const isBot = role === 'bot';
    const div = document.createElement('div');
    div.className = `nagbot-msg ${isBot ? 'nagbot-msg-bot' : 'nagbot-msg-user'}`;
    div.innerHTML = isBot
      ? `<div class="nagbot-msg-avatar">N</div><div class="nagbot-msg-bubble">${fmt(text)}</div>`
      : `<div class="nagbot-msg-bubble nagbot-msg-bubble-user">${esc(text)}</div>`;
    messages.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() { messages.scrollTop = messages.scrollHeight; }

  function fmt(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  function esc(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}
