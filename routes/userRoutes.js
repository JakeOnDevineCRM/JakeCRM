const express = require('express');
const path = require('path');
const router = express.Router();
const { session } = require("../config/db");

// Serve main page
router.get('/main', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '..', 'views', 'main-page.html'));
});

// Fetch main categories
router.get("/main-categories", async (req, res) => {
    try {
        const result = await session.run(
            `MATCH (:Menu {name: "Home"})-[:CONNECTED_TO]->(category) 
             RETURN category.name AS categoryName`
        );
        if (result.records.length === 0) {
            return res.status(404).json({ error: "No categories connected to Home." });
        }
        const categories = result.records.map(record => record.get("categoryName"));
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch main categories." });
    }
});

// Fetch subcategories dynamically
router.get("/sub-categories", async (req, res) => {
    try {
        let mainCategory = req.query.mainCategory;
        if (!mainCategory) {
            return res.status(400).json({ error: "Main category is required." });
        }
        const subCategoryResult = await session.run(
            `MATCH (parent {name: $mainCategory})-[:INCLUDES]->(sub) 
             RETURN DISTINCT sub.name AS SubCategory`,
            { mainCategory }
        );
        if (subCategoryResult.records.length === 0) {
            return res.json({ [mainCategory]: {} });
        }
        let structuredResponse = { [mainCategory]: {} };
        let subCategories = subCategoryResult.records.map(record => record.get("SubCategory"));
        for (let subCategory of subCategories) {
            const itemsResult = await session.run(
                `MATCH (item)-[:BELONGS_TO]->(subcategory {name: $subCategory}) 
                 WHERE NOT $subCategory IN labels(item) 
                 RETURN item.name AS Item`,
                { subCategory }
            );
            let items = itemsResult.records.map(record => record.get("Item")).filter(name => name);
            structuredResponse[mainCategory][subCategory] = items;
        }
        res.json(structuredResponse);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sub-categories." });
    }
});

// Fetch nodes (items) inside a sub-category
router.get("/nodes", async (req, res) => {
    try {
        const subCategory = req.query.subCategory;
        if (!subCategory) {
            return res.status(400).json({ error: "Sub-category is required." });
        }
        // Fetch nodes 
        const result = await session.run(
            `MATCH (item)-[:BELONGS_TO]->(subcategory {name: $subCategory}) 
             RETURN item`,
            { subCategory }
        );
        if (result.records.length === 0) {
            return res.json([]);
        }
        const nodes = result.records.map(record => ({
            labels: record.get("item").labels,
            properties: record.get("item").properties
        }));
        res.json(nodes);
    } catch (error) {
        console.error("Error fetching nodes:", error);
        res.status(500).json({ error: "Failed to fetch nodes." });
    }
});

// Delete Category/Menu
router.delete("/delete-category/:category", async (req, res) => {
    try {
        const category = req.params.category;
        if (!category) {
            return res.status(400).json({ error: "Category name is required." });
        }
        // Check if the category exists
        const checkCategory = await session.run(
            `MATCH (c {name: $category}) RETURN c LIMIT 1`,
            { category }
        );
        if (checkCategory.records.length === 0) {
            return res.status(404).json({ error: `Category '${category}' not found.` });
        }
        // Delete category, all subcategories, and all items
        await session.run(
            `MATCH (c {name: $category}) 
             OPTIONAL MATCH (c)-[r1:INCLUDES]->(sub) 
             OPTIONAL MATCH (sub)-[r2:INCLUDES]->(child) 
             OPTIONAL MATCH (item)-[r3:BELONGS_TO]->(sub)
             DETACH DELETE c, sub, child, item`,
            { category }
        );
        res.json({ message: `Menu: '${category}' and all related subcategories & items deleted successfully!` });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Failed to delete category." });
    }
});

// Delete Sub category
router.delete("/delete-subcategory/:mainCategory/:subCategory", async (req, res) => {
    try {
        const { mainCategory, subCategory } = req.params;
        if (!mainCategory || !subCategory) {
            return res.status(400).json({ error: "Main category and sub-category names are required." });
        }
        // Check if the sub-category exists
        const checkSubCategory = await session.run(
            `MATCH (sub {name: $subCategory}) RETURN sub`,
            { subCategory }
        );
        if (checkSubCategory.records.length === 0) {
            return res.status(404).json({ error: `Sub-category '${subCategory}' under '${mainCategory}' not found.` });
        }

        // Delete all related items
        await session.run(
            `MATCH (sub {name: $subCategory}) 
             OPTIONAL MATCH (sub)-[:INCLUDES*]->(child) 
             OPTIONAL MATCH (item)-[:BELONGS_TO]->(sub) 
             DETACH DELETE sub, child, item`,
            { subCategory }
        );
        res.json({ message: `Sub-category '${subCategory}' under '${mainCategory}' and all related items deleted successfully!` });
    } catch (error) {
        console.error("Error deleting sub-category:", error);
        res.status(500).json({ error: "Failed to delete sub-category." });
    }
});

// Delete a node
router.delete("/delete-node/:name", async (req, res) => {
    try {
        const name = req.params.name;
        if (!name) {
            return res.status(400).json({ error: "Node name is required." });
        }
        // Check if the node exists before deleting
        const checkResult = await session.run(
            "MATCH (n {name: $name}) RETURN COUNT(n) AS nodeCount",
            { name }
        );
        if (!checkResult.records.length || checkResult.records[0].get("nodeCount") === 0) {
            return res.status(404).json({ error: `Node '${name}' not found.` });
        }
        // Delete the node and its relationships
        await session.run(
            "MATCH (n {name: $name}) DETACH DELETE n",
            { name }
        );
        res.json({ message: `Node '${name}' deleted successfully!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete node." });
    }
});

// Update Quantity
router.post("/update-quantity", async (req, res) => {
    try {
        const { name, newQuantity } = req.body;
        if (!name || newQuantity < 0 || isNaN(newQuantity)) {
            return res.status(400).json({ error: "Invalid quantity value." });
        }
        await session.run(
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
        if (!name || newPrice < 0 || isNaN(newPrice)) {
            return res.status(400).json({ error: "Invalid price value." });
        }
        await session.run(
            "MATCH (n {name: $name}) SET n.price = $newPrice RETURN n",
            { name, newPrice: parseFloat(newPrice) }
        );
        res.json({ message: `Price for '${name}' updated to ${newPrice}!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update price." });
    }
});

// Create new Menu/Category
router.post("/create-category", async (req, res) => {
    try {
        const { categoryName } = req.body;
        if (!categoryName) {
            return res.status(400).json({ error: "Category name is required." });
        }
        // Formatted category label
        const formattedCategory = categoryName.replace(/\s+/g, '_') + "_Cat";
        const createCategory = await session.run(
            `MATCH (home:Menu {name: "Home"})
             CREATE (category:Menu {name: $categoryName})
             CREATE (home)-[:CONNECTED_TO]->(category)
             RETURN category`,
            {categoryName}
        );
        if (createCategory.records.length === 0) {
            return res.status(500).json({ error: "Failed to create category in Neo4j." });
        }
        res.json({ message: `Category '${categoryName}' created!` });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category." });
    }
});

// Create Sub-Category
router.post("/create-subcategory", async (req, res) => {
    try {
        const { parentCategory, subCategoryName } = req.body;
        if (!parentCategory || !subCategoryName) {
            return res.status(400).json({ error: "Both main category and sub-category are required." });
        }
        // Correct main category
        const formattedCategory = parentCategory.replace(/\s+/g, '_') + "_Cat";
        // check if exist
        const categoryCheck = await session.run(
            `MATCH (c:Menu {name: $parentCategory}) RETURN c LIMIT 1`,
            { parentCategory }
        );
        if (categoryCheck.records.length === 0) {
            console.error(`Main category '${parentCategory}' not found.`);
            return res.status(404).json({ error: `Main category '${parentCategory}' not found.` });
        }
        const cypherQuery = `
            MATCH (main:Menu {name: $parentCategory})
            OPTIONAL MATCH (cat {name: $parentCategory})
            CALL apoc.create.node([$formattedCategory], {name: $subCategoryName}) YIELD node AS sub
            MERGE (cat)-[:INCLUDES]->(sub)
            MERGE (main)-[:INCLUDES]->(sub)
            RETURN sub
        `;
        const createSubCategory = await session.run(cypherQuery, {
            parentCategory,
            subCategoryName,
            formattedCategory,
        });
        if (createSubCategory.records.length === 0) {
            console.error("Failed to create sub-category in Neo4j.");
            return res.status(500).json({ error: "Failed to create sub-category in Neo4j." });
        }
        res.json({ message: `Sub-category '${subCategoryName}' added under '${parentCategory}'!` });
    } catch (error) {
        console.error("Error creating sub-category:", error);
        res.status(500).json({ error: "Failed to create sub-category." });
    }
});

// Add a new node based on sub-category
router.post("/create-node", async (req, res) => {
    try {
        const { name, subCategory, quantity, price } = req.body;
        if (!name || !subCategory || isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
            return res.status(400).json({ error: "Invalid data provided." });
        }
        // Check if item exists
        const subCategoryCheck = await session.run(
            `MATCH (c {name: $subCategory}) RETURN c LIMIT 1`,
            { subCategory }
        );
        if (subCategoryCheck.records.length === 0) {
            return res.status(404).json({ error: `Sub-category '${subCategory}' not found.` });
        }
        // Create node with the same label as mainCategory
        const mainCategoryQuery = await session.run(
            `MATCH (main)-[:INCLUDES]->(c {name: $subCategory}) RETURN main.name AS mainCategory`,
            { subCategory }
        );
        if (mainCategoryQuery.records.length === 0) {
            return res.status(404).json({ error: `No main category found for '${subCategory}'` });
        }
        const mainCategory = mainCategoryQuery.records[0].get("mainCategory");
        const createNode = await session.run(
            `MATCH (c {name: $subCategory}) 
             CREATE (n:\`${mainCategory}\` {name: $name, quantity: $quantity, price: $price})-[:BELONGS_TO]->(c) 
             RETURN n`,
            { name, subCategory, quantity: parseInt(quantity), price: parseFloat(price) }
        );
        if (createNode.records.length === 0) {
            return res.status(500).json({ error: "Failed to create node in Neo4j." });
        }
        res.json({ message: `Item '${name}' successfully added under '${subCategory}'!` });
    } catch (error) {
        console.error("Error creating node: ", error);
        res.status(500).json({ error: "Failed to create node." });
    }
});

module.exports = router;