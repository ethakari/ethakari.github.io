import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "/firebase.js";
import { formatForDisplay } from "./modify-text.js";
import { auth, signInWithEmailAndPassword } from "/firebase.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentView = "items";
let allItems = [];
let itemMap = {};
let allClaims = [];
let pendingItemCount = 0;
let pendingClaimCount = 0;
let foundItemsCount = 0;
const container = document.getElementById("admin-items");
const logoutBtn = document.getElementById("logout");
const pendingItemElement = document.getElementById("pending-items");
const pendingClaimElement = document.getElementById("pending-claims");
const totalItemCountElement = document.getElementById("total-items");
const itemsTab = document.getElementById("items-tab");
const claimsTab = document.getElementById("claims-tab");
const adminLogin = document.getElementById("admin-login");
const path = window.location.pathname;

onAuthStateChanged(auth, (user) => {
  const isLoginPage = path.includes("login");
  const isAdminPage = path.includes("admin");
  if (user) {
    console.log("Logged in as:", user.email);
  } else {
    console.log("Not logged in");
  }

  if (!user && isAdminPage) {
    window.location.replace("/login.html");
  }

  if (user && isLoginPage) {
    window.location.replace("/admin.html");
  }
});

adminLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/admin.html";
  } catch {
    console(err);
    alert("Invalid admin credentials.");
  }
});

logoutBtn?.addEventListener("click", () => {
  signOut(auth);
  window.location.href = "/login.html";
});

async function loadItems() {
  const itemsRef = collection(db, "itemId");
  const snapshot = await getDocs(itemsRef);

  allItems = [];
  itemMap = {};

  snapshot.forEach((doc) => {
    const item = {
      id: doc.id,
      ...doc.data(),
    };

    allItems.push(item);
    itemMap[item.id] = item;
  });

  renderItems(allItems);
}

async function loadClaims() {
  const claimsRef = collection(db, "claimId");
  const snapshot = await getDocs(claimsRef);

  allClaims = [];

  snapshot.forEach((doc) => {
    allClaims.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  renderClaims(allClaims);
}

function renderClaims(claims) {
  // generate HTML for each card
  container.innerHTML = "";
  pendingClaimCount = 0;

  claims.forEach((claim) => {
    const div = document.createElement("div");
    div.className =
      "flex flex-row h-40 bg-[#1e1e1e] rounded-xl border border-[#333333]";

    div.dataset.claimId = claim.id;

    // const imageSrc = item.imageUrl
    //   ? item.imageUrl
    //   : "/assets/image-unavailable.png";

    div.innerHTML = `
    <div class="flex flex-col w-[160px] justify-center align-center items-center">
        <img
            src="${itemMap[claim.itemId]?.imageUrl ? itemMap[claim.itemId].imageUrl : '/assets/image-unavailable.png'}"
            alt="Item Image"
            class="w-[128px] h-[128px] rounded-xl border border-[#333333]"
        />
    </div>
    <div class="flex flex-col pt-4 pb-4 gap-2 w-[calc(100%-160px)]"> 
        <div class="text-lg font-[500] text-white">${formatForDisplay(claim.itemName)}</div>
        <div class="text-sm text-[#9CA3AF]">Claimer: ${formatForDisplay(claim.claimer)}</div>
        <div class="text-sm text-[#9CA3AF]">Email: ${claim.email}</div>
        <div class="text-sm text-[#9CA3AF]">Submitted On: ${claim.submittedOn.toDate().toLocaleDateString("en-US")}</div>
        <div class="flex flex-row">
            <div class="flex w-[33%] text-[12px] text-[#9CA3AF]">Phone: ${claim.phone}</div>
            <div class="flex w-[33%] text-[12px] text-[#9CA3AF]">Proof: ${formatForDisplay(claim.proof)}</div>
            <div class="flex w-[33%] text-[12px] text-[#9CA3AF]">Item ID: ${claim.itemId}</div>
        </div>
        <div class="flex flex-row">${claim.status}</div>
    </div>
  `;

    if (claim.status === "pending") {
      pendingClaimCount++;
    }
    container.appendChild(div);
  });
  pendingClaimElement.textContent = pendingClaimCount;
}

function renderItems(items) {
  // generate HTML for each card
  container.innerHTML = "";
  pendingItemCount = 0;

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
        <div class="text-lg font-[500] text-white">${formatForDisplay(item.name)}</div>
        <div class="text-sm text-[#9CA3AF]">${formatForDisplay(item.description)}</div>
        <div class="flex flex-row">
            <div class="flex w-[50%] text-[12px] text-[#9CA3AF]">Location: ${formatForDisplay(item.location)}</div>
            <div class="flex w-[50%] text-[12px] text-[#9CA3AF]">Date Found: ${item.dateFound.toDate().toLocaleDateString("en-US")}</div>
        </div>
    </div>
  `;

    if (item.status === "pending") {
      pendingItemCount++;
    }
    container.appendChild(div);
  });
  foundItemsCount = items.length;
  itemsTab.textContent = "Found Items (" + foundItemsCount + ")";
  pendingItemElement.textContent = pendingItemCount;
}

itemsTab.addEventListener("click", () => {
  if (currentView === "items") return;
  currentView = "items";
  activateTab(itemsTab, claimsTab);
  loadItems();
});

claimsTab.addEventListener("click", () => {
  if (currentView === "claims") return;
  currentView = "claims";
  activateTab(claimsTab, itemsTab);
  loadClaims();
});

function activateTab(active, inactive) {
  active.classList.add(
    "bg-[#262626]",
    "border",
    "border-[#404040]",
    "text-white",
  );
  active.classList.remove("text-[#9EA3AE]");

  inactive.classList.remove(
    "bg-[#262626]",
    "border",
    "border-[#404040]",
    "text-white",
  );
  inactive.classList.add("text-[#9EA3AE]");
}

loadClaims();
loadItems();
