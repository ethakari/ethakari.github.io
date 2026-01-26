import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "/firebase.js";
import { formatForDisplay } from "./modify-text.js";


let allItems = [];
const container = document.getElementById("items-container");
const searchInput = document.getElementById("search");
const itemCount = document.getElementById("item-count");
const selectedCategories = new Set(["all"]);
const categoryButtons = document.querySelectorAll(".category-btn");
const clearBtn = document.getElementById("clear-search");
const modal = document.getElementById("item-modal");

clearBtn.addEventListener("click", () => {
  // clear search bar text
  searchInput.value = "";
  applyFilters();
});

categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.category;

    // handle "All Categories"
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

      // default: if none selected, revert to all
      if (selectedCategories.size === 0) {
        selectedCategories.add("all");
        document
          .querySelector('[data-category="all"]')
          ?.classList.add("bg-[#262626]", "text-white", "border-[#404040]");
        document
          .querySelector('[data-category="all"]')
          ?.classList.remove(
            "bg-[#1e1e1e]",
            "text-[#9EA3AE]",
            "border-transparent",
          );
      }
    }

    applyFilters();
  });
});

function activateButton(btn) {
  // helper functions for activating filter buttons
  btn.classList.add("bg-[#262626]", "text-white", "border-[#404040]");
  btn.classList.remove("bg-[#1e1e1e]", "text-[#9EA3AE]", "border-transparent");
}

function deactivateButton(btn) {
  // helper functions for deactivating filter buttons
  btn.classList.remove("bg-[#262626]", "text-white", "border-[#404040]");
  btn.classList.add("bg-[#1e1e1e]", "text-[#9EA3AE]", "border-transparent");
}

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
  owners!`;
}

function renderItems(items) {
  // generate HTML for each card
  container.innerHTML = "";

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className =
      "cursor-pointer item-tile flex flex-col bg-[#2c2c2c] rounded-xl border border-[#5B5B5B]";

    div.dataset.itemId = item.id;

    const imageSrc = item.imageUrl
      ? item.imageUrl
      : "/assets/image-unavailable.png";

    div.innerHTML = `
    <img
      src="${imageSrc}"
      alt="Item Image"
      class="w-full h-[250px] object-cover rounded-t-xl"
    />
    <div class="p-3 border-t border-[#5B5B5B]"> 
    <p class="text-lg font-[500] text-white">${formatForDisplay(item.name)}</p>
    <p class="text-sm text-[#D2D5DB]">Found: ${item.dateFound.toDate().toLocaleDateString("en-US")}</p>
    <p class="text-sm text-[#D2D5DB]">Location Found: ${formatForDisplay(item.location)}</p>
    </div>
  `;

    container.appendChild(div);
  });
}

searchInput.addEventListener("input", applyFilters);
function applyFilters() {
  const query = searchInput.value.toLowerCase();

  const filtered = allItems.filter((item) => {
    // text filter
    const textMatch =
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);

    // tag filter
    const categoryMatch =
      selectedCategories.has("all") ||
      item.tags?.some((tag) => selectedCategories.has(tag));

    return textMatch && categoryMatch; // return intersection
  });

  // update item counter with length
  itemCount.textContent = `${filtered.length} items found • Help reunite lost belongings with their owners!!`;
  renderItems(filtered); // render
}
loadItems();

container.addEventListener("click", (e) => {
  const tile = e.target.closest(".item-tile");
  if (!tile) return;

  const itemId = tile.dataset.itemId;
  openModal(itemId);
});

function openModal(itemId) {
  const item = allItems.find((i) => i.id === itemId);
  if (!item) return;

  // populate modal
  document.getElementById("item-title").textContent = formatForDisplay(item.name);
  document.getElementById("item-image").src =
    item.imageUrl || "/assets/image-unavailable.png";
  document.getElementById("item-description").textContent =
    formatForDisplay(item.description) || "No description provided";
  document.getElementById("item-location").textContent = formatForDisplay(item.location);
  document.getElementById("item-date").textContent = item.dateFound
    .toDate()
    .toLocaleDateString("en-US");

  modal.classList.remove("hidden");
}

document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
});
