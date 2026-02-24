const express = require("express");
const pool = require("../db");
const auth = require("../middleware/authmiddleware");

const router = express.Router();

router.get("/", auth, async (req, res) => {
    try {
        let query = "SELECT tickets.*, users.name as creator_name FROM tickets LEFT JOIN users ON tickets.created_by = users.id";
        let params = [];

        if (req.user.role === "USER") {
            query += " WHERE created_by = $1";
            params.push(req.user.id);
        }

        query += " ORDER BY created_at DESC";
        const result = await pool.query(query, params);

        res.json({
            error: false,
            message: "Tickets fetched successfully",
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

router.get("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: "Ticket not found",
                status: "failed"
            });
        }

        const ticket = result.rows[0];

        const allowed =
            req.user.role === "MANAGER" ||
            (req.user.role === "SUPPORT" && ticket.assigned_to === req.user.id) ||
            (req.user.role === "USER" && ticket.created_by === req.user.id);

        if (!allowed) {
            return res.status(403).json({
                error: true,
                message: "Access denied",
                status: "failed"
            });
        }

        res.json({
            error: false,
            message: "Ticket fetched successfully",
            status: "success",
            data: ticket
        });

    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed"
        });
    }
});

router.post("/", auth, async (req, res) => {
    try {
        const { title, description, status, priority, assigned_to } = req.body;

        const created_by = req.user.id;

        const result = await pool.query(
            `INSERT INTO tickets 
            (title, description, status, priority, created_by, assigned_to) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [title, description, status, priority, created_by, assigned_to]
        );

        res.status(201).json({
            error: false,
            message: "Ticket created successfully",
            status: "success",
            data: result.rows[0]
        });

    } catch (err) {
        res.status(400).json({
            error: true,
            message: err.message,
            status: "failed"
        });
    }
});


router.patch("/:id/assign", auth, async (req, res) => {
    try {
        if (!["MANAGER", "SUPPORT"].includes(req.user.role)) {
            return res.status(403).json({
                error: true,
                message: "Access denied",
                status: "failed"
            });
        }

        const { assigned_to } = req.body;
        const { id } = req.params;

        const result = await pool.query(
            "UPDATE tickets SET assigned_to=$1 WHERE id=$2 RETURNING *",
            [assigned_to, id]
        );

        res.json({
            error: false,
            message: "Ticket assigned successfully",
            status: "success",
            data: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed"
        });
    }
});


router.patch("/:id/status", auth, async (req, res) => {
    try {
        if (!["MANAGER", "SUPPORT"].includes(req.user.role)) {
            return res.status(403).json({
                error: true,
                message: "Access denied",
                status: "failed"
            });
        }

        const { status } = req.body;
        const { id } = req.params;

        const result = await pool.query(
            "UPDATE tickets SET status=$1 WHERE id=$2 RETURNING *",
            [status, id]
        );

        res.json({
            error: false,
            message: "Status updated successfully",
            status: "success",
            data: result.rows[0]
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
        if (req.user.role !== "MANAGER") {
            return res.status(403).json({
                error: true,
                message: "Only manager can delete tickets",
                status: "failed"
            });
        }

        const { id } = req.params;

        await pool.query("DELETE FROM tickets WHERE id=$1", [id]);

        res.json({
            error: false,
            message: "Ticket deleted successfully",
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


router.post("/:id/comments", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const ticket = await pool.query("SELECT * FROM tickets WHERE id=$1", [id]);

        if (ticket.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: "Ticket not found",
                status: "failed"
            });
        }

        const ticketData = ticket.rows[0];

        const allowed =
            req.user.role === "MANAGER" ||
            (req.user.role === "SUPPORT" && ticketData.assigned_to === req.user.id) ||
            (req.user.role === "USER" && ticketData.created_by === req.user.id);

        if (!allowed) {
            return res.status(403).json({
                error: true,
                message: "Access denied",
                status: "failed"
            });
        }

        const result = await pool.query(
            "INSERT INTO ticket_comments (title_id, user_id, comment) VALUES ($1,$2,$3) RETURNING *",
            [id, req.user.id, comment]
        );

        res.status(201).json({
            error: false,
            message: "Comment added successfully",
            status: "success",
            data: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            error: true,
            message: err.message,
            status: "failed"
        });
    }
});

router.get("/:id/comments", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await pool.query("SELECT * FROM tickets WHERE id=$1", [id]);

        if (ticket.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: "Ticket not found",
                status: "failed"
            });
        }

        const ticketData = ticket.rows[0];

        const allowed =
            req.user.role === "MANAGER" ||
            (req.user.role === "SUPPORT" && ticketData.assigned_to === req.user.id) ||
            (req.user.role === "USER" && ticketData.created_by === req.user.id);

        if (!allowed) {
            return res.status(403).json({
                error: true,
                message: "Access denied",
                status: "failed"
            });
        }

        const comments = await pool.query(
            "SELECT ticket_comments.*, users.name as user_name FROM ticket_comments JOIN users ON ticket_comments.user_id = users.id WHERE title_id=$1 ORDER BY ticket_comments.created_at ASC",
            [id]
        );

        res.json({
            error: false,
            message: "Comments fetched successfully",
            status: "success",
            data: comments.rows
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