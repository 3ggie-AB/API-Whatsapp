const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // Jangan periksa token untuk rute yang tidak memerlukan autentikasi
    if (['/api/synchat/akun/register', '/api/synchat/akun/login'].includes(req.path)) {
        return next();
    }

    // Ambil token dari body (bukan dari headers)
    const token = req.body.token; 

    // Jika tidak ada token, kembalikan error
    if (!token) return res.status(401).json({ message: 'Token Harus Ada' });

    // Verifikasi token
    jwt.verify(token, 'SECRET_KEY', (err, user) => {
        if (err) return res.status(403).json({ message: 'Token tidak valid' });
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
