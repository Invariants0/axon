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

function getDayPeriod() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
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
