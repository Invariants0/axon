const DEBUG = false;  // Real API calls enabled

const COLORS = {
    bg: getComputedStyle(document.documentElement).getPropertyValue('--color-bg'),
    fg: getComputedStyle(document.documentElement).getPropertyValue('--color-fg'),
    divider: getComputedStyle(document.documentElement).getPropertyValue('--color-divider'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--color-accent'),
    panel: getComputedStyle(document.documentElement).getPropertyValue('--color-panel'),
    strip: getComputedStyle(document.documentElement).getPropertyValue('--color-strip'),
    account: getComputedStyle(document.documentElement).getPropertyValue('--color-account'),
};

const LEVELS = {
    1: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--level-1')),
    2: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--level-2')),
    3: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--level-3')),
    4: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--level-4')),
    5: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--level-5')),
};


const syntheticChatHistory = [
    { id: 1, title: 'Chat 1' },
    { id: 2, title: 'Chat 2' }
];

const syntheticChatMessages = [
    { sender: 'user', text: 'Hello AXON!' },
    { sender: 'llm', text: 'Hello! How can I assist you today?' }
];

async function apiGet(path, fallbackValue) {
    if (DEBUG) {
        return fallbackValue;
    }

    try {
        const response = await fetch(path, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('GET failed: ' + path);
        }

        return await response.json();
    } catch (_) {
        return fallbackValue;
    }
}

async function apiPost(path, payload, fallbackValue) {
    if (DEBUG) {
        return fallbackValue;
    }

    try {
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('POST failed: ' + path);
        }

        return await response.json();
    } catch (_) {
        return fallbackValue;
    }
}

async function fetchChatMessages() {
    if (DEBUG) {
        return syntheticChatMessages;
    }

    try {
        if (!currentChatId) {
            return [];
        }

        const response = await getTasks(currentChatId);
        const items = Array.isArray(response && response.items) ? response.items : [];
        const messages = [];

        items.forEach(function(task) {
            const title = task && task.title ? String(task.title) : 'Untitled task';
            const status = task && task.status ? String(task.status) : 'queued';
            messages.push({ sender: 'user', text: title });

            if (status === 'completed') {
                const responseText = extractTaskResponseText(task);
                if (responseText) {
                    messages.push({ sender: 'llm', text: responseText });
                }
            } else if (status === 'failed') {
                messages.push({ sender: 'llm', text: 'Task failed. Please retry.' });
            }
        });

        return messages;
    } catch (_) {
        return syntheticChatMessages;
    }
}

function extractTaskResponseText(task) {
    const raw = String(task && task.result ? task.result : '').trim();
    if (!raw) return '';

    const finalDoubleQuoted = raw.match(/"final"\s*:\s*"([\s\S]*?)"/);
    if (finalDoubleQuoted && finalDoubleQuoted[1]) {
        return finalDoubleQuoted[1].replace(/\\n/g, '\n').trim();
    }

    const finalSingleQuoted = raw.match(/'final'\s*:\s*'([\s\S]*?)'/);
    if (finalSingleQuoted && finalSingleQuoted[1]) {
        return finalSingleQuoted[1].replace(/\\n/g, '\n').trim();
    }

    return raw.length > 800 ? `${raw.slice(0, 800)}...` : raw;
}

function delay(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

async function waitForTaskCompletion(taskId) {
    const maxAttempts = 40;
    const intervalMs = 1500;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
            const task = await getTask(taskId);
            const status = task && task.status ? String(task.status) : '';
            if (status === 'completed' || status === 'failed') {
                return task;
            }
        } catch (_) {
            // Keep polling on transient errors.
        }

        await delay(intervalMs);
    }

    return null;
}

async function renderChatPanel() {
    const messages = await fetchChatMessages();
    console.log('Rendering chat panel with messages:', messages);
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'chat-message ' + msg.sender;
        div.textContent = msg.text;
        container.appendChild(div);
    });
}

async function handleSend() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    if (DEBUG) {
        syntheticChatMessages.push({ sender: 'user', text });
        syntheticChatMessages.push({ sender: 'llm', text: 'Synthetic reply to: ' + text });
        await renderChatPanel();
        return;
    }

    try {
        if (!currentChatId) {
            const chat = await createChat('New Chat');
            currentChatId = chat && chat.id ? String(chat.id) : null;
            await renderChatHistory();
        }

        const createdTask = await createTask(text, 'Created from chat input', currentChatId);
        await renderChatHistory();
        await renderChatPanel();

        const taskId = createdTask && createdTask.id ? String(createdTask.id) : '';
        if (taskId) {
            void (async function() {
                await waitForTaskCompletion(taskId);
                await renderChatHistory();
                await renderChatPanel();
                await renderThoughtProcess();
                await renderModelStats();
            })();
        }

        return;
    } catch (_) {
        // Fall through to synthetic fallback behavior.
    }

    // Fallback behavior if request fails.
    syntheticChatMessages.push({ sender: 'user', text });
    syntheticChatMessages.push({ sender: 'llm', text: 'Unable to reach backend. Please retry.' });
    await renderChatPanel();
}
const syntheticThoughtProcess = [
    ['input', 'Received user input.'],
    ['analysis', 'Analyzing context...'],
    ['generation', 'Generating response...'],
    ['output', 'Response sent.']
];
const syntheticAccount = { name: 'Sushant Shah', email: 'mail@sushantshah.dev' };
const syntheticStats = 'Model: GPT-4.1 | Tokens: 1024 | Latency: 120ms';
let hasShownDashboardGreeting = false;
let currentAccountName = 'there';
let currentAccountEmail = '';
let currentChatId = null;

function getChatIdFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const value = params.get('chat');
        return value ? String(value) : null;
    } catch (_) {
        return null;
    }
}

function syncChatUrl(chatId, replace) {
    if (!window.history || !window.history.pushState || !window.history.replaceState) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    if (chatId) {
        params.set('chat', String(chatId));
    } else {
        params.delete('chat');
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}${window.location.hash || ''}` : `${window.location.pathname}${window.location.hash || ''}`;
    const state = { chatId: chatId ? String(chatId) : null };

    if (replace) {
        window.history.replaceState(state, '', nextUrl);
        return;
    }

    window.history.pushState(state, '', nextUrl);
}

async function applyChatSelection(chatId, options) {
    const opts = options || {};
    currentChatId = chatId ? String(chatId) : null;
    setActiveChat(currentChatId);

    if (opts.replaceUrl) {
        syncChatUrl(currentChatId, true);
    } else if (opts.pushUrl) {
        syncChatUrl(currentChatId, false);
    }

    if (!opts.skipPanelRender) {
        showMiddlePanelSection('history');
        await renderChatPanel();
    }
}

const THEME_SETTINGS_KEY = 'axon.themeSettings';
const THEME_TINT_MIN = 5;
const THEME_TINT_MAX = 25;
const THEME_TINT_STEP = 5;

function byId(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const el = byId(id);
    if (!el) return;
    el.textContent = value;
}

function setActiveChat(chatId) {
    const items = Array.from(document.querySelectorAll('.chat-history-item[data-chat-id]'));
    items.forEach(function(item) {
        const isActive = String(item.dataset.chatId || '') === String(chatId || '');
        item.classList.toggle('is-active', isActive);
    });
}

function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeThemeTint(value) {
    const numeric = Number.isFinite(value) ? value : Number.parseInt(value, 10);
    const safe = Number.isFinite(numeric) ? numeric : THEME_TINT_MIN;
    const clamped = clampNumber(safe, THEME_TINT_MIN, THEME_TINT_MAX);
    return Math.round(clamped / THEME_TINT_STEP) * THEME_TINT_STEP;
}

function isVisible(el) {
    return Boolean(el && !el.classList.contains('is-hidden'));
}

function registerModalDismiss(modal, closeModal) {
    if (!modal) return;

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isVisible(modal)) {
            closeModal();
        }
    });
}

function normalizeHexColor(value) {
    const trimmed = String(value || '').trim();
    const hex3 = /^#([0-9a-fA-F]{3})$/;
    const hex6 = /^#([0-9a-fA-F]{6})$/;
    if (hex6.test(trimmed)) {
        return trimmed;
    }
    if (hex3.test(trimmed)) {
        const c = trimmed.slice(1);
        return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
    }
    return '#5f7dff';
}

function rgbToHex(r, g, b) {
    const toHex = function(value) {
        return clampNumber(Math.round(value), 0, 255).toString(16).padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hueToThemeHex(hue) {
    const normalizedHue = ((Number(hue) % 360) + 360) % 360;
    const saturation = 0.82;
    const lightness = 0.60;

    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const segment = normalizedHue / 60;
    const x = chroma * (1 - Math.abs((segment % 2) - 1));

    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (segment >= 0 && segment < 1) {
        r1 = chroma;
        g1 = x;
    } else if (segment < 2) {
        r1 = x;
        g1 = chroma;
    } else if (segment < 3) {
        g1 = chroma;
        b1 = x;
    } else if (segment < 4) {
        g1 = x;
        b1 = chroma;
    } else if (segment < 5) {
        r1 = x;
        b1 = chroma;
    } else {
        r1 = chroma;
        b1 = x;
    }

    const m = lightness - chroma / 2;
    return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

function hexToHue(hexColor) {
    const hex = normalizeHexColor(hexColor).slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) return 0;

    let hue;
    if (max === r) {
        hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
        hue = 60 * (((b - r) / delta) + 2);
    } else {
        hue = 60 * (((r - g) / delta) + 4);
    }

    return Math.round((hue + 360) % 360);
}

function saveThemeSettings(settings) {
    try {
        localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {
        // Ignore storage failures (private mode, quota, etc.)
    }
}

function loadThemeSettings() {
    try {
        const raw = localStorage.getItem(THEME_SETTINGS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return {
            mode: parsed && parsed.mode === 'dark' ? 'dark' : 'light',
            color: normalizeHexColor(parsed && parsed.color ? parsed.color : '#5f7dff'),
            tint: normalizeThemeTint(parsed && parsed.tint)
        };
    } catch (_) {
        return null;
    }
}

function applyThemeSettings(settings) {
    const mode = settings && settings.mode === 'dark' ? 'dark' : 'light';
    const color = normalizeHexColor(settings && settings.color ? settings.color : '#5f7dff');
    const tintNumber = normalizeThemeTint(settings && settings.tint);
    const tint = `${tintNumber}%`;

    document.documentElement.setAttribute('data-theme', mode);
    document.body.setAttribute('data-theme', mode);
    document.documentElement.style.setProperty('--theme-color', color);
    document.documentElement.style.setProperty('--theme-tint', tint);
}

function getFirstName(name) {
    return (name || 'there').trim().split(/\s+/)[0] || 'there';
}

async function sha256Hex(input) {
    const bytes = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getGravatarUrl(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const hash = await sha256Hex(normalizedEmail);
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=64`;
}

function setupProfileMenu() {
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    if (!profileBtn || !profileMenu) return;

    function closeMenu() {
        profileMenu.classList.add('is-hidden');
        profileBtn.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
        profileMenu.classList.remove('is-hidden');
        profileBtn.setAttribute('aria-expanded', 'true');
    }

    profileBtn.onclick = function(e) {
        e.stopPropagation();
        if (profileMenu.classList.contains('is-hidden')) {
            openMenu();
        } else {
            closeMenu();
        }
    };

    profileMenu.onclick = function(e) {
        e.stopPropagation();
    };

    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
}

function setupSettingsModal() {
    const modal = byId('settings-modal');
    const openFromMenuBtn = byId('profile-menu-settings');
    const closeBtn = byId('settings-close-btn');
    const darkModeToggle = byId('settings-dark-mode');
    const hueControl = byId('settings-hue-control');
    const hueInput = byId('settings-theme-hue');
    const hueSwatch = byId('settings-theme-hue-swatch');
    const tintButtons = Array.from(document.querySelectorAll('.settings-tint-btn'));
    const profileMenu = byId('profile-menu');
    let selectedTint = THEME_TINT_MIN;
    let selectedHue = 226;

    if (!modal || !openFromMenuBtn || !closeBtn || !darkModeToggle || !hueControl || !hueInput || !hueSwatch || tintButtons.length === 0) {
        return;
    }

    function setSelectedTint(tint) {
        selectedTint = normalizeThemeTint(tint);
        tintButtons.forEach(function(btn) {
            const value = normalizeThemeTint(btn.dataset.tint);
            const isActive = value === selectedTint;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function closeModal() {
        modal.classList.add('is-hidden');
    }

    function setHueSliderCollapsed(collapsed) {
        hueControl.classList.toggle('is-collapsed', collapsed);
        hueSwatch.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    function setSelectedHue(hue) {
        selectedHue = clampNumber(Number.parseInt(hue, 10) || 0, 0, 360);
        hueInput.value = selectedHue;
        hueSwatch.style.background = hueToThemeHex(selectedHue);
    }

    function openModal() {
        const style = getComputedStyle(document.documentElement);
        const currentTheme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'light';
        const currentColor = normalizeHexColor(style.getPropertyValue('--theme-color'));
        const currentTint = (style.getPropertyValue('--theme-tint') || '0%').trim();

        darkModeToggle.checked = currentTheme === 'dark';
        setSelectedHue(hexToHue(currentColor));
        setSelectedTint(currentTint);
        setHueSliderCollapsed(true);

        modal.classList.remove('is-hidden');
    }

    function applySettingsInstantly() {
        const isDark = darkModeToggle.checked;
        const color = hueToThemeHex(selectedHue);
        const tint = normalizeThemeTint(selectedTint);
        const mode = isDark ? 'dark' : 'light';

        applyThemeSettings({ mode, color, tint });
        saveThemeSettings({ mode, color, tint });
    }

    tintButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            setSelectedTint(btn.dataset.tint);
            applySettingsInstantly();
        });
    });

    darkModeToggle.addEventListener('change', applySettingsInstantly);
    hueSwatch.addEventListener('click', function() {
        const collapsed = hueControl.classList.contains('is-collapsed');
        setHueSliderCollapsed(!collapsed);
    });

    hueInput.addEventListener('input', function() {
        setSelectedHue(hueInput.value);
        applySettingsInstantly();
    });

    openFromMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (profileMenu) {
            profileMenu.classList.add('is-hidden');
        }
        openModal();
    });

    closeBtn.addEventListener('click', closeModal);
    registerModalDismiss(modal, closeModal);
}

function setupProfileModal() {
    const modal = byId('profile-modal');
    const openFromMenuBtn = byId('profile-menu-profile');
    const closeBtn = byId('profile-close-btn');
    const profileForm = byId('profile-form');
    const passwordForm = byId('password-form');
    const nameInput = byId('profile-name-input');
    const emailInput = byId('profile-email-input');
    const currentPasswordInput = byId('profile-current-password');
    const newPasswordInput = byId('profile-new-password');
    const confirmPasswordInput = byId('profile-confirm-password');
    const statusEl = byId('profile-modal-status');
    const profileMenu = byId('profile-menu');

    if (
        !modal ||
        !openFromMenuBtn ||
        !closeBtn ||
        !profileForm ||
        !passwordForm ||
        !nameInput ||
        !emailInput ||
        !currentPasswordInput ||
        !newPasswordInput ||
        !confirmPasswordInput ||
        !statusEl
    ) {
        return;
    }

    function setStatus(message, isError) {
        statusEl.textContent = message;
        statusEl.classList.toggle('is-error', Boolean(isError));
    }

    function clearPasswordFields() {
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
    }

    function closeModal() {
        modal.classList.add('is-hidden');
    }

    function openModal() {
        nameInput.value = currentAccountName || '';
        emailInput.value = currentAccountEmail || '';
        clearPasswordFields();
        setStatus('', false);
        modal.classList.remove('is-hidden');
    }

    openFromMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (profileMenu) {
            profileMenu.classList.add('is-hidden');
        }
        openModal();
    });

    closeBtn.addEventListener('click', closeModal);
    registerModalDismiss(modal, closeModal);

    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = String(nameInput.value || '').trim();
        const email = String(emailInput.value || '').trim();

        if (!name) {
            setStatus('Name is required.', true);
            return;
        }

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            setStatus('Please enter a valid email address.', true);
            return;
        }

        // TODO: Replace with real API call.
        // Example: await apiPost('/api/account/profile', { name, email }, null);

        syntheticAccount.name = name;
        syntheticAccount.email = email;
        try {
            localStorage.setItem('axon.account', JSON.stringify({ name, email }));
        } catch (_) {
            // Ignore storage failures.
        }

        currentAccountName = name;
        currentAccountEmail = email;
        await renderAccountInfo();
        if (isVisible(byId('dashboard-main'))) {
            renderDashboardGreeting();
        }

        setStatus('Profile saved.', false);
    });

    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const currentPassword = String(currentPasswordInput.value || '');
        const newPassword = String(newPasswordInput.value || '');
        const confirmPassword = String(confirmPasswordInput.value || '');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setStatus('All password fields are required.', true);
            return;
        }

        if (newPassword.length < 8) {
            setStatus('New password must be at least 8 characters.', true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus('New password and confirmation do not match.', true);
            return;
        }

        // TODO: Replace with real API call.
        // Example: await apiPost('/api/account/reset-password', { currentPassword, newPassword }, null);

        clearPasswordFields();
        setStatus('Password reset request submitted.', false);
    });
}

// Helper Functions (to be implemented)
async function fetchChatHistory() {
    if (DEBUG) {
        return syntheticChatHistory;
    }

    try {
        const response = await getChats();
        const items = Array.isArray(response && response.items) ? response.items : [];
        if (items.length > 0) {
            const hasCurrent = currentChatId
                ? items.some(function(chat) { return String(chat && chat.id ? chat.id : '') === String(currentChatId); })
                : false;

            if (!hasCurrent) {
                currentChatId = String(items[0].id);
            }
        }
        return items.map(function(chat) {
            const chatId = String(chat && chat.id ? chat.id : '');
            const shortId = chatId.slice(0, 8);
            return {
                id: chatId || shortId,
                title: chat && chat.title ? chat.title : `Chat ${shortId || ''}`.trim()
            };
        });
    } catch (_) {
        return syntheticChatHistory;
    }
}

async function fetchThoughtProcess() {
    if (DEBUG) {
        return syntheticThoughtProcess;
    }

    try {
        const system = await getSystemStatus();
        return [
            ['status', `System: ${system && system.status ? system.status : 'unknown'}`],
            ['database', `Database: ${system && system.database ? system.database : 'unknown'}`],
            ['vector', `Vector store: ${system && system.vector_store ? system.vector_store : 'unknown'}`],
            ['agents', `Agents ready: ${system && typeof system.agents_ready !== 'undefined' ? String(system.agents_ready) : 'unknown'}`]
        ];
    } catch (_) {
        return syntheticThoughtProcess;
    }
}

async function fetchAccountInfo() {
    try {
        // Try to get authenticated user info from auth module
        if (typeof getAuthUser === 'function') {
            const authUser = getAuthUser();
            if (authUser && authUser.name) {
                return {
                    name: authUser.name,
                    email: authUser.email || ''
                };
            }
        }
        
        // Fallback to localStorage
        const raw = localStorage.getItem('axon.account');
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                name: parsed && parsed.name ? parsed.name : syntheticAccount.name,
                email: parsed && parsed.email ? parsed.email : syntheticAccount.email
            };
        }
    } catch (_) {
        // Ignore storage failures.
    }
    return syntheticAccount;
}

async function fetchModelStats() {
    if (DEBUG) {
        return syntheticStats;
    }

    try {
        const metrics = await getSystemMetrics();
        if (metrics && typeof metrics === 'object') {
            const parts = [];
            if (typeof metrics.version !== 'undefined') {
                parts.push(`Version: ${metrics.version}`);
            }
            if (typeof metrics.timestamp !== 'undefined') {
                parts.push(`Timestamp: ${metrics.timestamp}`);
            }
            if (typeof metrics.error !== 'undefined') {
                parts.push('Status: degraded');
            }
            return parts.length ? parts.join(' | ') : JSON.stringify(metrics);
        }
    } catch (_) {
        // fall through
    }
    return syntheticStats;
}

// UI Fillers
async function renderChatHistory() {
    const history = await fetchChatHistory();
    const container = document.getElementById('chat-history');
    container.innerHTML = '';

    async function handleRenameChat(chatId, currentTitle) {
        const nextTitle = window.prompt('Rename chat', String(currentTitle || '').trim());
        const normalized = String(nextTitle || '').trim();
        if (!normalized || normalized === String(currentTitle || '').trim()) {
            return;
        }

        try {
            await updateChat(String(chatId), normalized);
            await renderChatHistory();
        } catch (_) {
            // Ignore failures and keep UI state.
        }
    }

    async function handleDeleteChat(chatId) {
        const ok = window.confirm('Delete this chat?');
        if (!ok) {
            return;
        }

        try {
            await deleteChat(String(chatId));

            if (String(currentChatId || '') === String(chatId || '')) {
                currentChatId = null;
                await renderChatHistory();

                if (!currentChatId && !DEBUG) {
                    const created = await createChat('New Chat');
                    currentChatId = created && created.id ? String(created.id) : null;
                    await renderChatHistory();
                }

                syncChatUrl(currentChatId, true);
                await renderChatPanel();
                return;
            }

            await renderChatHistory();
        } catch (_) {
            // Ignore failures and keep UI state.
        }
    }

    history.forEach(chat => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-history-item';
        const title = document.createElement('span');
        title.className = 'chat-history-title';
        title.textContent = chat.title;

        const actions = document.createElement('span');
        actions.className = 'chat-history-actions';

        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.className = 'chat-history-action-btn';
        renameBtn.textContent = '✎';
        renameBtn.title = 'Rename chat';
        renameBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            void handleRenameChat(chat.id, chat.title);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'chat-history-action-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.title = 'Delete chat';
        deleteBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            void handleDeleteChat(chat.id);
        };

        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        button.appendChild(title);
        button.appendChild(actions);
        button.dataset.chatId = chat.id;
        button.onclick = function() {
            void applyChatSelection(chat.id, { pushUrl: true });
        };
        container.appendChild(button);
    });

    setActiveChat(currentChatId);
}

async function renderThoughtProcess() {
    const thoughts = await fetchThoughtProcess();
    const container = document.getElementById('thought-process');
    const isFirstThoughtRender = container.dataset.thoughtsRendered !== 'true';
    let list = container.querySelector('.thought-list');
    if (!list) {
        list = document.createElement('div');
        list.className = 'thought-list';
        container.innerHTML = '';
        container.appendChild(list);
    }

    const occurrenceByBaseKey = Object.create(null);
    const nextEntries = thoughts.map(function(tuple) {
        const type = Array.isArray(tuple) ? String(tuple[0] || 'step') : 'step';
        const text = Array.isArray(tuple) ? String(tuple[1] || '') : String(tuple || '');
        const baseKey = `${type}::${text}`;
        const occurrence = (occurrenceByBaseKey[baseKey] || 0) + 1;
        occurrenceByBaseKey[baseKey] = occurrence;
        return {
            type,
            text,
            key: `${baseKey}::${occurrence}`
        };
    });

    const existingItems = Array.from(list.querySelectorAll('.thought-item'));
    const existingKeys = existingItems.map(function(item) {
        return String(item.dataset.key || '');
    });

    const shouldReset =
        existingKeys.length > nextEntries.length ||
        existingKeys.some(function(key, index) {
            return key !== nextEntries[index].key;
        });

    function createThoughtItem(entry, withEnterAnimation) {
        const item = document.createElement('div');
        item.className = 'thought-item ' + (withEnterAnimation ? 'thought-item-enter ' : '') + 'thought-' + entry.type.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        item.dataset.key = entry.key;

        const typeEl = document.createElement('div');
        typeEl.className = 'thought-type';
        typeEl.textContent = entry.type;

        const textEl = document.createElement('div');
        textEl.className = 'thought-text';
        textEl.textContent = entry.text;

        item.appendChild(typeEl);
        item.appendChild(textEl);
        return item;
    }

    if (shouldReset) {
        list.innerHTML = '';
        if (isFirstThoughtRender) {
            for (let index = 0; index < nextEntries.length; index += 1) {
                const entry = nextEntries[index];
                const item = createThoughtItem(entry, true);
                list.appendChild(item);

                requestAnimationFrame(function() {
                    item.classList.add('thought-item-enter-active');
                });

                if (index < nextEntries.length - 1) {
                    await delay(260);
                }
            }
        } else {
            nextEntries.forEach(function(entry) {
                const item = createThoughtItem(entry, false);
                list.appendChild(item);
            });
        }
        container.dataset.thoughtsRendered = 'true';
        return;
    }

    const startIndex = existingItems.length;
    for (let index = startIndex; index < nextEntries.length; index += 1) {
        const entry = nextEntries[index];
        const item = createThoughtItem(entry, true);
        list.appendChild(item);

        requestAnimationFrame(function() {
            item.classList.add('thought-item-enter-active');
        });
    }

    container.dataset.thoughtsRendered = 'true';
}

async function renderAccountInfo() {
    const info = await fetchAccountInfo();
    currentAccountName = (info && info.name) ? String(info.name) : 'there';
    currentAccountEmail = (info && info.email) ? String(info.email) : '';

    const profileName = document.getElementById('profile-name');
    const profileAvatar = document.getElementById('profile-avatar');

    if (profileName) {
        profileName.textContent = getFirstName(currentAccountName);
    }
    if (profileAvatar) {
        profileAvatar.src = await getGravatarUrl(info && info.email ? info.email : '');
    }
}

async function renderModelStats() {
    const stats = await fetchModelStats();
    document.getElementById('model-stats').textContent = typeof stats === 'string'
        ? stats
        : JSON.stringify(stats);
}

function getDayPeriod() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

function renderDashboardGreeting() {
    const dashboardContent = document.querySelector('.dashboard-main-content');
    if (!dashboardContent) return;

    const firstName = getFirstName(currentAccountName);
    const ctaText = "Let's get to work";

    dashboardContent.innerHTML = '';
    const line = document.createElement('p');
    line.className = 'dashboard-hero-line';

    if (!hasShownDashboardGreeting) {
        line.textContent = `Good ${getDayPeriod()}, ${firstName}. ${ctaText}`;
    } else {
        line.textContent = ctaText;
    }

    dashboardContent.appendChild(line);

    hasShownDashboardGreeting = true;
}

function showMiddlePanelSection(section) {
    const dashboardMain = byId('dashboard-main');
    const chatPanel = byId('chat-panel');

    if (!dashboardMain || !chatPanel) return;

    if (section === 'dashboard') {
        renderDashboardGreeting();
        dashboardMain.classList.remove('is-hidden');
        chatPanel.classList.add('is-hidden');
        return;
    }

    dashboardMain.classList.add('is-hidden');
    chatPanel.classList.remove('is-hidden');
}

async function refreshAfterChatSend() {
    await renderThoughtProcess();
    await renderModelStats();
}

function applyThemeAtBoot() {
    const savedTheme = loadThemeSettings();
    if (savedTheme) {
        applyThemeSettings(savedTheme);
        return;
    }
    applyThemeSettings({ mode: 'light', color: '#5f7dff', tint: 5 });
}

function releaseThemePreloadLock() {
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            document.documentElement.classList.remove('theme-preload');
        });
    });
}

async function renderInitialUI() {
    const chatIdFromUrl = getChatIdFromUrl();
    if (chatIdFromUrl) {
        currentChatId = chatIdFromUrl;
    }

    await renderChatHistory();

    if (!DEBUG && !currentChatId) {
        try {
            const created = await createChat('New Chat');
            currentChatId = created && created.id ? String(created.id) : null;
            await renderChatHistory();
        } catch (_) {
            // Keep UI usable with synthetic fallbacks.
        }
    }

    syncChatUrl(currentChatId, true);

    await renderChatPanel();
    await renderThoughtProcess();
    await renderAccountInfo();
    await renderModelStats();
}

function setupUIControllers() {
    setupProfileMenu();
    setupProfileModal();
    setupSettingsModal();
}

function bindNavigationActions() {
    const dashboardBtn = byId('dashboard-btn');
    const newChatBtn = byId('new-chat-btn');

    if (dashboardBtn) {
        dashboardBtn.onclick = function() {
            showMiddlePanelSection('dashboard');
        };
    }

    if (newChatBtn) {
        newChatBtn.onclick = async function() {
            if (DEBUG) {
                showMiddlePanelSection('history');
                return;
            }

            try {
                const created = await createChat('New Chat');
                currentChatId = created && created.id ? String(created.id) : null;
                await renderChatHistory();
                await applyChatSelection(currentChatId, { pushUrl: true });
            } catch (_) {
                // Ignore and keep current view.
            }

            showMiddlePanelSection('history');
        };
    }
}

function bindChatActions() {
    const sendBtn = byId('send-btn');
    const chatInput = byId('chat-input');

    if (sendBtn) {
        sendBtn.onclick = async function() {
            await handleSend();
            await refreshAfterChatSend();
        };
    }

    if (chatInput) {
        chatInput.onkeydown = async function(e) {
            if (e.key === 'Enter') {
                await handleSend();
                await refreshAfterChatSend();
            }
        };
    }
}

function bindBrowserNavigation() {
    window.addEventListener('popstate', function() {
        const chatId = getChatIdFromUrl();
        void applyChatSelection(chatId, { replaceUrl: true });
    });
}

/**
 * Handle authentication state changes
 */
function setupAuthListener() {
    window.addEventListener('authChanged', async function(event) {
        // Update account info when user logs in/out
        await renderAccountInfo();
        
        // Update dashboard greeting if visible
        if (isVisible(byId('dashboard-main'))) {
            renderDashboardGreeting();
        }
    });
}

// Initial Render
window.onload = async function() {
    applyThemeAtBoot();
    releaseThemePreloadLock();
    bindBrowserNavigation();

    // Set up auth listener first
    setupAuthListener();

    // Wait a bit for auth to initialize (auth.js runs before this)
    // Then proceed with UI rendering
    if (!isAuthenticated()) {
        // User is not authenticated, login modal will be shown by auth.js
        // Don't render main UI until they log in
        return;
    }

    await renderInitialUI();
    setupUIControllers();
    
    // Show chat panel if chat ID in URL, otherwise show dashboard
    const chatIdFromUrl = getChatIdFromUrl();
    showMiddlePanelSection(chatIdFromUrl ? 'history' : 'dashboard');

    bindNavigationActions();
    bindChatActions();

    // Listen for successful login to initialize UI
    window.addEventListener('authChanged', async function initUiAfterLogin(event) {
        if (event.detail) {
            // User just logged in
            await renderInitialUI();
            setupUIControllers();
            const chatIdFromUrl = getChatIdFromUrl();
            showMiddlePanelSection(chatIdFromUrl ? 'history' : 'dashboard');
            bindNavigationActions();
            bindChatActions();
            // Remove this listener after first login
            window.removeEventListener('authChanged', initUiAfterLogin);
        }
    });
};
