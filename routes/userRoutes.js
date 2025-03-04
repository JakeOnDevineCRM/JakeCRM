const express = require('express');
const path = require('path');
const router = express.Router();
const { session } = require("../config/db");

// Serve secret page (GET request)
router.get('/main', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '..', 'views', 'main-page.html'));
});

// Route to create a "Test" node in Neo4j
router.post("/create-node", async (req, res) => {
    try {
        const result = await session.run(
            "CREATE (n:Hello {name: $name}) RETURN n",
            { name: "Hello Node" }
        );
        res.json({ message: "Node created successfully!", node: result.records[0].get("n").properties });
    } catch (error) {
        console.error("Neo4j Error:", error);
        res.status(500).json({ error: "Failed to create node" });
    }
});

module.exports = router;