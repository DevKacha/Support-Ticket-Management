const express = require("express");
const pool = require("../db");
const auth = require("../middleware/authmiddleware");

const router = express.Router();

router.get("/", auth, async (req, res) => {
    try {
        if (req.user.role !== "MANAGER") {
            return res.status(403).json({
                error: true,
                message: "Access denied. Only manager can view all comments.",
                status: "failed"
            });
        }

        const result = await pool.query("SELECT * FROM ticket_comments");

        res.json({
            error: false,
            message: "Ticket comments fetched successfully",
            status: "success",
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed"
        });
    }
});


router.patch("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const existing = await pool.query(
            "SELECT * FROM ticket_comments WHERE id=$1",
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: "Comment not found",
                status: "failed"
            });
        }

        const commentData = existing.rows[0];

        if (req.user.role !== "MANAGER" && commentData.user_id !== req.user.id) {
            return res.status(403).json({
                error: true,
                message: "Access denied",
                status: "failed"
            });
        }

        const updated = await pool.query(
            "UPDATE ticket_comments SET comment=$1 WHERE id=$2 RETURNING *",
            [comment, id]
        );

        res.json({
            error: false,
            message: "Comment updated successfully",
            status: "success",
            data: updated.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed"
        });
    }
});


router.delete("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query(
            "SELECT * FROM ticket_comments WHERE id=$1",
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: "Comment not found",
                status: "failed"
            });
        }

        const commentData = existing.rows[0];

        if (req.user.role !== "MANAGER" && commentData.user_id !== req.user.id) {
            return res.status(403).json({
                error: true,
                message: "Access denied",
                status: "failed"
            });
        }

        await pool.query("DELETE FROM ticket_comments WHERE id=$1", [id]);

        res.json({
            error: false,
            message: "Comment deleted successfully",
            status: "success"
        });

    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed"
        });
    }
});

module.exports = router;