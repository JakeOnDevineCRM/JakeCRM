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

// API to fetch all nodes from Neo4j
router.get("/nodes", async (req, res) => {
    try {
        const label = req.query.label || "All";
        let query = "MATCH (n) RETURN n";
        if (label !== "All") {
            query = `MATCH (n:${label}) RETURN n`;
        }
        const result = await session.run(query);
        if (!result.records.length) {
            return res.json([]);
        }
        const nodes = result.records.map(record => ({
            labels: record.get("n").labels,
            properties: record.get("n").properties
        }));
        res.json(nodes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch nodes." });
    }
});

// Delete Node
router.delete("/delete-node/:name", async (req, res) => {
    try {
        const name = req.params.name;
        await session.run("MATCH (n {name: $name}) DETACH DELETE n", { name });
        res.json({ message: `Node '${name}' deleted successfully!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete node." });
    }
});

//Update Quantity
router.post("/update-quantity", async (req, res) => {
    try {
        const { name, newQuantity } = req.body;
        const result = await session.run(
            "MATCH (n {name: $name}) SET n.quantity = $newQuantity RETURN n",
            { name, newQuantity: parseInt(newQuantity) }
        );

        res.json({ message: `Quantity for '${name}' updated to ${newQuantity}!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update quantity." });
    }
});

// Update Price
router.post("/update-price", async (req, res) => {
    try {
        const { name, newPrice } = req.body;
        const result = await session.run(
            "MATCH (n {name: $name}) SET n.price = $newPrice RETURN n",
            { name, newPrice: parseInt(newPrice) }
        );

        res.json({ message: `Price for '${name}' updated to ${newPrice}!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update price." });
    }
});

// Add a new node base on selected category
router.post("/create-node", async (req, res) => {
    try {
        const { name, category, quantity, price } = req.body;
        const result = await session.run(
            `CREATE (n:${category} {name: $name, quantity: $quantity, price: $price}) RETURN n`,
            { name, quantity: parseInt(quantity), price: parseFloat(price) }
        );

        res.json({ message: `Node '${name}' added to ${category}!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to create node." });
    }
});

module.exports = router;