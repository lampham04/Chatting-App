const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

const nameModal = document.getElementById("name-modal");
const nameForm = document.getElementById("name-form");
const usernameInput = document.getElementById("username");

const joinRoomModal = document.getElementById("join-room-modal");
const joinRoomForm = document.getElementById("join-room-form");
const roomInput = document.getElementById("room-input");
const toggleRoomBtn = document.getElementById("toggle-room-btn");
const closeJoinModal = document.getElementById("close-join-modal");
const roomNameHeader = document.getElementById("room-name");

let currentUser = "";
let currentRoom = "";

nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  currentUser = usernameInput.value.trim();
  if (currentUser) {
    // Hide modal
    nameModal.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => {
      nameModal.style.display = "none";
    }, 300);
  }
});

// Focus input when modal opens
window.addEventListener("DOMContentLoaded", () => {
  usernameInput.focus();
});

// Send messages
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (currentRoom) {
    const message = document.createElement("li");
    message.textContent = `You: ${input.value}`;
    messages.append(message);

    socket.emit("room message", currentUser, currentRoom, input.value);
  } else {
    const message = document.createElement("li");
    message.textContent = `You: ${input.value}`;
    messages.append(message);

    socket.emit("common room", currentUser, input.value);
  }

  input.value = "";
});

socket.on("room message", (msg) => {
  const message = document.createElement("li");
  message.textContent = msg;
  messages.append(message);
});

socket.on("common room", (msg) => {
  const message = document.createElement("li");
  message.textContent = msg;
  messages.append(message);
});

// Toggle Room Button (Join/Leave)
toggleRoomBtn.addEventListener("click", () => {
  if (currentRoom) {
    // Leave Room Logic
    socket.emit("leave room", currentUser, currentRoom);

    messages.innerHTML = "";
    const message = document.createElement("li");
    message.textContent = `You left ${currentRoom}`;
    messages.append(message);

    currentRoom = "";
    roomNameHeader.textContent = "Common Channel";
    toggleRoomBtn.textContent = "Join Room";
    toggleRoomBtn.classList.remove("btn-leave");
    toggleRoomBtn.classList.add("btn-join");
  } else {
    // Show Join Room Modal
    joinRoomModal.style.display = "flex";
    setTimeout(() => {
      joinRoomModal.classList.remove("hidden");
    }, 10);
    roomInput.focus();
  }
});

// Close Join Modal
closeJoinModal.addEventListener("click", () => {
  joinRoomModal.classList.add("hidden");
  setTimeout(() => {
    joinRoomModal.style.display = "none";
  }, 300);
});

// Join Room Logic
joinRoomForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newRoom = roomInput.value.trim();
  if (newRoom) {
    currentRoom = newRoom;
    roomNameHeader.textContent = `Room: ${newRoom}`;

    socket.emit("join room", currentUser, currentRoom);

    // Change button to Leave Room
    toggleRoomBtn.textContent = "Leave Room";
    toggleRoomBtn.classList.remove("btn-join");
    toggleRoomBtn.classList.add("btn-leave");

    joinRoomModal.classList.add("hidden");
    setTimeout(() => {
      joinRoomModal.style.display = "none";
      roomInput.value = "";
    }, 300);

    messages.innerHTML = "";
    const message = document.createElement("li");
    message.textContent = `You joined ${currentRoom}`;
    messages.append(message);
  }
});
