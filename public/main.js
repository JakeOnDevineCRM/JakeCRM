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

function toggleSubmenu() {
    let submenu = document.getElementById("inventory-submenu");
    submenu.style.display = submenu.style.display === "block" ? "none" : "block";
}

// Load different inventory pages
function loadPage(page) {
    fetch(`/views/${page}.html`)
      .then(response => response.text())
      .then(data => {
        document.getElementById("content-box").innerHTML = data;
      })
      .catch(error => console.error("Error loading page:", error));
}

function loadMainPage() {
    window.location.href = "/main"; 
}

document.addEventListener("DOMContentLoaded", attachCreateNodeEvent);