const TOKEN_SECRET = process.env.TOKEN_SECRET; // Ambil token dari .env

const authenticateToken = (req, res, next) => {
    const token = req.body.token; // Ambil token dari body request

    if (token === TOKEN_SECRET) {
        next(); // Token valid, lanjutkan ke middleware berikutnya
    } else {
        res.status(401).json({ status: '401', message: 'Token tidak valid' }); // Token tidak valid
    }
};

module.exports = authenticateToken;
