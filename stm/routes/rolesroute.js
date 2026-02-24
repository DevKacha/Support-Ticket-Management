const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Role name is required" });
        }

        const result = await pool.query(
            "INSERT INTO roles (name) VALUES ($1) RETURNING *",
            [name]
        );

        res.status(201).json({
            message: "Role created successfully",
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === "23505") { // PostgreSQL unique violation code
            return res.status(400).json({ message: "Role already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM roles");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Role name is required" });
        }

        const result = await pool.query(
            "UPDATE roles SET name = $1 WHERE id = $2 RETURNING *",
            [name, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.json({ message: "Role updated successfully", data: result.rows[0] });
    } catch (err) {
        if (err.code === "23505") {
            return res.status(400).json({ message: "Role already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM roles WHERE id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.json({ message: "Role deleted successfully" });
    } catch (err) {
        if (err.code === "23503") {
            return res.status(400).json({
                message: "Cannot delete role. It is assigned to users."
            });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;