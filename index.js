require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const authenticateToken = require('./auth'); 
const schedule = require('node-schedule');
const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;


let isLoggedIn = false;
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', () => {
    isLoggedIn = true;
    const chatId = client.info.wid._serialized;
    client.sendMessage(chatId, "API Whatsapp Aktif !!!").then(response => {
        console.log('API Whatsapp Aktif !!!');
    }).catch(err => {
        console.error('API Whatsapp Eror :', err);
    });
});


client.on('auth_failure', () => {
    res.json({ status: '500', message: 'Error' });
    isLoggedIn = false;
});

app.get('/api/synchat/get-groups', authenticateToken, (req, res) => {
    if (isLoggedIn) {
        client.getChats().then(chats => {
            const groups = chats.filter(chat => chat.isGroup);
            res.json({
                status: '200',
                groups: groups.map(group => ({
                    id: group.id._serialized,
                    name: group.name
                }))
            });
        }).catch(err => {
            console.error('Gagal mendapatkan daftar grup:', err);
            res.status(500).json({ status: '500', message: 'Gagal mendapatkan daftar grup' });
        });
    } else {
        res.status(401).json({ status: '401', message: 'Harap login terlebih dahulu' });
    }
});

app.post('/api/synchat/grup', authenticateToken, (req, res) => {
    if (isLoggedIn) {
        const grups = req.body.grups; // Mengambil array ID grup dari body request
        const message = req.body.pesan; // Mengambil pesan dari body request
        const scheduleTime = req.body.jadwal ? new Date(req.body.jadwal) : new Date();
        // Mengambil waktu penjadwalan dari body request

        // Validasi input
        if (!Array.isArray(grups) || grups.length === 0 || !message) {
            return res.status(400).json({
                status: '400',
                message: 'Array ID grup dan pesan harus disediakan'
            });
        }

        // Konversi waktu penjadwalan ke objek Date
        const scheduleDate = new Date(scheduleTime);

        // Penjadwalan pengiriman pesan
        schedule.scheduleJob(scheduleDate, () => {
            // Kirim pesan ke setiap ID grup pada waktu yang ditentukan
            const promises = grups.map(groupId => {
                // Pastikan format ID grup sesuai, misalnya dengan @g.us untuk grup
                const chatId = groupId;
                return client.sendMessage(chatId, message);
            });

            Promise.all(promises)
                .then(responses => {
                    console.log('Pesan terkirim ke Semua Grup:');
                })
                .catch(err => {
                    console.error('Gagal mengirim pesan:', err);
                });
        });

        res.json({
            status: '200',
            message: 'Pesan dikirim'
        });
    } else {
        res.status(401).json({
            status: '401',
            message: 'Harap login terlebih dahulu'
        });
    }
});

app.post('/api/synchat/pesan', authenticateToken, (req, res) => {
    if (isLoggedIn) {
        const numbers = req.body.nomor; // Mengambil array nomor telepon dari body request
        const message = req.body.pesan; // Mengambil pesan dari body request
        const scheduleTime = req.body.jadwal ? new Date(req.body.jadwal) : new Date(); // Mengambil waktu penjadwalan dari body request

        // Validasi input
        if (!Array.isArray(numbers) || numbers.length === 0 || !message) {
            return res.status(400).json({
                status: '400',
                message: 'Array nomor telepon dan pesan harus disediakan'
            });
        }

        // Konversi waktu penjadwalan ke objek Date
        const scheduleDate = new Date(scheduleTime);

        // Penjadwalan pengiriman pesan
        schedule.scheduleJob(scheduleDate, () => {
            // Kirim pesan ke setiap nomor telepon pada waktu yang ditentukan
            const promises = numbers.map(number => {
                const chatId = number + "@c.us";
                return client.sendMessage(chatId, message);
            });

            Promise.all(promises)
                .then(responses => {
                    console.log('Pesan terkirim ke semua nomor');
                })
                .catch(err => {
                    console.error('Gagal mengirim pesan:', err);
                });
        });

        res.json({
            status: '200',
            message: 'Pesan dikirim'
        });

    } else {
        res.status(401).json({
            status: '401',
            message: 'Harap login terlebih dahulu'
        });
    }
});

app.get('/api/synchat/qr', authenticateToken, (req, res) => {
    if (isLoggedIn) {
        res.json({ status: '201', message: 'Perangkat sudah terhubung' });
    } else {
        const filePath = path.join(__dirname, 'whatsapp-qr.png');
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending QR code.');
            }
        });
    }
});

app.get('/api/synchat/logout', authenticateToken, async (req, res) => {
    try {
        await client.logout();
        isLoggedIn = false;
        res.json({ status: '200', message: 'Berhasil Logout' });
        const chatId = client.info.wid._serialized;
        client.sendMessage(chatId, "Akun Anda Berhasil Logout !!!").then(response => {
            console.log('Akun Berhasil Logout !!!');
        }).catch(err => {
            console.error('API Whatsapp Eror :', err);
        });
    } catch (err) {
        res.json({ status: '500', message: 'Error, Tidak dapat Logout' });
    }
});

app.get('/api/synchat/status', authenticateToken, (req, res) => {
    if (client.info && client.info.wid) {
        res.json({ status: 'connected', message: 'Terhubung', clientInfo: client.info });
    } else {
        res.status(500).json({ status: 'disconnected', message: 'Tidak Terhubung' });
    }
});

client.on('message', message => {
    // Event listener untuk pesan masuk
    console.log('Menerima Pesan:', message.body);
});

client.on('qr', qr => {
    QRCode.toFile('whatsapp-qr.png', qr, function (err) {
        if (err) throw err;
        console.log('QR code saved as whatsapp-qr.png');
    });
});

client.initialize();
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});