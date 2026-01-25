import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "/firebase.js";

let allItems = [];
const container = document.getElementById("admin-items");

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
}

function renderItems(items) {
  // generate HTML for each card
  container.innerHTML = "";

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className =
      "flex flex-row h-40 bg-[#1e1e1e] rounded-xl border border-[#333333]";

    div.dataset.itemId = item.id;

    const imageSrc = item.imageUrl
      ? item.imageUrl
      : "/assets/image-unavailable.png";

    div.innerHTML = `
    <div class="flex flex-col w-[160px] justify-center align-center items-center">
        <img
            src="${imageSrc}"
            alt="Item Image"
            class="w-[128px] h-[128px] rounded-xl border border-[#333333]"
        />
    </div>
    <div class="flex flex-col pt-4 pb-4 gap-2 w-[calc(100%-160px)]"> 
        <div class="text-lg font-[500] text-white">${item.name}</div>
        <div class="text-sm text-[#9CA3AF]">${item.description}</div>
        <div class="flex flex-row">
            <div class="flex w-[33%] text-[12px] text-[#9CA3AF]">Category</div>
            <div class="flex w-[33%] text-[12px] text-[#9CA3AF]">Location: ${item.location}</div>
            <div class="flex w-[33%] text-[12px] text-[#9CA3AF]">Date Found: ${item.dateFound.toDate().toLocaleDateString("en-US")}</div>
        </div>
    </div>
  `;

    container.appendChild(div);
  });
}

loadItems();
