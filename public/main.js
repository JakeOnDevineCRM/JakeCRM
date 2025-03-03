// Load Page function
function loadPage(page) {
    const contentBox = document.getElementById("content-box");
    if (!contentBox) return;

    const pages = {
        home: `<h1>Home Page</h1><p>Welcome to the home page.</p>`,
        inventory: `<h1>Inventory</h1><p>In this tab will be the adding/removing from inventory and inventory list.</p>`,
        trends: `<h1>Trends</h1><p>Here we can see all the trends.</p>`,
        logout: `<h1>Welcome to the Secret Page</h1><p>This is a restricted area. Only authorized users can access it.</p><a href="/login" class="logout">Logout</a>`
    };

    contentBox.innerHTML = pages[page] || `<h1>Page Not Found</h1><p>The requested page does not exist.</p>`;
};

// GET Nodes
async function fetchNodes(label = "All") {
    try {
        const response = await fetch(`/nodes?label=${label}`);
        if (!response.ok) throw new Error("Failed to fetch nodes.");

        const nodes = await response.json();
        displayNodes(nodes);
    } catch {
        alert("Failed to fetch nodes.");
    }
}

function displayNodes(nodes) {
    const nodeContainer = document.getElementById("nodeContainer");
    if (!nodeContainer) return;

    nodeContainer.innerHTML = `<table>
                                   <thead>
                                       <tr>
                                           <th>Name</th>
                                           <th>Quantity</th>
                                           <th>Price</th>
                                           <th>Actions</th>
                                       </tr>
                                   </thead>
                                   <tbody id="nodeTableBody"></tbody>
                               </table>`;

    const nodeTableBody = document.getElementById("nodeTableBody");

    nodes.forEach(node => {
        const name = node.properties.name || "Unnamed Node";
        const quantity = node.properties.quantity || 0;
        const price = node.properties.price || "N/A";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td><input type="number" class="quantity-input" value="${quantity}" min="0" 
                       onchange="confirmQuantityUpdate('${name}', this.value)"></td>
            <td><input type="number" class="price-input" value="${price}" min="0" 
                       onchange="confirmPriceUpdate('${name}', this.value)"></td>
            <td>
                <button class="table-btn delete-btn" onclick="confirmDelete('${name}')">🗑️</button>
            </td>
        `;

        nodeTableBody.appendChild(row);
    });
}

// Delete Node
function confirmDelete(name) {
    const confirmation = confirm(
        `Confirm Delete:\n\n` +
        `Item: ${name}\n`
    );
    if (confirmation) {
        deleteNode(name);
    }
}

async function deleteNode(name) {
    try {
        const response = await fetch(`/delete-node/${name}`, {
            method: "DELETE"
        });
        const data = await response.json();
        alert(data.message);
        fetchNodes(document.getElementById("categorySelect").value);
    } catch {
        alert("Failed to delete node.");
    }
}

function attachCategoryChangeEvent() {
    const dropdown = document.getElementById("categorySelect");
    if (dropdown) {
        dropdown.addEventListener("change", () => {
            fetchNodes(dropdown.value);
        });
    }
}

// Edit Quantity
function confirmQuantityUpdate(name, newQuantity) {
    const confirmation = confirm(
        `Confirm Quantity Update:\n\n` +
        `Item: ${name}\n` +
        `New Quantity: ${newQuantity}`
    );
    if (confirmation) {
        updateQuantity(name, newQuantity);
    } else {
        fetchNodes(document.getElementById("categorySelect").value);
    }
}

async function updateQuantity(name, newQuantity) {
    try {
        const response = await fetch(`/update-quantity`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, newQuantity })
        });
        const data = await response.json();
        alert(data.message);
        fetchNodes(document.getElementById("categorySelect").value);
    } catch {
        alert("Failed to update quantity.");
    }
}

// Edit Price
function confirmPriceUpdate(name, newPrice) {
    const confirmation = confirm(
        `Confirm Price Update:\n\n` +
        `Item: ${name}\n` +
        `New Price: ${newPrice}`
    );
    if (confirmation) {
        updatePrice(name, newPrice);
    } else {
        fetchNodes(document.getElementById("categorySelect").value);
    }
}

async function updatePrice(name, newPrice) {
    try {
        const response = await fetch(`/update-price`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, newPrice })
        });
        const data = await response.json();
        alert(data.message);
        fetchNodes(document.getElementById("categorySelect").value);
    } catch {
        alert("Failed to update price.");
    }
}

// Add new Node based on category
async function addNode() {
    const name = document.getElementById("nodeName").value;
    const quantity = document.getElementById("nodeQuantity").value;
    const price = document.getElementById("nodePrice").value;
    const category = document.getElementById("categorySelect").value;
    if (!name || !quantity || !price) {
        alert("Please fill all fields.");
        return;
    }
    try {
        const response = await fetch("/create-node", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, category, quantity, price })
        });
        const data = await response.json();
        alert(data.message);
        fetchNodes(category);
    } catch {
        alert("Failed to create node.");
    }
}

// Event listeners when page is loaded
document.addEventListener("DOMContentLoaded", () => {
    attachCategoryChangeEvent();
    const submitNodeBtn = document.getElementById("submitNode");
    if (submitNodeBtn) {
        submitNodeBtn.addEventListener("click", addNode);
    }
});