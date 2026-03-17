/**
 * Authentication Module
 * Handles user login, signup, and session management
 */

const AUTH_TOKEN_KEY = 'axon.authToken';
const AUTH_USER_KEY = 'axon.user';
const AUTH_EXPIRES_KEY = 'axon.tokenExpires';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

let authState = {
    isAuthenticated: false,
    user: null,
    token: null,
    expiresAt: null
};

let inactivityTimer = null;

function clearError(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('is-hidden');
    el.classList.remove('is-error');
}

function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-hidden');
    el.classList.add('is-error');
}

/**
 * Initialize authentication module
 * Check for existing session and set up event listeners
 */
function initializeAuth() {
    // Load stored auth state
    loadAuthState();

    // Set up event listeners
    setupAuthEventListeners();

    // Check if user is still authenticated
    if (authState.isAuthenticated && authState.expiresAt) {
        const now = Date.now();
        if (now > authState.expiresAt) {
            // Token expired
            clearAuthState();
        } else {
            // Check if app can see the login modal
            if (document.getElementById('login-modal')) {
                document.getElementById('login-modal').classList.add('is-hidden');
            }
            resetInactivityTimer();
        }
    }

    // Show login modal if not authenticated
    if (!authState.isAuthenticated) {
        showLoginModal();
    }
}

/**
 * Load authentication state from localStorage
 */
function loadAuthState() {
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const userJson = localStorage.getItem(AUTH_USER_KEY);
        const expiresAt = localStorage.getItem(AUTH_EXPIRES_KEY);

        if (token && userJson) {
            authState.token = token;
            authState.user = JSON.parse(userJson);
            authState.expiresAt = parseInt(expiresAt, 10);
            authState.isAuthenticated = true;
        }
    } catch (e) {
        console.error('Failed to load auth state:', e);
        clearAuthState();
    }
}

/**
 * Save authentication state to localStorage
 */
function saveAuthState() {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, authState.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authState.user));
        localStorage.setItem(AUTH_EXPIRES_KEY, String(authState.expiresAt));
    } catch (e) {
        console.error('Failed to save auth state:', e);
    }
}

/**
 * Clear authentication state
 */
function clearAuthState() {
    authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        expiresAt: null
    };
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_EXPIRES_KEY);
    } catch (e) {
        console.error('Failed to clear auth state:', e);
    }
    clearInactivityTimer();
}

/**
 * Get current authentication token
 */
function getAuthToken() {
    return authState.token;
}

/**
 * Get current authenticated user
 */
function getAuthUser() {
    return authState.user;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return authState.isAuthenticated && authState.token;
}

/**
 * Handle user login
 */
async function handleLogin(email, password) {
    const loginBtn = document.getElementById('login-submit-btn');
    const errorMsg = document.getElementById('login-error-msg');

    try {
        loginBtn.disabled = true;
        clearError(errorMsg);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();

        // Store auth state
        authState.token = data.access_token;
        authState.user = data.user;
        authState.expiresAt = data.expires_at;
        authState.isAuthenticated = true;

        saveAuthState();

        // Hide login modal
        hideLoginModal();

        // Reset inactivity timer
        resetInactivityTimer();

        // Notify app that auth changed
        window.dispatchEvent(new CustomEvent('authChanged', { detail: authState.user }));

        return true;
    } catch (error) {
        console.error('Login error:', error);
        showError(errorMsg, error.message || 'Login failed. Please try again.');
        return false;
    } finally {
        loginBtn.disabled = false;
    }
}

/**
 * Handle user signup
 */
async function handleSignup(name, email, password, confirmPassword) {
    const signupBtn = document.getElementById('signup-submit-btn');
    const errorMsg = document.getElementById('signup-error-msg');

    try {
        signupBtn.disabled = true;
        clearError(errorMsg);

        // Validate passwords match
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Validate password strength
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Signup failed');
        }

        const data = await response.json();

        // Store auth state
        authState.token = data.access_token;
        authState.user = data.user;
        authState.expiresAt = data.expires_at;
        authState.isAuthenticated = true;

        saveAuthState();

        // Hide login modal
        hideLoginModal();

        // Reset inactivity timer
        resetInactivityTimer();

        // Notify app that auth changed
        window.dispatchEvent(new CustomEvent('authChanged', { detail: authState.user }));

        return true;
    } catch (error) {
        console.error('Signup error:', error);
        showError(errorMsg, error.message || 'Signup failed. Please try again.');
        return false;
    } finally {
        signupBtn.disabled = false;
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        // Attempt to notify backend of logout
        if (authState.token) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authState.token}`,
                    'Content-Type': 'application/json',
                }
            }).catch(() => {
                // Ignore errors on logout
            });
        }
    } catch (e) {
        // Ignore
    } finally {
        // Clear local state
        clearAuthState();
        showLoginModal();

        // Notify app that auth changed
        window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
    }
}

/**
 * Show login modal
 */
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('is-hidden');
    }
}

/**
 * Hide login modal
 */
function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('is-hidden');
    }
}

/**
 * Setup event listeners for auth UI
 */
function setupAuthEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await handleLogin(email, password);
        });
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;
            await handleSignup(name, email, password, confirm);
        });
    }

    // Toggle between login and signup
    const toggleSignupBtn = document.getElementById('toggle-signup-btn');
    if (toggleSignupBtn) {
        toggleSignupBtn.addEventListener('click', () => {
            document.getElementById('login-form-container').classList.add('is-hidden');
            document.getElementById('signup-form-container').classList.remove('is-hidden');
        });
    }

    const toggleLoginBtn = document.getElementById('toggle-login-btn');
    if (toggleLoginBtn) {
        toggleLoginBtn.addEventListener('click', () => {
            document.getElementById('signup-form-container').classList.add('is-hidden');
            document.getElementById('login-form-container').classList.remove('is-hidden');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('profile-menu-signout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await handleLogout();
        });
    }

    // Inactivity tracking
    if (document.addEventListener) {
        document.addEventListener('mousedown', resetInactivityTimer);
        document.addEventListener('keydown', resetInactivityTimer);
        document.addEventListener('touchstart', resetInactivityTimer);
    }
}

/**
 * Reset inactivity timer
 */
function resetInactivityTimer() {
    if (!isAuthenticated()) {
        return;
    }

    clearInactivityTimer();

    inactivityTimer = setTimeout(() => {
        console.log('User inactive, logging out');
        handleLogout();
    }, INACTIVITY_TIMEOUT);
}

/**
 * Clear inactivity timer
 */
function clearInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}
