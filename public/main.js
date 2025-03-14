let selectedSubCategory = null;
let selectedCategory = null;

// Load Page function
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

// Fetch nodes based on selected sub-category
async function fetchNodes(subCategory) {
    try {
        const response = await fetch(`/nodes?subCategory=${encodeURIComponent(subCategory)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch nodes.`);
        }
        const nodes = await response.json();
        const nodeContainer = document.getElementById("nodeContainer");
        if (nodes.length === 0) {
            nodeContainer.innerHTML = `<p>No Items Available</p>`;
            return;
        }
        displayNodes(nodes, subCategory);
    } catch (error) {
        console.error("Error fetching nodes:", error);
        document.getElementById("nodeContainer").innerHTML = `<p>Failed to load items.</p>`;
    }
}

// Fetch main categories dynamically and display them as buttons
async function fetchMainCategories() {
    try {
        const response = await fetch("/main-categories");
        if (!response.ok) throw new Error("Failed to fetch categories.");
        const categories = await response.json();
        const categoryContainer = document.getElementById("mainCategoryContainer");
        selectedCategory = null;

        categoryContainer.innerHTML = "";

        if (!categories.length) {
            categoryContainer.innerHTML = "<p>No Categories Available</p>";
            return;
        }

        categories.forEach(category => {
            const categoryWrapper = document.createElement("div");
            categoryWrapper.classList.add("category-item");
            const categoryButton = document.createElement("button"); // Category button
            categoryButton.textContent = category;
            categoryButton.classList.add("category-btn");
            categoryButton.addEventListener("click", () => {
                if (selectedCategory) {
                    selectedCategory.classList.remove("active-category");
                }
                selectedCategory = categoryButton;
                categoryButton.classList.add("active-category");
                fetchSubCategories(category);
            });
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "nah"; 
            deleteButton.classList.add("delete-btn");
            deleteButton.addEventListener("click", (event) => {
                event.stopPropagation();
                confirmDeleteCategory(category);
            });
            categoryWrapper.appendChild(categoryButton);
            categoryWrapper.appendChild(deleteButton);
            categoryContainer.appendChild(categoryWrapper);
        });
    } catch (error) {
        document.getElementById("mainCategoryContainer").innerHTML = "<p>Error Loading Categories</p>";
    }
}

// Fetch subcategories dynamically
async function fetchSubCategories(mainCategory) {
    try {
        const response = await fetch(`/sub-categories?mainCategory=${encodeURIComponent(mainCategory)}`);
        if (!response.ok) throw new Error("Failed to fetch sub-categories.");
        const subCategories = await response.json();
        const subCategoryContainer = document.getElementById("subCategoryContainer");
        const nodeContainer = document.getElementById("nodeContainer");
        selectedSubCategory = null;
        // Refresh lists
        nodeContainer.innerHTML = "<p>No items available.</p>";
        subCategoryContainer.innerHTML = "";
        if (!Object.keys(subCategories[mainCategory]).length) {
            subCategoryContainer.innerHTML = "<p>No Sub-Categories Available</p>";
            return;
        }
        Object.keys(subCategories[mainCategory]).forEach(subCat => {
            const subCategoryWrapper = document.createElement("div");
            subCategoryWrapper.classList.add("sub-category-item");
            const subCategoryButton = document.createElement("button"); // Sub-Category button
            subCategoryButton.textContent = subCat;
            subCategoryButton.classList.add("sub-category-btn");
            subCategoryButton.addEventListener("click", () => {
                if (selectedSubCategory) {
                    selectedSubCategory.classList.remove("active-subcategory");
                }
                selectedSubCategory = subCategoryButton;
                subCategoryButton.classList.add("active-subcategory");
                fetchNodes(subCat); // Refresh list
            });
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "meh";
            deleteButton.classList.add("delete-btn");
            deleteButton.addEventListener("click", (event) => {
                event.stopPropagation();
                confirmDeleteSubCategory(mainCategory, subCat);
            });
            subCategoryWrapper.appendChild(subCategoryButton);
            subCategoryWrapper.appendChild(deleteButton);
            subCategoryContainer.appendChild(subCategoryWrapper);
        });
    } catch (error) {
        document.getElementById("subCategoryContainer").innerHTML = "<p>Error Loading Sub-Categories</p>";
    }
}

// Display nodes dynamically
function displayNodes(nodes, subCategory) {
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
        const quantity = node.properties.quantity !== undefined ? parseInt(node.properties.quantity) : 0;
        const price = node.properties.price !== undefined ? parseFloat(node.properties.price) : 0;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td><input type="number" class="quantity-input" value="${isNaN(quantity) ? 0 : quantity}" min="0" 
                       onchange="confirmQuantityUpdate('${name}', this.value)"></td>
            <td><input type="number" class="price-input" value="${isNaN(price) ? 0 : price}" min="0" 
                       onchange="confirmPriceUpdate('${name}', this.value)"></td>
            <td>
                <button class="table-btn delete-btn" data-name="${name}" onclick="confirmDelete('${name}')">🗑️</button>
            </td>
        `;
        nodeTableBody.appendChild(row);
    });
}

// Confirm delete category
function confirmDeleteCategory(category) {
    const confirmation = confirm(`Confirm Delete:\n\n` + 
        `Menu: ${category.replace("_Cat", "")}\n\n` +
         `Are you sure you want to delete ${category.replace("_Cat", "")} with all its contents?`);
    if (confirmation) {
        deleteCategory(category);
    }
}

// Delete Category
async function deleteCategory(category) {
    try {
        const response = await fetch(`/delete-category/${encodeURIComponent(category)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to delete category.");
        alert(data.message);
        //Refresh Lists
        fetchMainCategories();
        document.getElementById("subCategoryContainer").innerHTML = "<p>No sub-categories available.</p>";
        document.getElementById("nodeContainer").innerHTML = "<p>No items available.</p>";
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Confirm Delete Item
function confirmDelete(name) {
    const confirmation = confirm(
        `Confirm Delete:\n\n` +
        `Item: ${name}\n`
    );
    if (confirmation) {
        deleteNode(name);
    }
}
//Deleete Item
async function deleteNode(name) {
    try {
        const response = await fetch(`/delete-node/${encodeURIComponent(name)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Error: ${data.error || "Unknown error occurred."}`);
        }
        alert(data.message);
        const rowToDelete = document.querySelector(`[data-name="${name}"]`).closest("tr");
        if (rowToDelete) {
            rowToDelete.remove();
        }
        // Refresh Sub List
        if (selectedSubCategory) {
            fetchNodes(selectedSubCategory.textContent.trim());
        } else {
            console.warn("No selected sub-category. Unable to refresh node list.");
        }
    } catch (error) {
        alert(`Failed to delete node: ${error.message}`);
    }
}

// Confirm & Update Quantity
function confirmQuantityUpdate(name, newQuantity) {
    if (!name || newQuantity < 0 || isNaN(newQuantity)) {
        alert("Invalid quantity value.");
        return;
    }
    const confirmation = confirm(
        `Confirm Update:\n\n` +
        `Item: ${name}\n` +
        `Quantity: ${newQuantity}`
    );
    if (confirmation) {
        updateQuantity(name, newQuantity);
    }
}

async function updateQuantity(name, newQuantity) {
    try {
        const response = await fetch(`/update-quantity`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, newQuantity: parseInt(newQuantity) })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to update quantity.");

        alert(data.message);
        fetchNodes(document.getElementById("subCategorySelect").value);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Confirm & Update Price
function confirmPriceUpdate(name, newPrice) {
    if (!name || newPrice < 0 || isNaN(newPrice)) {
        alert("Invalid price value.");
        return;
    }

    const confirmation = confirm(
        `Confirm Update:\n\n` +
        `Item: ${name}\n` +
        `Price: ${newPrice}`
    );
    if (confirmation) {
        updatePrice(name, newPrice);
    }
}

// Update Price
async function updatePrice(name, newPrice) {
    try {
        const response = await fetch(`/update-price`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, newPrice: parseFloat(newPrice) })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to update price.");

        alert(data.message);
        fetchNodes(document.getElementById("subCategorySelect").value);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Confirmation adding category
function confirmAddCategory() {
    const categoryName = document.getElementById("parentCategory").value.trim();
    if (!categoryName) {
        alert("Please enter a category name.");
        return;
    }
    const confirmation = confirm(`Confirm Add:\n\nMenu: ${categoryName}`);
    if (confirmation) {
        addCategory(categoryName);
    }
}
// Adding category
async function addCategory(categoryName) {
    try {
        const response = await fetch("/create-category", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryName })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to create category.");

        alert(data.message);
        // Refreshh lists
        fetchMainCategories();
        document.getElementById("subCategoryContainer").innerHTML = "<p>No Sub-Categories Available</p>";
        document.getElementById("nodeContainer").innerHTML = "<p>No Items Available</p>";
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Confirm and Add Sub-Category
function confirmAddSubCategory() {
    const parentCategory = selectedCategory ? selectedCategory.textContent.trim() : null;
    const subCategoryName = document.getElementById("subCategoryName").value.trim();
    if (!parentCategory) {
        alert("Please select a main category first.");
        return;
    }
    if (!subCategoryName) {
        alert("Please enter a sub-category name.");
        return;
    }
    const confirmation = confirm(
        `Confirm Add:\n\n` +
        `Sub-Category: ${subCategoryName}\n` +
        `Under Menu: ${parentCategory}`
    );
    if (confirmation) {
        addSubCategory(parentCategory, subCategoryName);
    }
}

// Send Sub-Category to Backend
async function addSubCategory(parentCategory, subCategoryName) {
    try {
        const response = await fetch("/create-subcategory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parentCategory, subCategoryName })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to create sub-category.");
        alert(data.message);
        fetchSubCategories(parentCategory); // Refresh sub-category
    } catch (error) {
        alert(`Failed to create sub-category: ${error.message}`);
    }
}

// Confirm delete sub-category
function confirmDeleteSubCategory(mainCategory, subCategory) {
    const confirmation = confirm(`Confirm Delete:\n\n` + 
        `Sub-Category: ${subCategory} under ${mainCategory}\n\n` +
        `Are you sure you want to delete ${subCategory} with all its contents under it?`);
    if (confirmation) {
        deleteSubCategory(mainCategory, subCategory);
    }
}

// Delete Sub-Category
async function deleteSubCategory(mainCategory, subCategory) {
    try {
        const response = await fetch(`/delete-subcategory/${encodeURIComponent(mainCategory)}/${encodeURIComponent(subCategory)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to delete sub-category.");
        alert(data.message);
        // Refresh Subcategories
        fetchSubCategories(mainCategory);
        document.getElementById("nodeContainer").innerHTML = "<p>No items available.</p>";
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Confirm & Add New Node
function confirmAdd() {
    const name = document.getElementById("nodeName").value.trim();
    const quantity = document.getElementById("nodeQuantity").value.trim();
    const price = document.getElementById("nodePrice").value.trim();
    if (!selectedSubCategory) {
        alert("Please select a sub-category before adding an item.");
        return;
    }
    const subCategory = selectedSubCategory.textContent.trim();
    if (!name || !subCategory || quantity === "" || price === "") {
        alert("All fields are required.");
        return;
    }
    if (isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
        alert("Quantity and price must be valid non-negative numbers.");
        return;
    }
    const confirmation = confirm(
        `Confirm Add:\n\n` +
        `Item: ${name}\n` +
        `Quantity: ${quantity}\n` +
        `Price: ${price}\n` + 
        `Sub-Category: ${subCategory}\n`
    );
    if (confirmation) {
        addNode(name, subCategory, quantity, price);
    }
}

// Add new Node based on category
async function addNode(name, subCategory, quantity, price) {
    try {
        const response = await fetch("/create-node", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, subCategory, quantity, price })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to add item.");
        alert(data.message);
        fetchNodes(subCategory);
    } catch (error) {
        console.error("Failed to add item:", error);
        alert(`Failed to add item: ${error.message}`);
    }
}

// Event listeners when page is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Fetch main categories on page load
    fetchMainCategories();
    // Event Listener for Adding Category
    const addCategoryBtn = document.getElementById("addCategoryBtn");
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener("click", confirmAddCategory);
    }
    // Event Listener for Adding Sub-Category
    const addSubCategoryBtn = document.getElementById("addSubCategoryBtn");
    if (addSubCategoryBtn) {
        addSubCategoryBtn.addEventListener("click", confirmAddSubCategory);
    }
    // Event Listener for Adding Item
    const addItemBtn = document.getElementById("addItemBtn");
    if (addItemBtn) {
        addItemBtn.addEventListener("click", confirmAdd);
    }
    // Event Listener for Submitting New Item
    const submitNodeBtn = document.getElementById("submitNode");
    if (submitNodeBtn) {
        submitNodeBtn.addEventListener("click", () => {
            const name = document.getElementById("nodeName").value.trim();
            const quantity = document.getElementById("nodeQuantity").value.trim();
            const price = document.getElementById("nodePrice").value.trim();
            const subCategory = document.getElementById("subCategorySelect").value;
            if (!subCategory) {
                alert("Please select a sub-category before adding an item.");
                return;
            }
            if (!name || quantity === "" || price === "") {
                alert("Please fill all fields.");
                return;
            }
            if (isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
                alert("Quantity and price must be valid non-negative numbers.");
                return;
            }
            const confirmation = confirm(
                `Confirm Add:\n\nItem: ${name}\nQuantity: ${quantity}\nPrice: ${price}\nSub-Category: ${subCategory}`
            );
            if (confirmation) {
                addNode(name, subCategory, quantity, price);
            }
        });
    }
    // Fetch Subcategories when Main Category is selected
    const mainCategorySelect = document.getElementById("mainCategorySelect");
    if (mainCategorySelect) {
        mainCategorySelect.addEventListener("change", (event) => {
            fetchSubCategories(event.target.value);
        });
    }
    // Fetch Nodes when Sub-Category is selected
    const subCategorySelect = document.getElementById("subCategorySelect");
    if (subCategorySelect) {
        subCategorySelect.addEventListener("change", (event) => {
            fetchNodes(event.target.value);
        });
    }
});
