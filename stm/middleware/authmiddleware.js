const jwt = require("jsonwebtoken");

const token_check = (req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({
            error: true,
            message: "invalid token",
            status: "failed"
        });
    }

    try {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({
            error: true,
            message: err.message,
            status: "failed"
        })

    };
}

module.exports = token_check;