const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { hashSHA256, verifySHA256 } = require('./crypto');

/**
 * Generate a random 6-digit OTP code using CSPRNG
 * 
 * Perbaikan: Menggunakan crypto.randomInt() sebagai pengganti Math.random()
 * - crypto.randomInt() menggunakan Cryptographically Secure Pseudo-Random Number Generator
 * - Math.random() tidak dirancang untuk keamanan (predictable under certain conditions)
 * 
 * @returns {string} 6-digit OTP code (plaintext, untuk dikirim via email)
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP code using SHA-256 before storing in database
 * 
 * Mengapa hash OTP?
 * - Jika database bocor, penyerang tidak bisa melihat OTP plaintext yang masih valid
 * - SHA-256 cukup karena OTP sudah dilindungi oleh: single-use + expiry (5 menit)
 * 
 * @param {string} otpCode - Plaintext OTP code
 * @returns {string} SHA-256 hex hash
 */
function hashOTP(otpCode) {
  return hashSHA256(otpCode);
}

/**
 * Verify an OTP code against its stored hash
 * @param {string} inputCode - User's input OTP
 * @param {string} storedHash - SHA-256 hash from database
 * @returns {boolean} True if OTP matches
 */
function verifyOTP(inputCode, storedHash) {
  return verifySHA256(inputCode, storedHash);
}

/**
 * Send OTP code via email
 * Uses Brevo HTTP API to bypass outbound SMTP blocks on Hugging Face Spaces.
 * 
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit OTP code
 * @param {string} userName - User's name for personalization
 */
async function sendOTPEmail(to, code, userName = 'User') {
  const senderEmail = process.env.SMTP_USER || 'noreply@bpkb-ipb.ac.id';
  const senderName = 'BPKB IPB University';
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #0B1E4D, #2D55AC); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">BPKB IPB University</h1>
        <p style="color: #93c5fd; margin: 5px 0 0;">Badan Pengembangan Kampus Berkelanjutan</p>
      </div>
      <div style="padding: 30px; background: white;">
        <h2 style="color: #0B1E4D; margin-top: 0;">Halo, ${userName}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Kami menerima permintaan login ke akun Anda. Gunakan kode OTP berikut untuk melanjutkan:
        </p>
        <div style="background: linear-gradient(135deg, #0B1E4D, #1e3a8a); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
          <p style="color: #93c5fd; font-size: 14px; margin: 0 0 10px;">Kode Verifikasi Anda</p>
          <h1 style="color: white; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: monospace;">${code}</h1>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          ⏰ Kode ini berlaku selama <strong>5 menit</strong>.<br>
          🔒 Jangan bagikan kode ini kepada siapapun.<br>
          ❌ Jika Anda tidak melakukan permintaan ini, abaikan email ini.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2026 BPKB IPB University. All rights reserved.
        </p>
      </div>
    </div>
  `;

  // Gunakan Brevo API jika API Key tersedia
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to, name: userName }],
          subject: \`🔐 Kode OTP Login BPKB IPB - \${code}\`,
          htmlContent: htmlContent
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(JSON.stringify(errData));
      }

      console.log(\`📨 [Brevo API] OTP \${code} sent to \${to}\`);
      return await response.json();
    } catch (error) {
      console.error('❌ Brevo API Error:', error.message);
      throw error;
    }
  }

  // Fallback ke Ethereal untuk local development jika tidak ada Brevo API Key
  console.log('⚠️  No BREVO_API_KEY found. Using Ethereal test email (Dev Mode)...');
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const mailOptions = {
    from: \`"\${senderName}" <\${senderEmail}>\`,
    to,
    subject: \`🔐 Kode OTP Login BPKB IPB - \${code}\`,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('📧 Ethereal OTP Email Preview URL:', previewUrl);
  }
  
  return info;
}

module.exports = { generateOTP, hashOTP, verifyOTP, sendOTPEmail };
