// Toggle Password Visibility
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

togglePasswordButtons.forEach(button => {
    button.addEventListener('click', function () {
        const input = this.previousElementSibling;
        
        if (input.type === 'password') {
            input.type = 'text';
            this.classList.remove('bi-eye');
            this.classList.add('bi-eye-slash');
        } else {
            input.type = 'password';
            this.classList.remove('bi-eye-slash');
            this.classList.add('bi-eye');
        }
    });
});

// ── API BASE URL ─────────────────────────────────────────────────────────────
const API_BASE = (window.APP_CONFIG?.API_BASE ?? 'http://localhost:5000') + '/api/auth';

// ── SAVE SESSION ─────────────────────────────────────────────────────────────
function saveSession(token, user) {
    localStorage.setItem('ql_token', token);
    localStorage.setItem('ql_user', JSON.stringify(user));
}

// ── REDIRECT TO LANDING PAGE ─────────────────────────────────────────────────
function goToLanding() {
    window.location.href = '../landingPage/landingPage.html';
}

// ── DISABLE / ENABLE BUTTON ──────────────────────────────────────────────────
function setLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<i class="bi bi-hourglass-split"></i> Please wait...'
        : label;
}

// Form Submission Handlers
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn    = loginForm.querySelector('.btn-submit');
    const email  = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;

    setLoading(btn, true);
    try {
        const url = `${API_BASE}/login`;
        const res  = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || `Login failed. Status: ${res.status}`);
        }
        const data = await res.json();

        saveSession(data.token, data.user);
        showSuccessMessage('Login successful! Redirecting...');
        setTimeout(goToLanding, 1200);
    } catch (err) {
        console.error('Login error:', err);
        showErrorMessage(err.message || 'Connection error. Check console for details.');
        setLoading(btn, false, '<span>Login</span> <i class="bi bi-arrow-right"></i>');
    }
});

signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn             = signupForm.querySelector('.btn-submit');
    const name            = signupForm.querySelector('input[type="text"]').value.trim();
    const email           = signupForm.querySelector('input[type="email"]').value.trim();
    const password        = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match!');
        return;
    }
    if (password.length < 8) {
        showErrorMessage('Password must be at least 8 characters.');
        return;
    }

    setLoading(btn, true);
    try {
        const url = `${API_BASE}/register`;
        const res  = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || `Sign up failed. Status: ${res.status}`);
        }
        const data = await res.json();

        saveSession(data.token, data.user);
        showSuccessMessage('Account created! Redirecting...');
        setTimeout(goToLanding, 1200);
    } catch (err) {
        console.error('Signup error:', err);
        showErrorMessage(err.message || 'Connection error. Check console for details.');
        setLoading(btn, false, '<span>Create Account</span> <i class="bi bi-arrow-right"></i>');
    }
});

// Social Login Handler
const socialButtons = document.querySelectorAll('.social-btn');

socialButtons.forEach(button => {
    button.addEventListener('click', function (e) {
        e.preventDefault();
        const provider = this.classList[1];
        console.log(`Login with ${provider}`);
        showSuccessMessage(`Connecting to ${provider}...`);
    });
});

// Display Success Message
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #16a34a, #22c55e);
        color: #fff;
        padding: 14px 20px;
        border-radius: 10px;
        box-shadow: 0 6px 24px rgba(34,197,94,0.32);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(34,197,94,0.40);
    `;
    messageDiv.innerHTML = '<i class="bi bi-check-circle-fill"></i> ' + message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Display Error Message
function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #b91c1c, #f87171);
        color: #fff;
        padding: 14px 20px;
        border-radius: 10px;
        box-shadow: 0 6px 24px rgba(248,113,113,0.32);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(248,113,113,0.40);
    `;
    messageDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> ' + message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Add animations to stylesheet dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Input focus animation
const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');

inputs.forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
    });
    
    input.addEventListener('blur', function () {
        this.parentElement.style.boxShadow = 'none';
    });
});
