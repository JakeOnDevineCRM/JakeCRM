// Function to attach event listener to "Create Node" button
function attachCreateNodeEvent() {
    const button = document.getElementById("createNode");
    if (button) {
        button.addEventListener("click", createNode);
    }
}

// Function to create a node in Neo4j
function createNode() {
    fetch("/create-node", { method: "POST" })
    .then(response => {
        return response.json();
    })
    .then(data => {
        alert(data.message);
    })
    .catch(error => {
        alert("Failed to create node.");
    });
}

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

document.addEventListener("DOMContentLoaded", attachCreateNodeEvent);