// Load .env — override: false means existing system env vars take precedence
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: false });

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS  = 'QuickLoan <no-reply@sg247.dev>';
const SUPPORT_EMAIL = 'no-reply@sg247.dev';

// ── CORE SEND HELPER ──────────────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
    try {
        const { data, error } = await resend.emails.send({
            from:    FROM_ADDRESS,
            to:      to,
            subject: subject,
            html:    html
        });
        if (error) {
            console.error(`Email failed to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
        console.log(`Email sent to ${to} — id: ${data.id}`);
        return { success: true, id: data.id };
    } catch (err) {
        console.error(`Email exception to ${to}:`, err.message);
        return { success: false, error: err.message };
    }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmtINR = (n) =>
    '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

// ── EMAIL TEMPLATE ────────────────────────────────────────────────────────────
function buildHtml(data) {
    const {
        applicantName, email, phone, address,
        loanAmount, tenure, interestRate, monthlyEMI,
        totalInterest, totalPayment, status, appliedAt,
        employmentType, companyName, monthlyIncome, panCard
    } = data;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QuickLoan — Loan Approval &amp; Credit Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#0d1526;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;padding:32px 0;">
  <tr>
    <td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1829,#111e33);border:1px solid #1e2f4d;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:42px;height:42px;background:linear-gradient(135deg,#4f8ef7,#22c55e);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;line-height:1;vertical-align:middle;">⚡</div>
              <span style="font-size:24px;font-weight:800;color:#e8f0ff;vertical-align:middle;">Quick<span style="color:#4f8ef7;">Loan</span></span>
            </div>
            <p style="color:#7a90b8;font-size:13px;margin:8px 0 0;">Fast, Secure &amp; Trusted Personal Loans</p>
          </td>
        </tr>

        <!-- CREDIT CONFIRMATION (green banner) -->
        <tr>
          <td style="background:linear-gradient(135deg,#052e16,#14532d);border-left:1px solid #1e2f4d;border-right:1px solid #1e2f4d;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="52" valign="middle">
                  <div style="width:46px;height:46px;background:rgba(34,197,94,0.18);border:2px solid #22c55e;border-radius:50%;text-align:center;line-height:46px;font-size:22px;">✓</div>
                </td>
                <td style="padding-left:14px;" valign="middle">
                  <p style="margin:0;font-size:13px;color:#86efac;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount Credited</p>
                  <p style="margin:4px 0 0;font-size:26px;font-weight:800;color:#22c55e;">${fmtINR(loanAmount)}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#6ee7b7;">has been credited to your registered bank account</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- GREETING -->
        <tr>
          <td style="background:#111e33;border-left:1px solid #1e2f4d;border-right:1px solid #1e2f4d;padding:26px 32px 16px;">
            <p style="margin:0;font-size:17px;font-weight:700;color:#e8f0ff;">Hello, ${applicantName}! 🎉</p>
            <p style="margin:10px 0 0;font-size:14px;color:#7a90b8;line-height:1.7;">
              Congratulations! Your loan application has been <strong style="color:#22c55e;">approved</strong> and 
              the amount has been disbursed to your account. Below are your complete loan and repayment details.
            </p>
          </td>
        </tr>

        <!-- LOAN DETAILS TABLE -->
        <tr>
          <td style="background:#111e33;border-left:1px solid #1e2f4d;border-right:1px solid #1e2f4d;padding:6px 32px 24px;">
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#7a90b8;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #1e2f4d;padding-bottom:10px;">
              📋 Loan Summary
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <span style="font-size:13px;color:#7a90b8;">Loan Amount</span>
                </td>
                <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <strong style="font-size:15px;color:#4f8ef7;">${fmtINR(loanAmount)}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <span style="font-size:13px;color:#7a90b8;">Loan Tenure</span>
                </td>
                <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <strong style="font-size:14px;color:#e8f0ff;">${tenure} Months</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <span style="font-size:13px;color:#7a90b8;">Interest Rate</span>
                </td>
                <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <strong style="font-size:14px;color:#e8f0ff;">${interestRate}% p.a.</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 8px;border-bottom:1px solid #1a2a42;background:rgba(79,142,247,0.06);border-radius:4px;">
                  <span style="font-size:13px;font-weight:700;color:#4f8ef7;">Monthly EMI</span>
                </td>
                <td align="right" style="padding:10px 0 8px;border-bottom:1px solid #1a2a42;">
                  <strong style="font-size:17px;color:#4f8ef7;">${fmtINR(monthlyEMI)}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <span style="font-size:13px;color:#7a90b8;">Total Interest</span>
                </td>
                <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;">
                  <strong style="font-size:14px;color:#e8f0ff;">${fmtINR(totalInterest)}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="font-size:13px;color:#7a90b8;">Total Repayment</span>
                </td>
                <td align="right" style="padding:8px 0;">
                  <strong style="font-size:14px;color:#e8f0ff;">${fmtINR(totalPayment)}</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- APPLICANT DETAILS -->
        <tr>
          <td style="background:#0d1829;border:1px solid #1e2f4d;border-top:none;padding:20px 32px 24px;">
            <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#7a90b8;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #1e2f4d;padding-bottom:10px;">
              👤 Applicant Details
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding:5px 0;font-size:13px;color:#7a90b8;">Name</td>
                <td width="50%" style="padding:5px 0;font-size:13px;color:#e8f0ff;font-weight:600;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#7a90b8;">Email</td>
                <td style="padding:5px 0;font-size:13px;color:#e8f0ff;">${email}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#7a90b8;">Phone</td>
                <td style="padding:5px 0;font-size:13px;color:#e8f0ff;">${phone || '—'}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#7a90b8;">Employment</td>
                <td style="padding:5px 0;font-size:13px;color:#e8f0ff;">${employmentType || '—'}${companyName ? ' · ' + companyName : ''}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#7a90b8;">Monthly Income</td>
                <td style="padding:5px 0;font-size:13px;color:#e8f0ff;">${monthlyIncome || '—'}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#7a90b8;">PAN / SSN</td>
                <td style="padding:5px 0;font-size:13px;color:#e8f0ff;">${panCard || '—'}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#7a90b8;">Status</td>
                <td style="padding:5px 0;"><span style="background:rgba(34,197,94,0.14);color:#22c55e;border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700;">✓ ${status}</span></td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#7a90b8;">Applied On</td>
                <td style="padding:5px 0;font-size:13px;color:#e8f0ff;">${fmtDate(appliedAt)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- IMPORTANT NOTE -->
        <tr>
          <td style="background:#111e33;border:1px solid #1e2f4d;border-top:none;padding:18px 32px;">
            <p style="margin:0;font-size:12px;color:#465878;line-height:1.6;">
              ⚠️ <strong style="color:#7a90b8;">Important:</strong> Your first EMI will be collected 30 days from today. 
              Please ensure sufficient balance in your account. For any queries, contact 
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f8ef7;">${SUPPORT_EMAIL}</a>
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0d1526;border:1px solid #1e2f4d;border-top:none;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#465878;">
              © ${new Date().getFullYear()} QuickLoan · RBI Regulated &amp; Secured
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#2d3e58;">
              This is an automated email. Please do not reply to this message.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ── EXPORTED FUNCTIONS ───────────────────────────────────────────────────────
async function sendLoanConfirmation(toEmail, loanData) {
    return sendEmail(
        toEmail,
        `Loan Approved & ${fmtINR(loanData.loanAmount)} Credited — QuickLoan`,
        buildHtml(loanData)
    );
}

// ── PAYMENT RECEIPT EMAIL ─────────────────────────────────────────────────────
function buildPaymentReceiptHtml(d) {
    const progressPct = Math.min(100, Math.round((d.paidInstallments / d.tenure) * 100));
    const progressBar = `
      <div style="background:#1a2a42;border-radius:99px;height:8px;overflow:hidden;margin:6px 0 10px;">
        <div style="width:${progressPct}%;height:100%;background:linear-gradient(90deg,#4f8ef7,#22c55e);border-radius:99px;"></div>
      </div>
      <p style="margin:0;font-size:12px;color:#6ee7b7;text-align:right;">${progressPct}% repaid</p>`;

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>QuickLoan — Payment Receipt</title></head>
<body style="margin:0;padding:0;background:#0d1526;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;padding:32px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#0d1829,#111e33);border:1px solid #1e2f4d;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:10px;">
          <div style="width:40px;height:40px;background:linear-gradient(135deg,#4f8ef7,#22c55e);border-radius:10px;display:inline-block;text-align:center;line-height:40px;font-size:20px;font-weight:900;color:#fff;vertical-align:middle;">⚡</div>
          <span style="font-size:22px;font-weight:800;color:#e8f0ff;vertical-align:middle;">Quick<span style="color:#4f8ef7;">Loan</span></span>
        </div>
        <p style="color:#7a90b8;font-size:13px;margin:6px 0 0;">Payment Receipt</p>
      </td></tr>

      <!-- AMOUNT PAID BANNER -->
      <tr><td style="background:linear-gradient(135deg,#0c1f3a,#0a1929);border-left:1px solid #1e2f4d;border-right:1px solid #1e2f4d;padding:22px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#7a90b8;text-transform:uppercase;letter-spacing:1px;">Amount Paid</p>
        <p style="margin:6px 0;font-size:34px;font-weight:800;color:#4f8ef7;">${fmtINR(d.paidAmount)}</p>
        <p style="margin:0;font-size:12px;color:#7a90b8;">Payment #${d.paymentNo} &nbsp;·&nbsp; ${fmtDate(d.paidAt)}</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:#111e33;border-left:1px solid #1e2f4d;border-right:1px solid #1e2f4d;padding:24px 32px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#e8f0ff;">Hello, ${d.applicantName}!</p>
        <p style="margin:0 0 20px;font-size:13px;color:#7a90b8;line-height:1.7;">
          Your payment has been successfully received. Here is your receipt summary.
        </p>

        <!-- DETAILS TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">EMI Amount</td>
            <td align="right" style="padding:9px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#e8f0ff;">${fmtINR(d.monthlyEMI)}</strong></td>
          </tr>
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">Installments Cleared</td>
            <td align="right" style="padding:9px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#22c55e;">${d.installmentsCovered}</strong></td>
          </tr>
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">Balance Before Payment</td>
            <td align="right" style="padding:9px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#e8f0ff;">${fmtINR(d.balanceBefore)}</strong></td>
          </tr>
          <tr>
            <td style="padding:9px 0;font-size:13px;color:#7a90b8;">Outstanding Balance</td>
            <td align="right" style="padding:9px 0;"><strong style="font-size:16px;color:${d.balanceAfter <= 0 ? '#22c55e' : '#f59e0b'};">${fmtINR(Math.max(0, d.balanceAfter))}</strong></td>
          </tr>
        </table>

        <!-- PROGRESS -->
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#7a90b8;text-transform:uppercase;letter-spacing:.7px;">Repayment Progress</p>
        <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">${d.paidInstallments} of ${d.tenure} installments paid</p>
        ${progressBar}
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0d1526;border:1px solid #1e2f4d;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#465878;">© ${new Date().getFullYear()} QuickLoan · RBI Regulated &amp; Secured</p>
        <p style="margin:4px 0 0;font-size:11px;color:#2d3e58;">This is an automated email. Please do not reply.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendPaymentReceipt(toEmail, data) {
    return sendEmail(
        toEmail,
        `Payment Receipt — ${fmtINR(data.paidAmount)} Received (#${data.paymentNo}) — QuickLoan`,
        buildPaymentReceiptHtml(data)
    );
}

// ── LOAN CLOSED EMAIL ─────────────────────────────────────────────────────────
function buildLoanClosedHtml(d) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>QuickLoan — Loan Fully Repaid</title></head>
<body style="margin:0;padding:0;background:#0d1526;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;padding:32px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#0d1829,#111e33);border:1px solid #1e2f4d;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
        <div style="display:inline-block;text-align:center;line-height:1;">
          <div style="width:40px;height:40px;background:linear-gradient(135deg,#4f8ef7,#22c55e);border-radius:10px;display:inline-block;line-height:40px;font-size:20px;font-weight:900;color:#fff;vertical-align:middle;">⚡</div>
          <span style="font-size:22px;font-weight:800;color:#e8f0ff;vertical-align:middle;margin-left:8px;">Quick<span style="color:#4f8ef7;">Loan</span></span>
        </div>
        <p style="color:#7a90b8;font-size:13px;margin:6px 0 0;">Loan Fully Repaid</p>
      </td></tr>

      <!-- CELEBRATION BANNER -->
      <tr><td style="background:linear-gradient(135deg,#052e16,#14532d);border-left:1px solid #1e2f4d;border-right:1px solid #1e2f4d;padding:28px 32px;text-align:center;">
        <div style="font-size:42px;">🎉</div>
        <p style="margin:8px 0 4px;font-size:22px;font-weight:800;color:#22c55e;">Congratulations!</p>
        <p style="margin:0;font-size:14px;color:#86efac;line-height:1.6;">You have successfully repaid your loan in full.<br>Your loan is now <strong>Closed</strong>.</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:#111e33;border-left:1px solid #1e2f4d;border-right:1px solid #1e2f4d;padding:24px 32px;">
        <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#e8f0ff;">Hello, ${d.applicantName}! 🏆</p>

        <!-- CLOSED LOAN SUMMARY -->
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#7a90b8;text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid #1e2f4d;padding-bottom:8px;">Closed Loan Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">Loan Amount</td>
            <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#4f8ef7;">${fmtINR(d.loanAmount)}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">Tenure</td>
            <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#e8f0ff;">${d.tenure} months</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">Interest Rate</td>
            <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#e8f0ff;">${d.interestRate}% p.a.</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">Total Paid</td>
            <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#22c55e;">${fmtINR(d.totalPayment)}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #1a2a42;font-size:13px;color:#7a90b8;">Total Payments Made</td>
            <td align="right" style="padding:8px 0;border-bottom:1px solid #1a2a42;"><strong style="color:#e8f0ff;">${d.paymentsCount} payment${d.paymentsCount > 1 ? 's' : ''}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#7a90b8;">Closed On</td>
            <td align="right" style="padding:8px 0;"><strong style="color:#22c55e;">${fmtDate(d.completedAt)}</strong></td>
          </tr>
        </table>

        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:10px;padding:14px 18px;margin-top:20px;">
          <p style="margin:0;font-size:13px;color:#86efac;line-height:1.6;">
            ✅ Your outstanding balance is now <strong style="color:#22c55e;">₹0.00</strong>. 
            No further EMI will be collected. Thank you for choosing QuickLoan!
          </p>
        </div>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0d1526;border:1px solid #1e2f4d;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#465878;">© ${new Date().getFullYear()} QuickLoan · RBI Regulated &amp; Secured</p>
        <p style="margin:4px 0 0;font-size:11px;color:#2d3e58;">This is an automated email. Please do not reply.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendLoanClosedEmail(toEmail, data) {
    return sendEmail(
        toEmail,
        `🎉 Loan Fully Repaid — ${fmtINR(data.loanAmount)} Cleared — QuickLoan`,
        buildLoanClosedHtml(data)
    );
}

module.exports = { sendLoanConfirmation, sendPaymentReceipt, sendLoanClosedEmail };
