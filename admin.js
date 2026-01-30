import {
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
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
let itemListView = [];
let itemMap = {};
let allClaims = [];
let pendingClaims = [];
let historyClaims = [];
let pendingItemCount = 0;
let listedItemCount = 0;
let pendingClaimCount = 0;
let foundItemsCount = 0;
const container = document.getElementById("admin-items");
const logoutBtn = document.getElementById("logout");
const pendingItemElement = document.getElementById("pending-items");
const listedItemElement = document.getElementById("listed-items");
const pendingClaimElement = document.getElementById("pending-claims");
const itemsTab = document.getElementById("items-tab");
const claimsTab = document.getElementById("claims-tab");
const historyTab = document.getElementById("history-tab");
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

async function updateItemStatus(itemId, newStatus) {
  await updateDoc(doc(db, "itemId", itemId), {
    status: newStatus,
  });
  loadItems();
}

async function deleteItem(itemId) {
  await deleteDoc(doc(db, "itemId", itemId));
  loadItems();
}

async function updateClaimStatus(claimId, newStatus) {
  await updateDoc(doc(db, "claimId", claimId), {
    status: newStatus,
  });
  loadClaims("pending");
}

async function deleteClaim(claimId) {
  await deleteDoc(doc(db, "claimId", claimId));
  loadClaims("pending");
}

async function approveClaim(claim) {
  // 1. Approve the claim
  await updateDoc(doc(db, "claimId", claim.id), {
    status: "approved",
  });

  // 2. Mark the item as claimed
  await updateDoc(doc(db, "itemId", claim.itemId), {
    status: "claimed",
  });

  // 3. Reject all other pending claims for the same item
  const claimsRef = collection(db, "claimId");
  const snapshot = await getDocs(claimsRef);

  const updates = [];
  snapshot.forEach((docSnap) => {
    const c = docSnap.data();
    if (
      c.itemId === claim.itemId &&
      c.status === "pending" &&
      docSnap.id !== claim.id
    ) {
      updates.push(
        updateDoc(doc(db, "claimId", docSnap.id), {
          status: "rejected",
        }),
      );
    }
  });

  await Promise.all(updates);

  // 4. Refresh UI
  await loadItems();
  await loadClaims("pending");
}

async function loadItems() {
  const itemsRef = collection(db, "itemId");
  const q = query(itemsRef, orderBy("dateFound", "desc"));
  const snapshot = await getDocs(q);

  allItems = [];
  itemListView = [];
  itemMap = {};

  snapshot.forEach((doc) => {
    const item = {
      id: doc.id,
      ...doc.data(),
    };

    allItems.push(item);

    if(item.status !== "claimed") {
      itemListView.push(item);
    }
    itemMap[item.id] = item;
  });

  renderItems(itemListView);
}

async function loadClaims(status) {
  const claimsRef = collection(db, "claimId");
  const snapshot = await getDocs(claimsRef);

  allClaims = [];
  pendingClaims = [];
  historyClaims = [];

  snapshot.forEach((doc) => {
    const claim = {
      id: doc.id,
      ...doc.data(),
    };

    allClaims.push(claim);

    if (claim.status === "pending") {
      pendingClaims.push(claim);
    } else {
      // approved OR rejected
      historyClaims.push(claim);
    }
  });

  if (status === "pending") {
    renderClaims(pendingClaims);
  } else {
    renderHistory(historyClaims);
  }
}

function renderItems(items) {
  // generate HTML for each card
  container.innerHTML = "";
  pendingItemCount = 0;
  listedItemCount = 0;

  const sortedItems = [...items].sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === "pending") return -1;
    if (b.status === "pending") return 1;
    return 0;
  });

  sortedItems.forEach((item) => {
    const div = document.createElement("div");
    div.className =
      "flex md:flex-row flex-col h-fit bg-[#1e1e1e] rounded-xl border border-[#333333] align-center";

    div.dataset.itemId = item.id;

    const imageSrc = item.imageUrl
      ? item.imageUrl
      : "/assets/image-unavailable.png";

    div.innerHTML = `
    <div class="flex flex-col md:w-[160px] w-[250px] justify-center align-center items-center md:p-0 px-4 pt-4">
        <img
            src="${imageSrc}"
            alt="Item Image"
            class="md:w-[128px] md:h-[128px] w-50 h-50 rounded-xl border border-[#333333]"
        />
    </div>
    <div class="flex flex-col md:pt-4 md:pb-4 p-4 gap-2 md:w-[calc(100%-240px)] w-full"> 
        <div class="text-lg font-[500] text-white">${formatForDisplay(item.name)}</div>
        <div class="text-sm text-[#9CA3AF] md:mb-0 mb-6">${formatForDisplay(item.description)}</div>
        <div class="flex md:flex-row flex-col md:gap-4 gap-2">
            <div class="flex w-[66%] text-[12px] text-[#9CA3AF]">Tags: ${item.tags.join(", ")}</div>
            <div class="flex w-[66%] text-[12px] text-[#9CA3AF]">Location: ${formatForDisplay(item.location)}</div>
            <div class="flex w-[33%] text-[12px] text-[#9CA3AF]">Date Found: ${item.dateFound.toDate().toLocaleDateString("en-US")}</div>
        </div>
        <div class="flex flex-row gap-4 mt-2" data-actions></div>
    </div>
    <div class="text-[12px] text-[#9CA3AF] p-4">
      <div class="flex p-1 w-[60px] justify-center rounded-lg" data-status>${item.status}</div>
    </div>
  `;
    const statusBadge = div.querySelector("[data-status]");
    const actionsContainer = div.querySelector("[data-actions]");

    if (item.status === "pending") {
      pendingItemCount++;

      statusBadge.classList.add("bg-[#35291E]", "text-[#FBBF24]");

      actionsContainer.innerHTML = `
        <button class="py-1 w-[140px] text-sm rounded-lg bg-[#16A34A]">Approve Listing</button>
        <button class="py-1 w-[140px] text-sm rounded-lg bg-[#DC2626]">Reject Listing</button>
      `;

      actionsContainer.children[0].onclick = () =>
        updateItemStatus(item.id, "listed");

      actionsContainer.children[1].onclick = () => deleteItem(item.id);
    }

    if (item.status === "listed") {
      listedItemCount++;
      statusBadge.classList.add("bg-[#212E1A]", "text-[#78DB89]");

      actionsContainer.innerHTML = `
        <button class="py-1 w-[140px] text-sm rounded-lg bg-[#DC2626]">Remove Listing</button>
      `;

      actionsContainer.children[0].onclick = () =>
        updateItemStatus(item.id, "pending");
    }

    if (item.status === "claimed") {
      actionsContainer.innerHTML = `
        <button class="py-1 w-[140px] text-sm rounded-lg bg-[#16A34A]">Restore</button>
        <button class="py-1 w-[140px] text-sm rounded-lg bg-[#DC2626]">Delete</button>
      `;

      actionsContainer.children[0].onclick = () =>
        updateItemStatus(item.id, "listed");

      actionsContainer.children[1].onclick = () => deleteItem(item.id);
    }

    container.appendChild(div);
  });
  foundItemsCount = items.length;
  itemsTab.textContent = "Items (" + foundItemsCount + ")";
  pendingItemElement.textContent = pendingItemCount;
  listedItemElement.textContent = listedItemCount;
}

function renderClaims(claims) {
  // generate HTML for each card
  container.innerHTML = "";
  pendingClaimCount = 0;

  claims.forEach((claim) => {
    const div = document.createElement("div");
    div.className =
      "flex md:flex-row flex-col h-fit bg-[#1e1e1e] rounded-xl border border-[#333333]";

    div.dataset.claimId = claim.id;

    div.innerHTML = `
    <div class="flex flex-col md:w-[160px] w-[250px] justify-center align-center items-center md:p-0 px-4 pt-4">
        <img
            src="${itemMap[claim.itemId]?.imageUrl ? itemMap[claim.itemId].imageUrl : "/assets/image-unavailable.png"}"
            alt="Item Image"
            class="md:w-[128px] md:h-[128px] w-50 h-50 rounded-xl border border-[#333333]"
        />
    </div>
    <div class="flex flex-col md:pt-4 md:pb-4 p-4 gap-2 md:w-[calc(100%-240px)] w-full"> 
        <div class="text-lg font-[500] text-white">${formatForDisplay(claim.itemName)}</div>
        <div class="flex md:flex-row flex-col gap-2 md:mb-0 mb-6">
          <div class="text-sm md:w-[33%] w-full text-[#9CA3AF]">Claimer: ${formatForDisplay(claim.claimer)}</div>
          <div class="text-sm md:w-[33%] w-full text-[#9CA3AF]">Contact Information: ${claim?.phone ? claim.phone + " | " + claim.email : claim.email}</div>
        </div>
        
        <div class="flex md:flex-row flex-col gap-4">
            <div class="flex md:w-[33%] w-full text-[12px] text-[#9CA3AF]">Submission Date: ${claim.submittedOn.toDate().toLocaleDateString("en-US")}</div>
            <div class="flex md:w-[33%] w-full text-[12px] text-[#9CA3AF]">Proof: ${formatForDisplay(claim.proof)}</div>
            <div class="flex md:w-[33%] w-full text-[12px] text-[#9CA3AF]">Item ID: ${claim.itemId}</div>
        </div>
        <div class="flex flex-row gap-4 mt-2" data-actions></div>
    </div>
    <div class="text-[12px] text-[#9CA3AF] p-4">
      <div class="flex p-1 w-[60px] justify-center rounded-lg" data-status>${claim.status}</div>
    </div>
  `;

    const statusBadge = div.querySelector("[data-status]");
    const actionsContainer = div.querySelector("[data-actions]");

    if (claim.status === "pending") {
      pendingClaimCount++;

      statusBadge.classList.add("bg-[#20263D]", "text-[#71A4F4]");

      actionsContainer.innerHTML = `
        <button class="py-1 w-[100px] text-sm rounded-lg bg-[#16A34A]">Approve</button>
        <button class="py-1 w-[100px] text-sm rounded-lg bg-[#DC2626]">Reject</button>
      `;

      actionsContainer.children[0].onclick = () => approveClaim(claim);

      actionsContainer.children[1].onclick = async () =>
        await updateClaimStatus(claim.id, "rejected");
    }
    container.appendChild(div);
  });
  pendingClaimElement.textContent = pendingClaimCount;
  claimsTab.textContent = "Claim Requests (" + pendingClaimCount + ")";
}

function renderHistory(claims) {
  // generate HTML for each card
  container.innerHTML = "";

  claims.forEach((claim) => {
    const div = document.createElement("div");
    div.className =
      "flex md:flex-row flex-col h-fit bg-[#1e1e1e] rounded-xl border border-[#333333]";

    div.dataset.claimId = claim.id;

    div.innerHTML = `
    <div class="flex flex-col md:w-[160px] w-[250px] justify-center align-center items-center md:py-4 px-4 pt-4">
        <img
            src="${itemMap[claim.itemId]?.imageUrl ? itemMap[claim.itemId].imageUrl : "/assets/image-unavailable.png"}"
            alt="Item Image"
            class="md:w-[128px] md:h-[128px] w-50 h-50 rounded-xl border border-[#333333]"
        />
    </div>
    <div class="flex flex-col md:pt-4 md:pb-4 p-4 gap-2 md:w-[calc(100%-240px)] w-full"> 
        <div class="text-lg font-[500] text-white">${formatForDisplay(claim.itemName)}</div>
        <div class="flex md:flex-row flex-col gap-2 md:mb-0 mb-6">
          <div class="text-sm md:w-[33%] w-full text-[#9CA3AF]">Claimer: ${formatForDisplay(claim.claimer)}</div>
          <div class="text-sm w-[33%] text-[#9CA3AF]">Contact Information: ${claim?.phone ? claim.phone + " | " + claim.email : claim.email}</div>
        </div>
        
        <div class="flex md:flex-row flex-col gap-4">
            <div class="flex md:w-[33%] w-full text-[12px] text-[#9CA3AF]">Submission Date: ${claim.submittedOn.toDate().toLocaleDateString("en-US")}</div>
            <div class="flex md:w-[33%] w-full text-[12px] text-[#9CA3AF]">Proof: ${formatForDisplay(claim.proof)}</div>
            <div class="flex md:w-[33%] w-full text-[12px] text-[#9CA3AF]">Item ID: ${claim.itemId}</div>
        </div>
    </div>
    <div class="text-[12px] text-[#9CA3AF] p-4">
      <div class="flex p-1 w-[60px] justify-center rounded-lg" data-status>${claim.status}</div>
    </div>
  `;

    const statusBadge = div.querySelector("[data-status]");
    const actionsContainer = div.querySelector("[data-actions]");

    if (claim.status === "rejected") {
      statusBadge.classList.add("bg-[#3A1919]", "text-[#DC2626]");
    }
    if (claim.status === "approved") {
      statusBadge.classList.add("bg-[#212E1A]", "text-[#78DB89]");
    }
    container.appendChild(div);
  });
}

itemsTab.addEventListener("click", () => {
  if (currentView === "items") return;
  currentView = "items";
  activateTab(itemsTab, claimsTab, historyTab);
  loadItems();
});

claimsTab.addEventListener("click", () => {
  if (currentView === "claims") return;
  currentView = "claims";
  activateTab(claimsTab, itemsTab, historyTab);
  loadClaims("pending");
});

historyTab.addEventListener("click", () => {
  if (currentView === "history") return;
  currentView = "history";
  activateTab(historyTab, claimsTab, itemsTab);
  loadClaims("history");
});

function activateTab(active, inactive, inactive2) {
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

  inactive2.classList.remove(
    "bg-[#262626]",
    "border",
    "border-[#404040]",
    "text-white",
  );
  inactive2.classList.add("text-[#9EA3AE]");
}

loadClaims("pending");
loadItems();
