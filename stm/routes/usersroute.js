const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const auth = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { name, email, password, role_id } = req.body;
        const hashpass = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hashpass, role_id]
        );

        res.status(201).json({
            error: false,
            message: "user register successfully!!!",
            status: "success",
            data: result.rows[0]
        })
    }
    catch (err) {
        res.status(400).json({
            error: true,
            message: err.message,
            status: "failed",
        })
    }
})


router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT users.*, roles.name as role FROM users JOIN roles ON users.role_id = roles.id WHERE email=$1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                error: true,
                message: "User Not Found",
                status: "failed"
            })
        }

        const user = result.rows[0];
        const validpass = await bcrypt.compare(password, user.password);

        if (!validpass) {
            return res.status(400).json({
                error: true,
                message: "User Not Found",
                status: "failed"
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({
            error: false,
            message: "Login successful",
            status: "success",
            data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
        })

    }
    catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed"
        })
    }
})


router.get("/", auth, async (req, res) => {
    try {
        if (req.user.role !== "MANAGER") {
            return res.status(403).json({
                error: true,
                message: "Access denied. Only manager can view user list.",
                status: "failed"
            });
        }

        const result = await pool.query(
            "SELECT users.id, users.name, users.email, roles.name AS role FROM users JOIN roles ON users.role_id = roles.id"
        );

        res.json({
            error: false,
            message: "Users fetched successfully",
            status: "success",
            data: result.rows
        })
    }
    catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed",
        });
    }
});

module.exports = router;