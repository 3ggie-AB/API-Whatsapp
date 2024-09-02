const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const schedule = require('node-schedule');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', () => {
    console.log('Client is ready!');

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
});

client.on('message', message => {
    // Event listener untuk pesan masuk
    console.log('Menerima Pesan:', message.body);
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
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
