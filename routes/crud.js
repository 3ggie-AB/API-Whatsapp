// routes/crud.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/Token');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');

// Route untuk membuat pengguna
router.post('/register', async (req, res) => {
    try {
        const user = await User.create({
            username: req.body.username,
            password: req.body.password
        });
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error saat membuat pengguna' });
    }
});


// Route untuk membaca semua pengguna
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error saat mengambil pengguna' });
    }
});

// Route untuk memperbarui pengguna berdasarkan ID
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            user.username = req.body.username;
            user.password = req.body.password;
            await user.save();
            res.json(user);
        } else {
            res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error saat memperbarui pengguna' });
    }
});

// Route untuk menghapus pengguna berdasarkan ID
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.destroy();
            res.json({ message: 'Pengguna berhasil dihapus' });
        } else {
            res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error saat menghapus pengguna' });
    }
});

// Route untuk menghasilkan token
router.post('/token', async (req, res) => {
    try {
        const user = await User.findOne({ where: { username: req.body.username } });
        if (user && user.password === req.body.password) {
            const token = jwt.sign({ userId: user.id }, 'SECRET_KEY', { expiresIn: '1h' });
            const tokenRecord = await Token.create({ token, userId: user.id, qrFilePath: `whatsapp-qr-${token}.png` });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Kredensial tidak valid' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error saat menghasilkan token' });
    }
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username, password } });

        if (!user) {
            return res.status(401).json({ status: "401", message: "Username atau password salah" });
        }

        // Buat token
        const token = jwt.sign({ userId: user.id }, 'SECRET_KEY', { expiresIn: '1h' });

        // Simpan token di database
        await Token.create({ token, userId: user.id });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

router.post('/qr', authenticateToken, (req, res) => {
    const token = req.body.token; // Ambil token dari request body
    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

    const filePath = path.join(__dirname, `whatsapp-qr-${token}.png`);

    QRCode.toFile(filePath, req.body.qrCodeData, err => {
        if (err) {
            console.error('Gagal menyimpan QR code:', err);
            return res.status(500).json({ message: 'Gagal menyimpan QR code' });
        }
        res.json({ message: 'QR code berhasil disimpan', filePath });
    });
});


module.exports = router;
