import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "/firebase.js";

let allItems = [];
const container = document.getElementById("items-container");
const searchInput = document.getElementById("search");
const itemCount = document.getElementById("item-count");

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
    <p class="text-sm text-gray-500">Found: ${item.dateFound.toDate().toLocaleDateString('en-US')}</p>
    <p class="text-sm text-black">Tags: ${item.tags?.join(", ")}</p>
  `;

    container.appendChild(div);
  });
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  const filtered = allItems.filter((item) => {
    
    const textMatch = (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );


    return textMatch;
  });


  itemCount.textContent = `${filtered.length} items found • Help reunite lost belongings with their
  owners!!`;
  renderItems(filtered);
});

loadItems();
