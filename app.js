const express = require('express');
const session = require('express-session');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi user & secret
const SECRET_KEY = "Rahas1aServer!";
const USER_ID = "brankas_owner";
const LOGIN_PW = "brankas123"; // Ganti dengan password yang kamu mau

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'sessionsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 20 * 60 * 1000 } // 20 menit
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Halaman login
app.get('/', (req, res) => {
    if (req.session.loggedIn) return res.redirect('/qr');
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === LOGIN_PW) {
        req.session.loggedIn = true;
        return res.redirect('/qr');
    }
    res.render('login', { error: "Password salah!" });
});

// Halaman QR code (hanya bisa jika sudah login)
app.get('/qr', async (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/');
    const { token, qr_img } = await generateQRData(USER_ID);
    res.render('index', {
        qr_img,
        qr_token: token,
        user: { name: "Pemilik Brankas", user_id: USER_ID },
        error: null
    });
});

// Untuk AJAX refresh QR
app.get('/api/qrcode', async (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: "Unauthorized" });
    const { token, qr_img } = await generateQRData(USER_ID);
    res.json({ qr_img, qr_token: token });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Fungsi generate QR code dinamis
async function generateQRData(user_id) {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / 60); // 1 menit
    const message = `${user_id}|${window}`;
    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(message)
        .digest('hex');
    const token = `${user_id}|${window}|${signature}`;
    const qr_img = await QRCode.toDataURL(token, { width: 300, margin: 2 });
    return { token, qr_img };
}

app.listen(PORT, () => {
    console.log(`Web QR siap di http://localhost:${PORT}`);
});