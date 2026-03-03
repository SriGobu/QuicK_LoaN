// Load .env — override: false means existing system env vars (e.g. from Docker / hosting panel) take precedence
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: false });

const express    = require('express');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { sendLoanConfirmation, sendPaymentReceipt, sendLoanClosedEmail } = require('./emailServer');

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
// Explicitly set CORS headers on every response (works from any browser origin)
app.use((req, res, next) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
    const origin = req.headers.origin;
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();   // pre-flight
    next();
});
app.use(express.json());

// ── DATABASE ──────────────────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGODB_URI, { dbName: 'quickloan' })
    .then(() => console.log('✅  MongoDB connected → quickloan'))
    .catch(err => console.error('❌  MongoDB error:', err.message));

// ── USER SCHEMA ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ── HELPERS ───────────────────────────────────────────────────────────────────
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (user) => ({
    id:        user._id,
    name:      user.name,
    email:     user.email,
    createdAt: user.createdAt
});

// ── ROUTES ────────────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields are required.' });

        if (password.length < 8)
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(409).json({ message: 'An account with this email already exists.' });

        const hashed = await bcrypt.hash(password, 12);
        const user   = await User.create({ name, email, password: hashed });
        const token  = signToken(user._id);

        res.status(201).json({ token, user: userPayload(user) });

    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: 'Email and password are required.' });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password.' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: 'Invalid email or password.' });

        const token = signToken(user._id);

        res.json({ token, user: userPayload(user) });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ── JWT MIDDLEWARE ────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Unauthorized.' });
    try {
        req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token expired or invalid.' });
    }
};

// ── LOAN SCHEMA ───────────────────────────────────────────────────────────────
const loanSchema = new mongoose.Schema({
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicantName:    { type: String, required: true },
    email:            { type: String, required: true },
    phone:            { type: String },
    address:          { type: String },
    panCard:          { type: String },
    employmentType:   { type: String },
    companyName:      { type: String },
    monthlyIncome:    { type: String },
    loanAmount:       { type: Number, required: true },
    tenure:           { type: Number, required: true },
    interestRate:     { type: Number, required: true },
    monthlyEMI:       { type: Number, required: true },
    totalInterest:    { type: Number },
    totalPayment:     { type: Number },
    status:           { type: String, default: 'Approved' },
    emailSent:        { type: Boolean, default: false },
    paidInstallments: { type: Number, default: 0 },
    payments: [{
        paidAt:              { type: Date },
        amount:              { type: Number },
        installmentsCovered: { type: Number },
        balanceBefore:       { type: Number },
        balanceAfter:        { type: Number },
        paymentNo:           { type: Number }   // sequential payment number for this loan
    }],
    completedAt:      { type: Date, default: null },
    appliedAt:        { type: Date, default: Date.now }
});

const Loan = mongoose.model('Loan', loanSchema);

// ── LOAN ROUTES ───────────────────────────────────────────────────────────────

// POST /api/loan/apply  — submit a loan, save to DB, send email
app.post('/api/loan/apply', verifyToken, async (req, res) => {
    try {
        const {
            applicantName, email, phone, address, panCard,
            employmentType, companyName, monthlyIncome,
            loanAmount, tenure, interestRate, monthlyEMI,
            totalInterest, totalPayment
        } = req.body;

        if (!applicantName || !email || !loanAmount || !tenure || !monthlyEMI)
            return res.status(400).json({ message: 'Required loan fields are missing.' });

        // ── Enforce 3-loan limit per user (closed loans don't count) ──
        const loanCount = await Loan.countDocuments({ userId: req.user.id, status: { $ne: 'Closed' } });
        if (loanCount >= 3)
            return res.status(400).json({ message: 'Loan limit reached. A maximum of 3 active loans are allowed per account.' });

        const loan = await Loan.create({
            userId: req.user.id,
            applicantName, email, phone, address, panCard,
            employmentType, companyName, monthlyIncome,
            loanAmount, tenure, interestRate: interestRate || 8.5,
            monthlyEMI, totalInterest, totalPayment
        });

        // Send confirmation email (non-blocking — don't fail the request if it errors)
        const emailResult = await sendLoanConfirmation(email, {
            applicantName, email, phone, address, panCard,
            employmentType, companyName, monthlyIncome,
            loanAmount, tenure, interestRate: interestRate || 8.5,
            monthlyEMI, totalInterest, totalPayment,
            status: loan.status,
            appliedAt: loan.appliedAt
        });

        if (emailResult.success) {
            await Loan.findByIdAndUpdate(loan._id, { emailSent: true });
        }

        res.status(201).json({ loan, emailSent: emailResult.success });

    } catch (err) {
        console.error('Loan apply error:', err.message);
        res.status(500).json({ message: 'Server error saving loan. Please try again.' });
    }
});

// GET /api/loan/my  — fetch all loans for the logged-in user
app.get('/api/loan/my', verifyToken, async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user.id }).sort({ appliedAt: -1 });
        const openCount = loans.filter(l => l.status !== 'Closed').length;
        res.json({ loans, count: loans.length, limitReached: openCount >= 3 });
    } catch (err) {
        console.error('Fetch loans error:', err.message);
        res.status(500).json({ message: 'Server error fetching loans.' });
    }
});

// GET /api/loan/my/history  — full payment history grouped by loan
app.get('/api/loan/my/history', verifyToken, async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user.id }).sort({ appliedAt: -1 });
        const history = loans.map(loan => ({
            loanId:           loan._id,
            loanAmount:       loan.loanAmount,
            tenure:           loan.tenure,
            monthlyEMI:       loan.monthlyEMI,
            interestRate:     loan.interestRate,
            status:           loan.status,
            appliedAt:        loan.appliedAt,
            completedAt:      loan.completedAt,
            paidInstallments: loan.paidInstallments,
            payments:         loan.payments
        }));
        res.json({ history });
    } catch (err) {
        console.error('History error:', err.message);
        res.status(500).json({ message: 'Server error fetching history.' });
    }
});

// POST /api/loan/:id/pay  — record a manual payment (amount must be >= one EMI)
app.post('/api/loan/:id/pay', verifyToken, async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.id });
        if (!loan)
            return res.status(404).json({ message: 'Loan not found.' });
        if (loan.paidInstallments >= loan.tenure)
            return res.status(400).json({ message: 'All installments are already paid.' });

        // Validate custom amount (must be >= 1 EMI)
        const paidAmount = Number(req.body.amount);
        if (!paidAmount || paidAmount < loan.monthlyEMI)
            return res.status(400).json({ message: `Minimum payment is ₹${loan.monthlyEMI} (1 EMI).` });

        // Count how many full installments this amount covers (cap at remaining)
        const remaining           = loan.tenure - loan.paidInstallments;
        const installmentsCovered = Math.min(Math.floor(paidAmount / loan.monthlyEMI), remaining);
        const totalOutstanding    = +(loan.monthlyEMI * remaining).toFixed(2);
        const balanceBefore       = totalOutstanding;
        const balanceAfter        = +(totalOutstanding - loan.monthlyEMI * installmentsCovered).toFixed(2);
        const paymentNo           = loan.payments.length + 1;
        const isNowClosed         = (loan.paidInstallments + installmentsCovered) >= loan.tenure;

        loan.paidInstallments += installmentsCovered;
        loan.payments.push({
            paidAt: new Date(),
            amount: paidAmount,
            installmentsCovered,
            balanceBefore,
            balanceAfter,
            paymentNo
        });
        if (isNowClosed) {
            loan.status      = 'Closed';
            loan.completedAt = new Date();
        }
        await loan.save();

        // Fetch user email
        const user = await User.findById(req.user.id).select('email name');
        const toEmail = user?.email || loan.email;

        // Send payment receipt email (non-blocking)
        sendPaymentReceipt(toEmail, {
            applicantName:      user?.name || loan.applicantName,
            loanAmount:         loan.loanAmount,
            monthlyEMI:         loan.monthlyEMI,
            paidAmount,
            installmentsCovered,
            paymentNo,
            paidInstallments:   loan.paidInstallments,
            tenure:             loan.tenure,
            balanceBefore,
            balanceAfter,
            paidAt:             new Date()
        }).catch(e => console.error('Payment email error:', e.message));

        // If fully paid, also send loan-closed email
        if (isNowClosed) {
            sendLoanClosedEmail(toEmail, {
                applicantName:  user?.name || loan.applicantName,
                loanAmount:     loan.loanAmount,
                tenure:         loan.tenure,
                interestRate:   loan.interestRate,
                monthlyEMI:     loan.monthlyEMI,
                totalPayment:   loan.totalPayment,
                completedAt:    loan.completedAt,
                paymentsCount:  loan.payments.length
            }).catch(e => console.error('Closed email error:', e.message));
        }

        res.json({ loan, installmentsCovered, balanceAfter, isNowClosed });
    } catch (err) {
        console.error('Payment error:', err.message);
        res.status(500).json({ message: 'Payment processing failed.' });
    }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── GLOBAL JSON ERROR HANDLER (must be after all routes) ─────────────────────
// Express 5 would otherwise return an HTML error page
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
