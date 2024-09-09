require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');
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
    client.sendMessage(chatId, "API Whatsapp Aktif !!!")
        .then(() => console.log('API Whatsapp Aktif !!!'))
        .catch(err => console.error('API Whatsapp Error:', err));
});

client.on('auth_failure', () => {
    isLoggedIn = false;
    console.log('Autentikasi Gagal');
});

client.on('message_create', async message => {
    // Balasan untuk perintah !help
    if (message.body === '!help') {
        await client.sendMessage(message.from, 'Selamat Datang Di BotEggie. Berikut Ini Adalah List Perintah Yang Tersedia :\n\n!help = Melihat Semua Perintah\n!stiker = Gunakan dalam Foto untuk Membuat Stiker');
    }
    if (message.hasMedia && message.body === '!stiker') {
        console.log(message.from, 'Menggunakan Fitur Stiker');
        try {
            const media = await message.downloadMedia();
            const imageBuffer = Buffer.from(media.data, 'base64');
            const webpBuffer = await sharp(imageBuffer)
                .resize(512, 512)
                .webp({ quality: 100 })
                .toBuffer();
            const stickerMedia = new MessageMedia('image/webp', webpBuffer.toString('base64'));
            await client.sendMessage(message.from, stickerMedia, { sendMediaAsSticker: true });
        } catch (err) {
            console.error('Gagal mengirim stiker:', err);
        }
    }
});

client.on('message', async message => {
    console.log('Menerima Pesan:', message.body);
});

app.post('/api/synchat/get-groups', authenticateToken, async (req, res) => {
    if (isLoggedIn) {
        client.getChats().then(chats => {
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

app.post('/api/synchat/get-contacts', authenticateToken, async (req, res) => {
    if (isLoggedIn) {
        client.getContacts().then(contacts => {
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

app.post('/api/synchat/grup', authenticateToken, (req, res) => {
    if (isLoggedIn) {
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
            const promises = grups.map(groupId => {
                return client.sendMessage(groupId, message);
            });

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

app.post('/api/synchat/pesan', authenticateToken, async (req, res) => {
    if (isLoggedIn) {
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
                        return client.sendMessage(chatId, message);
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
                    return client.sendMessage(chatId, message);
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
                    message: 'Gagal mengirim pesan',
                    error: err
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

app.post('/api/synchat/logout', authenticateToken, async (req, res) => {
    try {
        await client.logout();
        isLoggedIn = false;
        res.json({ status: '200', message: 'Berhasil Logout' });
    } catch (err) {
        res.status(500).json({ status: '500', message: 'Error, Tidak dapat Logout' });
    }
});

app.post('/api/synchat/status', authenticateToken, (req, res) => {
    if (isLoggedIn) {
        if (client.info && client.info.wid) {
            res.json({ status: 'connected', message: 'Terhubung', clientInfo: client.info });
        } else {
            res.status(500).json({ status: 'disconnected', message: 'Tidak Terhubung' });
        }
    } else {
        res.json({ status: 'disconnected', message: 'Tidak Terhubung', clientInfo: client.info });
    }
});

client.on('qr', qr => {
    QRCode.toFile('whatsapp-qr.png', qr, err => {
        if (err) throw err;
        console.log('QR code saved as whatsapp-qr.png');
    });
});

client.initialize();

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
