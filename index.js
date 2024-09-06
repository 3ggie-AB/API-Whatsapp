require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const authenticateToken = require('./middleware/authenticateToken');
const schedule = require('node-schedule');
const express = require('express');
const crudRouter = require('./routes/crud');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const sequelize = require('./database');
const User = require('./models/User');
const Token = require('./models/Token');

sequelize.sync()
    .then(() => console.log('Database berhasil disinkronisasi'))
    .catch(err => console.error('Error saat menyinkronkan database:', err));

// Simpan instance client untuk setiap user
const clients = new Map();

app.use(express.json());

// Membuat WhatsApp client berdasarkan user
function createClientForUser(userId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `user_${userId}` }) // Client ID unik per user
    });

    client.on('ready', () => {
        console.log(`WhatsApp client untuk user ${userId} sudah siap`);
        const chatId = client.info.wid._serialized;
        client.sendMessage(chatId, "API WhatsApp Aktif untuk user!")
            .then(() => console.log('Pesan dikirim ke user!'))
            .catch(err => console.error('Error mengirim pesan:', err));
    });

    client.on('auth_failure', () => {
        console.log(`Autentikasi WhatsApp gagal untuk user ${userId}`);
    });

    client.on('qr', qr => {
        QRCode.toFile(`whatsapp-qr-${userId}.png`, qr, err => {
            if (err) throw err;
            console.log(`QR code disimpan sebagai whatsapp-qr-${userId}.png`);
        });
    });

    client.initialize();
    return client;
}

// Middleware untuk mendapatkan client berdasarkan user
function getClientForUser(req, res, next) {
    const userId = req.user.userId;
    let client = clients.get(userId);

    if (!client) {
        client = createClientForUser(userId);
        clients.set(userId, client);
    }

    req.client = client;
    next();
}

// Rute API
app.post('/api/synchat/get-groups', authenticateToken, getClientForUser, async (req, res) => {
    if (req.client) {
        req.client.getChats().then(chats => {
            const groups = chats.filter(chat => chat.isGroup);
            const groupData = groups.map(group => ({
                name: group.name,
                id: group.id._serialized
            }));
            res.json(groupData);
        }).catch(err => {
            console.error('Gagal mendapatkan daftar grup:', err);
            res.status(500).json({ status: '500', message: 'Gagal mendapatkan daftar grup' });
        });
    } else {
        res.status(401).json({ status: '401', message: 'Harap login terlebih dahulu' });
    }
});

app.post('/api/synchat/get-contacts', authenticateToken, getClientForUser, async (req, res) => {
    if (req.client) {
        req.client.getContacts().then(contacts => {
            const uniqueContacts = Array.from(new Map(contacts.map(contact => [contact.number, contact])).values());
            const filteredContacts = uniqueContacts.filter(contact => {
                const number = contact.number;
                const validNumber = number && (number.startsWith('628') || number.startsWith('+628'));
                const validName = contact.name && contact.name.trim() !== '';
                const validPushname = contact.pushname && contact.pushname.trim() !== '';
                return validNumber && !contact.isGroup && (validName || validPushname);
            });
            res.json({
                status: '200',
                message: 'Berhasil Mengambil Data Kontak',
                contacts: filteredContacts.map(contact => ({
                    name: contact.name || contact.pushname || 'Tanpa Nama',
                    number: contact.number
                }))
            });
        }).catch(err => {
            console.error('Gagal mendapatkan daftar kontak:', err);
            res.status(500).json({ status: '500', message: 'Gagal mendapatkan daftar kontak' });
        });
    } else {
        res.status(401).json({ status: '401', message: 'Harap login terlebih dahulu' });
    }
});

app.post('/api/synchat/grup', authenticateToken, getClientForUser, (req, res) => {
    if (req.client) {
        const grups = req.body.grups;
        const message = req.body.pesan;
        const scheduleTime = req.body.jadwal ? new Date(req.body.jadwal) : new Date();

        if (!Array.isArray(grups) || grups.length === 0 || !message) {
            return res.status(400).json({
                status: '400',
                message: 'Array ID grup dan pesan harus disediakan'
            });
        }

        const scheduleDate = new Date(scheduleTime);

        schedule.scheduleJob(scheduleDate, () => {
            const promises = grups.map(groupId => req.client.sendMessage(groupId, message));
            Promise.all(promises)
                .then(() => console.log('Pesan terkirim ke Semua Grup'))
                .catch(err => console.error('Gagal mengirim pesan ke grup', err));
        });

        res.json({
            status: '200',
            message: 'Pesan dijadwalkan'
        });
    } else {
        res.status(401).json({
            status: '401',
            message: 'Harap login terlebih dahulu'
        });
    }
});

app.post('/api/synchat/pesan', authenticateToken, getClientForUser, async (req, res) => {
    if (req.client) {
        const numbers = req.body.nomor;
        const message = req.body.pesan;
        const scheduleTime = req.body.jadwal ? new Date(req.body.jadwal) : null;

        if (!Array.isArray(numbers) || numbers.length === 0 || !message) {
            return res.status(400).json({
                status: '400',
                message: 'Array nomor telepon dan pesan harus disediakan'
            });
        }

        if (scheduleTime && scheduleTime > new Date()) {
            schedule.scheduleJob(scheduleTime, async () => {
                try {
                    const promises = numbers.map(number => {
                        const chatId = number + "@c.us";
                        return req.client.sendMessage(chatId, message);
                    });
                    await Promise.all(promises);
                    console.log('Semua Pesan Terkirim');
                } catch (err) {
                    console.error('Gagal mengirim pesan, Mungkin Nomor Yang Dimasukkan Tidak Valid', err);
                }
            });

            res.json({
                status: '200',
                message: 'Pesan dijadwalkan'
            });
        } else {
            try {
                const promises = numbers.map(number => {
                    const chatId = number + "@c.us";
                    return req.client.sendMessage(chatId, message);
                });
                await Promise.all(promises);
                console.log('Semua Pesan Terkirim');
                res.json({
                    status: '200',
                    message: 'Pesan Terkirim'
                });
            } catch (err) {
                console.error('Gagal mengirim pesan, Mungkin Nomor Yang Dimasukkan Tidak Valid', err);
                res.status(500).json({
                    status: '500',
                    message: 'Gagal mengirim pesan'
                });
            }
        }
    } else {
        res.status(401).json({
            status: '401',
            message: 'Harap login terlebih dahulu'
        });
    }
});

app.post('/api/synchat/qr', authenticateToken, (req, res) => {
    const token = req.body.token; // Ambil token dari body
    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

    const filePath = path.join(__dirname, `whatsapp-qr-${token}.png`);
    res.sendFile(filePath, err => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error sending QR code.');
        }
    });
});


app.post('/api/synchat/logout', authenticateToken, getClientForUser, async (req, res) => {
    try {
        await req.client.logout();
        clients.delete(req.user.userId); // Hapus instance WhatsApp client user
        res.json({ status: '200', message: 'Berhasil Logout' });
    } catch (err) {
        res.status(500).json({ status: '500', message: 'Error, Tidak dapat Logout' });
    }
});

app.post('/api/synchat/status', authenticateToken, getClientForUser, (req, res) => {
    if (req.client.info && req.client.info.wid) {
        res.json({ status: 'connected', message: 'Terhubung', clientInfo: req.client.info });
    } else {
        res.status(500).json({ status: 'disconnected', message: 'Tidak Terhubung' });
    }
});

app.use('/api/synchat/akun', crudRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
