(function () {
    // ── ELEMENTS ──
    const applyBtn           = document.getElementById('apply-btn-js');
    const leftEmiBtn         = document.querySelector('.left-emi-cal-btn');
    const middleSection      = document.querySelector('.middle-section');
    const emiCalculator      = document.getElementById('emi-calculator');
    const loanAmountInput    = document.getElementById('loan-amount');
    const loanTenureInput    = document.getElementById('loan-tenure');
    const loanAmountValue    = document.getElementById('loan-amount-value');
    const loanTenureValue    = document.getElementById('loan-tenure-value');
    const interestRateLabel  = document.getElementById('interest-rate');
    const emiAmountLabel     = document.getElementById('emi-amount');
    const totalInterestLabel = document.getElementById('total-interest');
    const totalPaymentLabel  = document.getElementById('total-payment');
    const emiProceedBtn      = document.getElementById('emi-proceed-to-appl');
    const applicationOne     = document.getElementById('application-one');
    const applicationTwo     = document.getElementById('application-two');
    const applicationThree   = document.getElementById('application-three');
    const submittedPage      = document.getElementById('submitted-page');
    const applOneForm        = document.getElementById('appl-two-application-form');
    const applTwoNextBtn     = document.querySelector('.appl-two-next-btn');
    const applTwoPrevBtn     = document.querySelector('.appl-two-previous-btn');
    const applThreePrevBtn   = document.getElementById('appl-three-prvs-btn');
    const applThreeSubmitBtn = document.getElementById('appl-three-sbmt-btn');
    const sbmtPgeLoanBtn     = document.getElementById('sbmt-pge-lon-btn');
    const sbmtPgeDtlsBtn     = document.getElementById('sbmt-pge-dtls');
    const backHome           = document.getElementById('bck-hom');

    const RATE = 8.5;

    // ── HELPERS ──
    const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

    function calcEmi(P, rate, months) {
        const r = (rate / 100) / 12;
        if (!months) return { monthly: 0, total: 0, totalInterest: 0 };
        if (r === 0)  { const m = P / months; return { monthly: m, total: P, totalInterest: 0 }; }
        const x = Math.pow(1 + r, months);
        const monthly = (P * r * x) / (x - 1);
        const total   = monthly * months;
        return { monthly, total, totalInterest: total - P };
    }

    function allFilled(container) {
        if (!container) return false;
        return Array.from(container.querySelectorAll('input,select,textarea'))
            .filter(i => i.type !== 'file')
            .every(i => i.value.trim() !== '');
    }

    // ── SHOW / HIDE ──
    const panels = [emiCalculator, applicationOne, applicationTwo, applicationThree, submittedPage];
    function hideAll() { panels.forEach(p => p && (p.style.display = 'none')); }
    function show(el)  { hideAll(); if (el) el.style.display = 'flex'; }

    // ── GRID ──
    let _rh = null;
    function setGrid() {
        const m = document.getElementById('main');
        if (m) m.style.gridTemplateColumns = window.innerWidth >= 1024 ? '1.1fr 1fr 0.9fr' : '1fr';
    }
    function startResize() {
        if (_rh) return;
        _rh = () => { if (middleSection?.style.display !== 'none') setGrid(); };
        window.addEventListener('resize', _rh);
    }
    function stopResize() {
        if (!_rh) return;
        window.removeEventListener('resize', _rh);
        _rh = null;
    }

    // ── EMI ──
    function updateEmi() {
        const P      = Number(loanAmountInput?.value || 0);
        const months = Number(loanTenureInput?.value  || 0);
        const emi    = calcEmi(P, RATE, months);
        if (loanAmountValue)    loanAmountValue.innerText    = P.toLocaleString('en-IN');
        if (loanTenureValue)    loanTenureValue.innerText    = months;
        if (emiAmountLabel)     emiAmountLabel.innerText     = fmt(emi.monthly.toFixed(2));
        if (totalInterestLabel) totalInterestLabel.innerText = fmt(emi.totalInterest.toFixed(2));
        if (totalPaymentLabel)  totalPaymentLabel.innerText  = fmt(emi.total.toFixed(2));
    }
    loanAmountInput?.addEventListener('input', updateEmi);
    loanTenureInput?.addEventListener('input', updateEmi);

    // ── OPEN EMI ──
    function resetEmiSliders() {
        if (loanAmountInput) { loanAmountInput.value = loanAmountInput.min || 1000; }
        if (loanTenureInput) { loanTenureInput.value  = loanTenureInput.min  || 6;    }
    }

    function openEmi() {
        resetEmiSliders();
        if (middleSection) middleSection.style.display = 'flex';
        show(emiCalculator);
        updateEmi();
        setGrid();
        startResize();
    }
    applyBtn?.addEventListener('click', openEmi);
    leftEmiBtn?.addEventListener('click', openEmi);

    // ── FLOW ──
    emiProceedBtn?.addEventListener('click', () => show(applicationOne));

    document.getElementById('appl-two-next')?.addEventListener('click', () => {
        if (!allFilled(applOneForm)) { alert('Please fill all personal information fields.'); return; }
        show(applicationTwo);
    });

    applTwoPrevBtn?.addEventListener('click', () => show(applicationOne));

    applTwoNextBtn?.addEventListener('click', () => {
        const sel    = document.getElementById('js-app-two-slct');
        const cmpy   = document.getElementById('cmpyName');
        const income = document.getElementById('income');
        if (!sel || sel.value === 'Select Type' || !cmpy?.value.trim() || !income?.value.trim()) {
            alert('Please fill all employment details.'); return;
        }
        show(applicationThree);
    });

    applThreePrevBtn?.addEventListener('click', () => show(applicationTwo));

    // ── Live filename feedback for upload boxes ──
    function setupUploadFeedback(inputId, statusId, boxId, iconId) {
        const input  = document.getElementById(inputId);
        const status = document.getElementById(statusId);
        const box    = document.getElementById(boxId);
        const icon   = document.getElementById(iconId);
        if (!input) return;
        input.addEventListener('change', function () {
            if (this.files && this.files.length) {
                const file = this.files[0];
                status.textContent = file.name;
                status.style.color = '#22c55e';
                box.style.borderColor = '#22c55e';
                icon.style.color = '#22c55e';
            } else {
                status.textContent = 'No file chosen';
                status.style.color = '';
                box.style.borderColor = '';
                icon.style.color = '';
            }
        });
    }
    setupUploadFeedback('file-id',     'status-id',     'upload-box-id',     'upload-icon-id');
    setupUploadFeedback('file-income', 'status-income', 'upload-box-income', 'upload-icon-income');

    // ── Validate documents before submit ──
    function validateDocuments() {
        const fileId     = document.getElementById('file-id');
        const fileIncome = document.getElementById('file-income');
        const allowed    = ['image/jpeg','image/png','image/webp','image/gif','image/bmp','application/pdf'];

        if (!fileId?.files.length) {
            showLandingToast('Please upload your ID Proof before submitting.', 'warn'); return false;
        }
        if (!allowed.includes(fileId.files[0].type)) {
            showLandingToast('ID Proof must be an image (JPG, PNG, WEBP) or PDF.', 'warn'); return false;
        }
        if (fileId.files[0].size < 1024) {
            showLandingToast('ID Proof file appears empty. Please upload a valid document.', 'warn'); return false;
        }
        if (!fileIncome?.files.length) {
            showLandingToast('Please upload your Income Proof before submitting.', 'warn'); return false;
        }
        if (!allowed.includes(fileIncome.files[0].type)) {
            showLandingToast('Income Proof must be an image (JPG, PNG, WEBP) or PDF.', 'warn'); return false;
        }
        if (fileIncome.files[0].size < 1024) {
            showLandingToast('Income Proof file appears empty. Please upload a valid document.', 'warn'); return false;
        }
        return true;
    }

    applThreeSubmitBtn?.addEventListener('click', async () => {
        if (!document.getElementById('pan')?.value.trim()) {
            showLandingToast('Please enter PAN / SSN.', 'warn'); return;
        }
        if (!validateDocuments()) return;

        // ── Capture ALL form values NOW, before show() hides/resets anything ──
        const inp  = applOneForm?.querySelectorAll('input') || [];
        const P    = Number(loanAmountInput?.value || 0);
        const mths = Number(loanTenureInput?.value  || 0);
        const emi  = calcEmi(P, RATE, mths);

        const payload = {
            applicantName:  inp[0]?.value.trim() || '',
            email:          inp[1]?.value.trim() || '',
            phone:          inp[2]?.value.trim() || '',
            address:        inp[3]?.value.trim() || '',
            panCard:        document.getElementById('pan')?.value.trim() || '',
            employmentType: document.getElementById('js-app-two-slct')?.value || '',
            companyName:    document.getElementById('cmpyName')?.value.trim() || '',
            monthlyIncome:  document.getElementById('income')?.value.trim() || '',
            loanAmount:    P,
            tenure:        mths,
            interestRate:  RATE,
            monthlyEMI:    +emi.monthly.toFixed(2),
            totalInterest: +emi.totalInterest.toFixed(2),
            totalPayment:  +emi.total.toFixed(2)
        };

        populateSubmitted();
        saveToStorage();
        show(submittedPage);

        // ── POST loan to backend ──
        const token = localStorage.getItem('ql_token');
        if (!token) {
            showLandingToast('Login to save your loan details to your account.', 'warn');
            return;
        }

        try {
            const res  = await fetch((window.APP_CONFIG?.API_BASE ?? 'http://localhost:5000') + '/api/loan/apply', {
                method:  'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body:    JSON.stringify(payload)
            });

            // Safe parse — server might return HTML on unexpected errors
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); }
            catch { throw new Error('Backend server is not reachable. Start the server with: node server.js'); }

            if (!res.ok) {
                showLandingToast(data.message || 'Loan save failed.', 'error');
                return;
            }

            // ── Immediately update all loan panels with the new loan ──
            // Build updated list: new loan first, then any existing cached loans
            const updatedLoans = [data.loan, ...(window._currentLoans || [])];
            renderProfileLoan(data.loan);
            renderHomeLoansSection(updatedLoans);
            renderPaymentSection(updatedLoans);
            // Update apply-button state based on open loan count
            const openCount = updatedLoans.filter(l => l.status !== 'Closed').length;
            setApplyState(openCount >= 3);
            // Background re-fetch to stay in sync with server (no-op if already accurate)
            window._fetchAndRenderLoans?.();
            const emailMsg = data.emailSent
                ? ' Confirmation email sent!'
                : ' (Email delivery failed — check SMTP settings)';
            showLandingToast('Loan saved & approved!' + emailMsg, 'success');

        } catch (err) {
            showLandingToast(err.message, 'error');
            console.error('Loan save error:', err.message);
        }
    });

    // ── POPULATE SUBMITTED ──
    function populateSubmitted() {
        const P      = Number(loanAmountInput?.value || 0);
        const months = Number(loanTenureInput?.value  || 0);
        const emi    = calcEmi(P, RATE, months);
        const el     = document.getElementById('submitted-interest');
        if (!el) return;
        el.innerHTML = `
            <div class="summary-row"><span>Approved Amount</span><strong>${fmt(P)}</strong></div>
            <div class="summary-row"><span>Monthly EMI</span><strong>${fmt(emi.monthly.toFixed(2))}</strong></div>
            <div class="summary-row"><span>Tenure</span><strong>${months} months</strong></div>
            <div class="summary-row"><span>Credit Score</span><strong class="text-success">763</strong></div>
        `;
    }

    // ── STORAGE ──
    function saveToStorage() {
        const P      = Number(loanAmountInput?.value || 0);
        const months = Number(loanTenureInput?.value  || 0);
        const emi    = calcEmi(P, RATE, months);
        const inp    = applOneForm?.querySelectorAll('input') || [];
        localStorage.setItem('customerDetails', JSON.stringify({
            name:          inp[0]?.value || '',
            email:         inp[1]?.value || '',
            mobileNumber:  inp[2]?.value || '',
            address:       inp[3]?.value || '',
            panCard:       document.getElementById('pan')?.value || '',
            loanAmount:    P, tenure: months, interestRate: RATE,
            monthlyEMI:    +emi.monthly.toFixed(2),
            totalInterest: +emi.totalInterest.toFixed(2),
            totalPayment:  +emi.total.toFixed(2),
            submittedDate: new Date().toISOString()
        }));
    }

    // ── MODAL ──
    function openModal(title, bodyHtml) {
        document.querySelectorAll('.ql-overlay').forEach(n => n.remove());
        document.body.style.overflow = 'hidden';
        const overlay = Object.assign(document.createElement('div'), { className: 'ql-overlay' });
        Object.assign(overlay.style, {
            position:'fixed', inset:'0', display:'flex', alignItems:'center',
            justifyContent:'center', background:'rgba(0,5,18,0.75)',
            backdropFilter:'blur(6px)', zIndex:'9999', padding:'20px', boxSizing:'border-box'
        });
        const box = document.createElement('div');
        Object.assign(box.style, {
            background:'#111e33', borderRadius:'14px', padding:'28px',
            maxWidth:'460px', width:'100%', maxHeight:'88vh', overflowY:'auto',
            boxShadow:'0 24px 64px rgba(0,0,0,0.70), 0 0 0 1px #1e2f4d',
            display:'flex', flexDirection:'column', gap:'14px', boxSizing:'border-box'
        });
        box.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:17px;font-weight:700;color:#e8f0ff;">${title}</span>
                <button class="ql-close" style="width:32px;height:32px;background:#172240;border:1px solid #1e2f4d;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:#7a90b8;line-height:1;">×</button>
            </div>
            <hr style="border:none;border-top:1px solid #1e2f4d;">
            <div style="font-size:14px;color:#94a3b8;line-height:1.75;">${bodyHtml}</div>
            <button class="ql-close" style="margin-top:4px;padding:11px;background:linear-gradient(135deg,#3a7cf5,#5b9cff);color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(79,142,247,0.30);">Close</button>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        const close = () => { overlay.remove(); document.body.style.overflow = ''; };
        box.querySelectorAll('.ql-close').forEach(b => b.addEventListener('click', close));
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
        });
    }

    // ── BUTTONS ON SUBMITTED PAGE ──
    sbmtPgeDtlsBtn?.addEventListener('click', () => {
        const inp = applOneForm?.querySelectorAll('input') || [];
        openModal('Application Details', `
            <p><b style="color:#e8f0ff;">Name:</b> ${inp[0]?.value || '—'}</p>
            <p><b style="color:#e8f0ff;">Email:</b> ${inp[1]?.value || '—'}</p>
            <p><b style="color:#e8f0ff;">Phone:</b> ${inp[2]?.value || '—'}</p>
            <p><b style="color:#e8f0ff;">Address:</b> ${inp[3]?.value || '—'}</p>
            <p><b style="color:#e8f0ff;">PAN / SSN:</b> ${document.getElementById('pan')?.value || '—'}</p>
            <hr style="border:none;border-top:1px solid #1e2f4d;margin:10px 0;">
            <p style="font-size:12px;color:#465878;">Contact support to update any information.</p>
        `);
    });

    sbmtPgeLoanBtn?.addEventListener('click', () => {
        const P      = Number(loanAmountInput?.value || 0);
        const months = Number(loanTenureInput?.value  || 0);
        const emi    = calcEmi(P, RATE, months);
        openModal('Loan Agreement', `
            <p><b style="color:#e8f0ff;">Loan Amount:</b> ${fmt(P)}</p>
            <p><b style="color:#e8f0ff;">Tenure:</b> ${months} months</p>
            <p><b style="color:#e8f0ff;">Interest Rate:</b> ${RATE}% p.a.</p>
            <p><b style="color:#e8f0ff;">Monthly EMI:</b> ${fmt(emi.monthly.toFixed(2))}</p>
            <p><b style="color:#e8f0ff;">Total Interest:</b> ${fmt(emi.totalInterest.toFixed(2))}</p>
            <p><b style="color:#e8f0ff;">Total Payment:</b> ${fmt(emi.total.toFixed(2))}</p>
            <hr style="border:none;border-top:1px solid #1e2f4d;margin:10px 0;">
            <p style="font-size:12px;color:#465878;">By signing you accept the terms above. This is a demo agreement.</p>
            <button onclick="alert('Agreement signed (demo).');this.closest('.ql-overlay')?.remove();document.body.style.overflow='';"
                style="margin-top:10px;width:100%;padding:11px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(34,197,94,0.28);">
                ✓ I Agree &amp; Sign
            </button>
        `);
    });

    // ── RESET ──
    backHome?.addEventListener('click', resetToHome);

    function resetToHome() {
        if (middleSection) middleSection.style.display = 'none';
        hideAll();
        // Reset sliders
        resetEmiSliders();
        updateEmi();
        // Reset application forms
        applOneForm?.querySelectorAll('input').forEach(i => i.value = '');
        const sel = document.getElementById('js-app-two-slct');
        if (sel) sel.value = sel.options[0]?.value || '';
        ['cmpyName','income','pan'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.querySelectorAll('.ql-overlay').forEach(n => n.remove());
        document.body.style.overflow = '';
        stopResize();
        const m = document.getElementById('main');
        if (m) m.style.gridTemplateColumns = '';
    }

    // ── INIT ──
    if (interestRateLabel) interestRateLabel.innerText = `${RATE}% p.a.`;
    resetToHome();
    updateEmi();
})();

// ── APPLY-BUTTON STATE (top-level, always accessible) ────────────────────────
// Captures the original button HTML on first call so it can always be restored.
const _applyBtnOriginals = {};
function setApplyState(limited) {
    const applyBtn = document.getElementById('apply-btn-js');
    const leftBtn  = document.querySelector('.left-emi-cal-btn');
    // Snapshot originals once (before any mutation)
    if (applyBtn && !_applyBtnOriginals.apply) _applyBtnOriginals.apply = applyBtn.innerHTML;
    if (leftBtn  && !_applyBtnOriginals.left)  _applyBtnOriginals.left  = leftBtn.innerHTML;
    if (limited) {
        if (applyBtn) { applyBtn.disabled = true;  applyBtn.title = 'Loan limit reached (max 3 active)'; applyBtn.innerHTML = '<i class="bi bi-slash-circle"></i> Limit Reached'; }
        if (leftBtn)  { leftBtn.disabled  = true;  leftBtn.title  = 'Loan limit reached (max 3 active)'; leftBtn.innerHTML  = '<i class="bi bi-slash-circle"></i> Limit Reached'; }
    } else {
        if (applyBtn) { applyBtn.disabled = false; applyBtn.title = ''; applyBtn.innerHTML = _applyBtnOriginals.apply || '<i class="bi bi-lightning-fill"></i> Apply Now'; }
        if (leftBtn)  { leftBtn.disabled  = false; leftBtn.title  = ''; leftBtn.innerHTML  = _applyBtnOriginals.left  || '<i class="bi bi-calculator-fill"></i><span>Calculate EMI</span>'; }
    }
}

// ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────────
function showLandingToast(message, type) {
    const colors = {
        success: { bg: 'linear-gradient(135deg,#16a34a,#22c55e)', shadow: 'rgba(34,197,94,0.32)', border: 'rgba(34,197,94,0.40)', icon: '<i class="bi bi-check-circle-fill"></i>' },
        error:   { bg: 'linear-gradient(135deg,#b91c1c,#f87171)', shadow: 'rgba(248,113,113,0.32)', border: 'rgba(248,113,113,0.40)', icon: '<i class="bi bi-exclamation-triangle-fill"></i>' },
        warn:    { bg: 'linear-gradient(135deg,#92400e,#f59e0b)', shadow: 'rgba(245,158,11,0.32)', border: 'rgba(245,158,11,0.40)', icon: '<i class="bi bi-info-circle-fill"></i>' }
    };
    const c = colors[type] || colors.warn;
    const div = Object.assign(document.createElement('div'), {
        innerHTML: c.icon + ' ' + message
    });
    Object.assign(div.style, {
        position: 'fixed', top: '20px', right: '20px',
        background: c.bg, color: '#fff',
        padding: '13px 18px', borderRadius: '10px',
        boxShadow: `0 6px 24px ${c.shadow}`,
        border: `1px solid ${c.border}`,
        zIndex: '99999', fontWeight: '600', fontSize: '13px',
        display: 'flex', alignItems: 'center', gap: '8px',
        maxWidth: '380px', lineHeight: '1.4',
        animation: 'qlToastIn 0.3s ease'
    });
    document.body.appendChild(div);
    // inject keyframes once
    if (!document.getElementById('ql-toast-style')) {
        const s = document.createElement('style');
        s.id = 'ql-toast-style';
        s.textContent = `@keyframes qlToastIn{from{opacity:0;transform:translateX(100px)}to{opacity:1;transform:translateX(0)}}@keyframes qlToastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(100px)}}`;
        document.head.appendChild(s);
    }
    setTimeout(() => {
        div.style.animation = 'qlToastOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, type === 'error' ? 6000 : 4000);
}

// ── PROFILE LOAN RENDERER ─────────────────────────────────────────────────────
function renderProfileLoan(loan) {
    const wrap   = document.getElementById('profile-loan-wrap');
    const noLoan = document.getElementById('profile-no-loan');
    const body   = document.getElementById('profile-loan-body');
    const payBtn = document.getElementById('profile-pay-emi-btn');
    const viewBtn = document.getElementById('profile-view-all-btn');
    if (!wrap || !noLoan || !body) return;

    if (!loan) {
        wrap.style.display   = 'none';
        noLoan.style.display = 'block';
        return;
    }

    const fmtINR = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const fmtDt  = iso => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const paid   = loan.paidInstallments || 0;
    const total  = loan.tenure || 1;
    const pct    = Math.min(100, Math.round((paid / total) * 100));
    const isClosed = loan.status === 'Closed';

    body.innerHTML = `
        <div class="ploan-row">
            <span>Amount</span>
            <strong style="color:#4f8ef7;">${fmtINR(loan.loanAmount)}</strong>
        </div>
        <div class="ploan-row">
            <span>Monthly EMI</span>
            <strong>${fmtINR(loan.monthlyEMI)}</strong>
        </div>
        <div class="ploan-row">
            <span>EMI Progress</span>
            <strong style="color:${isClosed ? '#22c55e' : '#e8f0ff'}">${paid}/${total}</strong>
        </div>
        <div class="ploan-row">
            <span>Status</span>
            <span class="ploan-status" style="${isClosed ? 'background:rgba(100,116,139,.14);color:#94a3b8;border-color:rgba(100,116,139,.28)' : ''}">${loan.status}</span>
        </div>
        <div class="emi-progress-wrap" style="padding:6px 0 4px;">
            <div class="emi-progress-track"><div class="emi-progress-fill" style="width:${pct}%"></div></div>
            <div class="emi-progress-txt"><span>${fmtINR(loan.monthlyEMI * paid)} paid</span><span>${fmtINR(loan.monthlyEMI * (total - paid))} left</span></div>
        </div>
        <div class="ploan-row">
            <span>Applied</span>
            <strong>${fmtDt(loan.appliedAt)}</strong>
        </div>
    `;

    wrap.style.display   = 'block';
    noLoan.style.display = 'none';

    if (payBtn) {
        payBtn.disabled = isClosed || paid >= total;
        payBtn.innerHTML = isClosed
            ? '<i class="bi bi-check-circle-fill"></i> Loan Closed'
            : '<i class="bi bi-credit-card-fill"></i> Make Payment';
        payBtn.onclick = () => scrollToPaymentSection(loan._id);
    }
    if (viewBtn) {
        viewBtn.onclick = () => {
            document.getElementById('profile-dropdown')?.classList.remove('open');
            const section = document.getElementById('home-loans-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
    }
}

// ── HOME LOANS SECTION RENDERER ──────────────────────────────────────────────
function renderHomeLoansSection(loans) {
    const section  = document.getElementById('home-loans-section');
    const list     = document.getElementById('home-loans-list');
    const badge    = document.getElementById('loan-limit-badge');
    const badgeTxt = document.getElementById('loan-limit-txt');
    if (!section || !list) return;

    if (!loans || loans.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'flex';
    const openCount = loans.filter(l => l.status !== 'Closed').length;
    if (badgeTxt) badgeTxt.textContent = `${openCount} / 3`;
    if (badge) {
        badge.classList.toggle('limit-reached', openCount >= 3);
    }

    const fmtINR = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

    list.innerHTML = loans.map((loan, idx) => {
        const paid   = loan.paidInstallments || 0;
        const total  = loan.tenure || 1;
        const pct    = Math.min(100, Math.round((paid / total) * 100));
        const isClosed = loan.status === 'Closed';
        const statusCls = isClosed ? 'closed' : 'approved';

        const appliedStr   = loan.appliedAt ? new Date(loan.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
        const completedStr = isClosed && loan.completedAt ? new Date(loan.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

        return `
        <div class="loan-track-card${isClosed ? ' closed-card' : ''}">
            <div class="loan-track-top">
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <span class="loan-track-num">Loan #${idx + 1}</span>
                    ${appliedStr ? `<span class="loan-track-applied"><i class="bi bi-calendar2-event"></i> Applied ${appliedStr}</span>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span class="loan-track-status ${statusCls}">${loan.status}</span>
                    ${completedStr ? `<span class="loan-track-completed"><i class="bi bi-patch-check-fill"></i> Closed ${completedStr}</span>` : ''}
                </div>
            </div>
            <div class="loan-track-amounts">
                <div class="loan-track-amt-item">
                    <span>Amount</span>
                    <strong class="hi">${fmtINR(loan.loanAmount)}</strong>
                </div>
                <div class="loan-track-amt-item">
                    <span>Monthly EMI</span>
                    <strong>${fmtINR(loan.monthlyEMI)}</strong>
                </div>
                <div class="loan-track-amt-item">
                    <span>EMIs Paid</span>
                    <strong>${paid} / ${total}</strong>
                </div>
            </div>
            <div class="emi-progress-wrap">
                <div class="emi-progress-track">
                    <div class="emi-progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="emi-progress-txt">
                    <span>${pct}% complete</span>
                    <span>${isClosed ? '✓ Fully repaid' : fmtINR(loan.monthlyEMI * (total - paid)) + ' remaining'}</span>
                </div>
            </div>
            ${!isClosed && paid < total
                ? `<button class="btn-pay-emi" data-loan-id="${loan._id}">
                       <i class="bi bi-credit-card-fill"></i> Pay ₹${(+loan.monthlyEMI).toLocaleString('en-IN')} EMI
                   </button>`
                : `<button class="btn-pay-emi" disabled>
                       <i class="bi bi-check-circle-fill"></i> Loan Closed
                   </button>`
            }
        </div>`;
    }).join('');

    // Wire Pay EMI buttons → scroll to payment section with pre-selected loan
    list.querySelectorAll('.btn-pay-emi[data-loan-id]').forEach(btn => {
        btn.addEventListener('click', () => scrollToPaymentSection(btn.dataset.loanId));
    });
}

// ── SCROLL TO PAYMENT SECTION (pre-select a specific loan) ───────────────────
function scrollToPaymentSection(loanId) {
    const section = document.getElementById('payment-section');
    if (!section || section.style.display === 'none') return;
    // Activate the right tab
    if (loanId) {
        document.querySelectorAll('.pay-tab-btn').forEach(t => {
            t.classList.toggle('active', t.dataset.loanId === loanId);
        });
        window._activePayLoanId = loanId;
        // Re-render form for this loan
        const loan = (window._currentLoans || []).find(l => l._id === loanId);
        if (loan) _renderPayForm(loan);
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── PAYMENT SECTION RENDERER ──────────────────────────────────────────────────
function renderPaymentSection(loans) {
    const section   = document.getElementById('payment-section');
    const tabsWrap  = document.getElementById('pay-loan-tabs');
    const body      = document.getElementById('pay-sec-body');
    const badgeEl   = document.getElementById('pay-sec-badge');
    if (!section || !body) return;

    // Only show if at least one open loan exists
    const openLoans = (loans || []).filter(l => l.status !== 'Closed');
    if (openLoans.length === 0) { section.style.display = 'none'; return; }

    // Cache for scrollToPaymentSection
    window._currentLoans = loans;

    section.style.display = 'block';
    if (badgeEl) badgeEl.textContent = `${openLoans.length} active loan${openLoans.length > 1 ? 's' : ''}`;

    // Build switcher tabs (only when 2+ total loans)
    if (loans.length > 1 && tabsWrap) {
        tabsWrap.style.display = 'flex';
        tabsWrap.innerHTML = loans.map((loan, i) => {
            const isClosed = loan.status === 'Closed';
            const isActive = loan._id === (window._activePayLoanId || openLoans[0]._id);
            return `
            <button class="pay-tab-btn ${isActive ? 'active' : ''} ${isClosed ? 'closed-tab' : ''}"
                    data-loan-id="${loan._id}" ${isClosed ? 'disabled title="Loan fully repaid"' : ''}>
                <span class="pay-tab-label">Loan #${i + 1}</span>
                <span class="pay-tab-amount">₹${Number(loan.loanAmount).toLocaleString('en-IN')}</span>
                <span class="pay-tab-status ${isClosed ? 'closed' : 'open'}">${loan.status}</span>
            </button>`;
        }).join('');

        tabsWrap.querySelectorAll('.pay-tab-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                tabsWrap.querySelectorAll('.pay-tab-btn').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                window._activePayLoanId = btn.dataset.loanId;
                const loan = loans.find(l => l._id === btn.dataset.loanId);
                if (loan) _renderPayForm(loan);
            });
        });
    } else {
        if (tabsWrap) tabsWrap.style.display = 'none';
    }

    // Default: show first open loan
    const defaultLoan = loans.find(l => l._id === window._activePayLoanId) || openLoans[0];
    _renderPayForm(defaultLoan);
}

// ── RENDER PAYMENT FORM FOR SELECTED LOAN ────────────────────────────────────
function _renderPayForm(loan) {
    const body    = document.getElementById('pay-sec-body');
    if (!body) return;
    const fmtINR  = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const paid    = loan.paidInstallments || 0;
    const total   = loan.tenure || 1;
    const pct     = Math.min(100, Math.round((paid / total) * 100));
    const remaining = total - paid;
    const isClosed  = loan.status === 'Closed';
    const minAmt    = +loan.monthlyEMI;

    body.innerHTML = `
        <!-- LEFT: Loan info -->
        <div class="pay-info-card">
            <div class="pay-info-title"><i class="bi bi-wallet2" style="color:var(--blue);margin-right:6px;"></i>Loan Details</div>
            <div class="pay-info-row"><span>Loan Amount</span><strong class="accent">${fmtINR(loan.loanAmount)}</strong></div>
            <div class="pay-info-row"><span>Interest Rate</span><strong>${loan.interestRate}% p.a.</strong></div>
            <div class="pay-info-row"><span>Monthly EMI</span><strong style="color:#4f8ef7;">${fmtINR(minAmt)}</strong></div>
            <div class="pay-info-row"><span>Total Tenure</span><strong>${total} months</strong></div>
            <div class="pay-info-row"><span>EMIs Paid</span><strong class="green">${paid} of ${total}</strong></div>
            <div class="pay-info-row"><span>Remaining</span><strong>${remaining} installment${remaining !== 1 ? 's' : ''}</strong></div>
            <div class="pay-info-row"><span>Outstanding</span><strong>${fmtINR(minAmt * remaining)}</strong></div>
            <div class="pay-info-row"><span>Status</span>
                <strong style="color:${isClosed ? '#94a3b8' : '#22c55e'}">${loan.status}</strong>
            </div>
            <!-- Progress bar -->
            <div class="emi-progress-wrap" style="padding:2px 0;">
                <div class="emi-progress-track"><div class="emi-progress-fill" style="width:${pct}%"></div></div>
                <div class="emi-progress-txt"><span>${pct}% complete</span><span>${fmtINR(minAmt * remaining)} left</span></div>
            </div>
        </div>

        <!-- RIGHT: Payment form -->
        <div class="pay-form-card" id="pay-form-card">
            ${isClosed ? `
                <div class="pay-closed-notice">
                    <i class="bi bi-patch-check-fill"></i>
                    <h3>Loan Fully Repaid!</h3>
                    <p>All ${total} installments have been paid.<br>This loan is now closed.</p>
                </div>
            ` : `
                <div class="pay-form-title"><i class="bi bi-credit-card-fill" style="color:var(--blue);margin-right:6px;"></i>Enter Payment Amount</div>
                <!-- Presets -->
                <div class="pay-presets" id="pay-presets">
                    <button class="pay-preset-btn preset-active" data-multiplier="1">1 EMI &nbsp;${fmtINR(minAmt)}</button>
                    ${remaining >= 2 ? `<button class="pay-preset-btn" data-multiplier="2">2 EMIs &nbsp;${fmtINR(minAmt * 2)}</button>` : ''}
                    ${remaining >= 3 ? `<button class="pay-preset-btn" data-multiplier="3">3 EMIs &nbsp;${fmtINR(minAmt * 3)}</button>` : ''}
                    ${remaining > 1  ? `<button class="pay-preset-btn" data-multiplier="${remaining}">Full Payment &nbsp;${fmtINR(minAmt * remaining)}</button>` : ''}
                </div>
                <!-- Amount input -->
                <div class="pay-amount-wrap">
                    <span class="pay-amount-label">Payment Amount</span>
                    <div class="pay-amount-field">
                        <span class="pay-amount-prefix">₹</span>
                        <input type="number" id="pay-amount-input" placeholder="${minAmt}" min="${minAmt}" value="${minAmt}" step="1">
                    </div>
                    <div class="pay-amount-hint hint-ok" id="pay-amount-hint">
                        <i class="bi bi-check-circle-fill"></i>
                        Minimum payment: ${fmtINR(minAmt)} (1 EMI)
                    </div>
                </div>
                <!-- Installment preview -->
                <div class="pay-installment-preview" id="pay-preview">
                    <div><span class="preview-emi-count">1</span> installment will be cleared</div>
                    <span style="font-size:12px;">${remaining - 1} remaining after this payment</span>
                </div>
                <!-- Pay button -->
                <button class="btn-pay-now" id="btn-pay-now" data-loan-id="${loan._id}">
                    <i class="bi bi-credit-card-fill"></i>
                    Pay ${fmtINR(minAmt)} Now
                </button>
                <div style="font-size:11px;color:var(--text-muted);text-align:center;">
                    <i class="bi bi-shield-lock-fill" style="color:var(--blue);margin-right:3px;"></i>
                    Payments are securely processed
                </div>
            `}
        </div>
    `;

    if (isClosed) return;

    const input    = document.getElementById('pay-amount-input');
    const hint     = document.getElementById('pay-amount-hint');
    const preview  = document.getElementById('pay-preview');
    const payBtn   = document.getElementById('btn-pay-now');
    const presets  = document.getElementById('pay-presets');

    function updateUI(val) {
        const n = Number(val) || 0;
        const covers = Math.min(Math.floor(n / minAmt), remaining);
        const afterPayment = remaining - covers;

        if (!val || n < minAmt) {
            input.className = 'input-error';
            hint.className  = 'pay-amount-hint hint-error';
            hint.innerHTML  = `<i class="bi bi-exclamation-circle-fill"></i> Minimum is ${fmtINR(minAmt)} (1 EMI)`;
            preview.innerHTML = `<span style="color:#f87171;font-size:13px;">Enter a valid amount to continue</span>`;
            payBtn.disabled = true;
            payBtn.innerHTML = `<i class="bi bi-lock-fill"></i> Amount Too Low`;
        } else {
            input.className = 'input-ok';
            hint.className  = 'pay-amount-hint hint-ok';
            hint.innerHTML  = `<i class="bi bi-check-circle-fill"></i> Valid — covers ${covers} installment${covers !== 1 ? 's' : ''}`;
            preview.innerHTML = `
                <div><span class="preview-emi-count">${covers}</span> installment${covers !== 1 ? 's' : ''} will be cleared</div>
                <span style="font-size:12px;">${afterPayment} remaining after this payment</span>
            `;
            payBtn.disabled = false;
            payBtn.innerHTML = `<i class="bi bi-credit-card-fill"></i> Pay ${fmtINR(n)} Now`;
        }

        // Sync preset active state
        presets?.querySelectorAll('.pay-preset-btn').forEach(b => {
            const expectedVal = minAmt * Number(b.dataset.multiplier);
            b.classList.toggle('preset-active', Math.abs(n - expectedVal) < 0.01);
        });
    }

    input.addEventListener('input', () => updateUI(input.value));
    input.addEventListener('change', () => {
        if (Number(input.value) < minAmt) input.value = minAmt;
        updateUI(input.value);
    });

    presets?.querySelectorAll('.pay-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = (minAmt * Number(btn.dataset.multiplier)).toFixed(2);
            input.value = val;
            updateUI(val);
        });
    });

    payBtn.addEventListener('click', async () => {
        const amount = Number(input.value);
        if (!amount || amount < minAmt) return;
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:spin .7s linear infinite"></i> Processing…';
        if (!document.getElementById('ql-spin-style')) {
            const s = document.createElement('style');
            s.id = 'ql-spin-style';
            s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
            document.head.appendChild(s);
        }
        await payEMI(loan._id, amount);
    });

    updateUI(minAmt);
}

// ── PAY EMI API CALL ──────────────────────────────────────────────────────────
async function payEMI(loanId, amount) {
    const token = localStorage.getItem('ql_token');
    if (!token) { showLandingToast('Please log in to make a payment.', 'warn'); return; }
    try {
        const res = await fetch(`${window.APP_CONFIG?.API_BASE ?? 'http://localhost:5000'}/api/loan/${loanId}/pay`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount })
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { throw new Error('Server error during payment.'); }
        if (!res.ok) { showLandingToast(data.message || 'Payment failed.', 'error'); return; }

        const isNowClosed = data.loan.status === 'Closed';
        const covered     = data.installmentsCovered || 1;
        const balance     = data.balanceAfter != null ? data.balanceAfter : null;
        const balanceTxt  = balance != null && balance > 0
            ? ` | Balance: ₹${Number(balance).toLocaleString('en-IN')}` : '';
        showLandingToast(
            isNowClosed
                ? '🎉 Loan fully repaid! Loan is now Closed.'
                : `₹${Number(amount).toLocaleString('en-IN')} paid — ${covered} EMI${covered > 1 ? 's' : ''} cleared!${balanceTxt}`,
            'success'
        );

        // Re-fetch and re-render everything (profile + tracker + payment section)
        // Also call setApplyState directly as a safety net in case _fetchAndRenderLoans is unavailable
        if (window._fetchAndRenderLoans) {
            window._fetchAndRenderLoans();
        } else {
            setApplyState(false);
        }
    } catch (err) {
        showLandingToast(err.message, 'error');
    }
}

// ── PAYMENT HISTORY MODAL ────────────────────────────────────────────────────
async function openHistoryModal() {
    const token = localStorage.getItem('ql_token');
    if (!token) { showLandingToast('Please log in to view history.', 'warn'); return; }

    // Create modal shell immediately (shows loading)
    const overlay = Object.assign(document.createElement('div'), { className: 'hist-modal-overlay' });
    overlay.innerHTML = `
        <div class="hist-modal-box">
            <div class="hist-modal-hdr">
                <div class="hist-modal-hdr-left">
                    <div class="hist-modal-icon"><i class="bi bi-clock-history"></i></div>
                    <div>
                        <h2 class="hist-modal-title">Payment History</h2>
                        <p class="hist-modal-sub">All payments across all your loans</p>
                    </div>
                </div>
                <button class="hist-modal-close" id="hist-close">×</button>
            </div>
            <div class="hist-modal-body" id="hist-modal-body">
                <div class="hist-empty"><i class="bi bi-arrow-repeat" style="animation:spin .8s linear infinite"></i>Loading…</div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = () => { overlay.remove(); document.body.style.overflow = ''; };
    document.getElementById('hist-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    // Fetch history
    let history = [];
    try {
        const res  = await fetch((window.APP_CONFIG?.API_BASE ?? 'http://localhost:5000') + '/api/loan/my/history', { 
            mode: 'cors',
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const text = await res.text();
        const data = JSON.parse(text);
        if (res.ok) history = data.history || [];
    } catch { /* handled below */ }

    const body = document.getElementById('hist-modal-body');
    if (!body) return;
    const fmtINR = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const fmtDt  = iso => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (!history.length) {
        body.innerHTML = `<div class="hist-empty"><i class="bi bi-inbox"></i>No loan history found</div>`;
        return;
    }

    // ── Cumulative stats across all loans ──
    const totalBorrowed = history.reduce((s, l) => s + (l.loanAmount || 0), 0);
    const totalPaid     = history.reduce((s, l) => (l.payments || []).reduce((ps, p) => ps + (p.amount || 0), 0) + s, 0);
    const outstanding   = history.filter(l => l.status !== 'Closed')
                                  .reduce((s, l) => s + Math.max(0, (l.tenure - (l.paidInstallments || 0)) * l.monthlyEMI), 0);
    const closedLoans   = history.filter(l => l.status === 'Closed').length;

    const statsBar = `
    <div class="hist-stats-bar">
        <div class="hist-stat-item">
            <span class="hist-stat-label">Total Loans</span>
            <strong class="hist-stat-val">${history.length}</strong>
        </div>
        <div class="hist-stat-item">
            <span class="hist-stat-label">Total Borrowed</span>
            <strong class="hist-stat-val blue">${fmtINR(totalBorrowed)}</strong>
        </div>
        <div class="hist-stat-item">
            <span class="hist-stat-label">Total Paid</span>
            <strong class="hist-stat-val green">${fmtINR(totalPaid)}</strong>
        </div>
        <div class="hist-stat-item">
            <span class="hist-stat-label">Outstanding</span>
            <strong class="hist-stat-val ${outstanding > 0 ? 'amber' : 'green'}">${fmtINR(outstanding)}</strong>
        </div>
        <div class="hist-stat-item">
            <span class="hist-stat-label">Loans Closed</span>
            <strong class="hist-stat-val">${closedLoans} / ${history.length}</strong>
        </div>
    </div>`;

    body.innerHTML = statsBar + history.map((loan, idx) => {
        const paid      = loan.paidInstallments || 0;
        const total     = loan.tenure || 1;
        const pct       = Math.min(100, Math.round((paid / total) * 100));
        const isClosed  = loan.status === 'Closed';
        const statusCls = isClosed ? 'closed' : 'open';
        const payments  = loan.payments || [];

        const payRows = payments.length ? payments.map(p => `
            <div class="hist-pay-row">
                <span class="hist-pay-num">#${p.paymentNo ?? '—'}</span>
                <span class="hist-pay-date">${fmtDt(p.paidAt)}</span>
                <span class="hist-pay-amount">${fmtINR(p.amount)}</span>
                <span class="hist-pay-covers">${p.installmentsCovered ?? 1} EMI${(p.installmentsCovered ?? 1) > 1 ? 's' : ''}</span>
                <span class="hist-pay-balance">${p.balanceAfter != null ? fmtINR(Math.max(0, p.balanceAfter)) : '—'}</span>
            </div>`).join('')
        : `<div class="hist-no-payments">No payments recorded yet</div>`;

        const closedBanner = isClosed && loan.completedAt ? `
            <div class="hist-loan-completed-banner">
                <i class="bi bi-patch-check-fill"></i>
                Loan fully repaid on <strong>${fmtDt(loan.completedAt)}</strong> — Outstanding: <strong>₹0.00</strong>
            </div>` : '';

        return `
        <div class="hist-loan-block">
            <div class="hist-loan-hdr ${isClosed ? 'closed-hdr' : ''}">
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <span class="hist-loan-num">Loan #${idx + 1}</span>
                        ${loan.appliedAt ? `<span class="hist-loan-date"><i class="bi bi-calendar2-event"></i> ${fmtDt(loan.appliedAt)}</span>` : ''}
                    </div>
                    <div class="hist-loan-info">
                        <span class="hist-loan-amt">${fmtINR(loan.loanAmount)}</span>
                        <span class="hist-loan-emi">EMI ${fmtINR(loan.monthlyEMI)} × ${total} months</span>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">
                    <span class="hist-loan-status ${statusCls}">${loan.status}</span>
                    ${isClosed && loan.completedAt ? `<span class="hist-loan-date"><i class="bi bi-patch-check-fill" style="color:#22c55e;"></i> Closed ${fmtDt(loan.completedAt)}</span>` : ''}
                </div>
            </div>
            <div class="hist-loan-progress">
                <div class="hist-prog-track"><div class="hist-prog-fill" style="width:${pct}%"></div></div>
                <div class="hist-prog-txt"><span>${paid} of ${total} EMIs paid</span><span>${pct}% complete</span></div>
            </div>
            ${payments.length ? `
            <div class="hist-pay-table">
                <div class="hist-pay-table-hdr">
                    <span>#</span><span>Date &amp; Time</span><span>Paid</span><span>EMIs</span><span>Balance</span>
                </div>
                ${payRows}
            </div>` : `<div class="hist-no-payments">No payments recorded yet for this loan</div>`}
            ${closedBanner}
        </div>`;
    }).join('');
}

// ── USER SESSION ─────────────────────────────────────────────────────────────
(function initUserSession() {
    try {
        const stored = localStorage.getItem('ql_user');
        if (!stored) return;
        const user = JSON.parse(stored);
        if (!user?.name) return;

        const loginBtn    = document.getElementById('login-btn-header');
        const profileWrap = document.getElementById('user-profile-wrap');
        if (loginBtn)    loginBtn.style.display    = 'none';
        if (profileWrap) profileWrap.style.display = 'flex';

        const initials = user.name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);

        const avatarBtn = document.getElementById('profile-avatar-btn');
        const avatarLg  = document.getElementById('profile-avatar-lg');
        const nameEl    = document.getElementById('profile-name-val');
        const emailEl   = document.getElementById('profile-email-val');
        const sinceEl   = document.getElementById('profile-since');

        if (avatarBtn) avatarBtn.textContent = initials;
        if (avatarLg)  avatarLg.textContent  = initials;
        if (nameEl)    nameEl.textContent    = user.name;
        if (emailEl)   emailEl.textContent   = user.email;
        if (sinceEl && user.createdAt) {
            const d = new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
            sinceEl.textContent = 'Member since ' + d;
        }

        // Toggle dropdown
        const dropdown = document.getElementById('profile-dropdown');
        avatarBtn?.addEventListener('click', e => {
            e.stopPropagation();
            dropdown?.classList.toggle('open');
        });
        document.addEventListener('click', () => dropdown?.classList.remove('open'));

        // Sign out
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('ql_user');
            localStorage.removeItem('ql_token');
            window.location.reload();
        });

        // Payment history
        document.getElementById('profile-history-btn')?.addEventListener('click', () => {
            document.getElementById('profile-dropdown')?.classList.remove('open');
            openHistoryModal();
        });

        // Shared loan fetch + render function
        const token = localStorage.getItem('ql_token');

        function fetchAndRenderLoans() {
            if (!token) {
                renderProfileLoan(null);
                renderHomeLoansSection([]);
                return;
            }
            fetch((window.APP_CONFIG?.API_BASE ?? 'http://localhost:5000') + '/api/loan/my', {
                mode: 'cors',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(r => r.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    const loans = data.loans || [];
                    // Show latest active loan in profile, else fallback to first
                    const activeLoan = loans.find(l => l.status !== 'Closed') || loans[0] || null;
                    renderProfileLoan(activeLoan);
                    renderHomeLoansSection(loans);
                    renderPaymentSection(loans);
                    // Sync apply-button state with server's limitReached flag
                    setApplyState(!!data.limitReached);
                } catch {
                    renderProfileLoan(null);
                    renderHomeLoansSection([]);
                    renderPaymentSection([]);
                }
            })
            .catch(() => {
                renderProfileLoan(null);
                renderHomeLoansSection([]);
                renderPaymentSection([]);
            });
        }

        // Expose for other code (submit handler, payEMI) to call
        window._fetchAndRenderLoans = fetchAndRenderLoans;
        fetchAndRenderLoans();

    } catch (_) {}
})();