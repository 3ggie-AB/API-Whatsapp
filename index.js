const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const schedule = require('node-schedule');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', () => {
    console.log('Client is ready!');

    // Kirim Pesan
    const number = "6285875477952";
    const message = "Hello, this is a test message from whatsapp-web.js!";
    const chatId = number + "@c.us";
    const scheduleDate = new Date(2024, 8, 2, 9, 50, 0);

    schedule.scheduleJob(scheduleDate, () => {

        client.sendMessage(chatId, message).then(response => {
            console.log('Message sent successfully:', response);
        }).catch(err => {
            console.error('Failed to send message:', err);
        });
    });

    // Ambil Data Grup
    client.getChats().then(chats => {
        // Iterasi melalui daftar chat
        chats.forEach(chat => {
            // Memeriksa apakah chat adalah grup
            if (chat.isGroup) {
                console.log(`Group Name: ${chat.name}`);
                console.log(`Group ID: ${chat.id._serialized}`);
            }
        });
    }).catch(err => {
        console.error('Failed to get chats:', err);
    });

    // Chat ke Beberapa Pesan
    const penerimas = [
        "6285875477952",
        "6289509718426",
    ];
    penerimas.forEach(penerima => {
        const chatId = penerima + "@c.us"; // Format chat ID untuk nomor telepon
        client.sendMessage(chatId, message).then(response => {
            console.log(`Message sent to ${penerima}:`, response);
        }).catch(err => {
            console.error(`Failed to send message to ${penerima}:`, err);
        });
    });
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

client.on('message_create', message => {
    if (message.body === 'ping') {
        // send back "pong" to the chat the message was sent in
        client.sendMessage(message.from, 'pong');
    }
});


client.initialize();
