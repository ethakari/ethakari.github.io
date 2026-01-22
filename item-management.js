import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "/firebase.js";

let allItems = [];
const container = document.getElementById("items-container");
const searchInput = document.getElementById("search");
const itemCount = document.getElementById("item-count");
const selectedCategories = new Set(["all"]);
const categoryButtons = document.querySelectorAll(".category-btn");

function activateButton(btn) {
  btn.classList.add("bg-[#262626]", "text-white", "border-[#404040]");
  btn.classList.remove("bg-[#1e1e1e]", "text-[#9EA3AE]", "border-transparent");
}

function deactivateButton(btn) {
  btn.classList.remove("bg-[#262626]", "text-white", "border-[#404040]");
  btn.classList.add("bg-[#1e1e1e]", "text-[#9EA3AE]", "border-transparent");
}

categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.category;

    // Handle "All Categories"
    if (category === "all") {
      selectedCategories.clear();
      selectedCategories.add("all");

      categoryButtons.forEach((b) => deactivateButton(b));
      activateButton(btn);
    } else {
      // Remove "all" if selecting specific categories
      selectedCategories.delete("all");
      document
        .querySelector('[data-category="all"]')
        ?.classList.remove("bg-[#262626]", "text-white", "border-[#404040]");
      document
        .querySelector('[data-category="all"]')
        ?.classList.add("bg-[#1e1e1e]", "text-[#9EA3AE]", "border-transparent");

      if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
        deactivateButton(btn);
      } else {
        selectedCategories.add(category);
        activateButton(btn);
      }

      // Fallback: if none selected, revert to all
      if (selectedCategories.size === 0) {
        selectedCategories.add("all");
        document
          .querySelector('[data-category="all"]')
          ?.classList.add("bg-[#262626]", "text-white", "border-[#404040]");
        document
          .querySelector('[data-category="all"]')
          ?.classList.remove("bg-[#1e1e1e]", "text-[#9EA3AE]", "border-transparent");
      }
    }

    applyFilters();
  });
});

async function loadItems() {
  const itemsRef = collection(db, "itemId");
  const snapshot = await getDocs(itemsRef);

  allItems = [];

  snapshot.forEach((doc) => {
    allItems.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  renderItems(allItems);
  itemCount.textContent = `${allItems.length} items found • Help reunite lost belongings with their
  owners!!`;
}

function renderItems(items) {
  container.innerHTML = "";

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded shadow";

    div.innerHTML = `
    <p class="text-lg font-bold text-black">${item.name}</p>
    <p class="text-gray-600">${item.description}</p>
    <p class="text-sm text-gray-500">Found: ${item.dateFound.toDate().toLocaleDateString("en-US")}</p>
    <p class="text-sm text-black">Tags: ${item.tags?.join(", ")}</p>
  `;

    container.appendChild(div);
  });
}

searchInput.addEventListener("input", applyFilters);
function applyFilters() {
  const query = searchInput.value.toLowerCase();

  const filtered = allItems.filter((item) => {
    // TEXT FILTER
    const textMatch =
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);

    // CATEGORY FILTER
    const categoryMatch =
      selectedCategories.has("all") ||
      item.tags?.some((tag) => selectedCategories.has(tag));

    return textMatch && categoryMatch;
  });

  itemCount.textContent = `${filtered.length} items found • Help reunite lost belongings with their owners!!`;
  renderItems(filtered);
}

loadItems();
