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

let currentUser = null;
let currentConvo = null;

socket.on("message", (convoId, userId, username, msg) => {
  if (convoId == currentConvo) {
    const message = document.createElement("li");
    message.textContent = `${username}: ${msg}`;
    messages.append(message);
  } else {
    window.alert(`New message from ${username}`);
  }
});

socket.on("new conversation", async () => {
  // refetch fresh convo list from REST API
  const response = await fetch(
    `http://localhost:3000/api/convos/users/${currentUser.id}`,
  );
  const convos = await response.json();

  if (!currentConvo) {
    messages.innerHTML = "";
    convos.forEach((convo) => {
      const dialogue = document.createElement("li");
      dialogue.textContent = `User: ${convo.users.find((user) => user.name != currentUser.name).name}`;

      dialogue.addEventListener("click", async () => {
        await joinRoomFn(
          convo.id,
          convo.users.find((user) => user.name != currentUser.name).name,
        );
      });

      messages.append(dialogue);
    });
  }
});

nameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();

  if (username) {
    const response = await fetch(`http://localhost:3000/api/users/${username}`);
    currentUser = await response.json();

    socket.emit("login", currentUser.id);

    // Hide modal
    nameModal.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => {
      nameModal.style.display = "none";
    }, 300);

    currentUser.convos.forEach((convo) => {
      const dialogue = document.createElement("li");
      dialogue.textContent = `User: ${convo.users.find((user) => user.name != currentUser.name).name}`;

      dialogue.addEventListener("click", async () => {
        await joinRoomFn(
          convo.id,
          convo.users.find((user) => user.name != currentUser.name).name,
        );
      });

      messages.append(dialogue);
    });
  }
});

// Focus input when modal opens
window.addEventListener("DOMContentLoaded", () => {
  usernameInput.focus();
});

// Send messages
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (currentConvo) {
    const message = document.createElement("li");
    message.textContent = `You: ${input.value}`;
    messages.append(message);

    socket.emit(
      "message",
      currentConvo,
      currentUser.id,
      currentUser.name,
      input.value,
    );
  }

  input.value = "";
});

// Toggle Room Button (Join/Leave)
toggleRoomBtn.addEventListener("click", async () => {
  if (currentConvo) {
    // Leave Room Logic
    messages.innerHTML = "";

    // refetch fresh convo list from REST API
    const response = await fetch(
      `http://localhost:3000/api/convos/users/${currentUser.id}`,
    );
    const convos = await response.json();

    convos.forEach((convo) => {
      const dialogue = document.createElement("li");
      dialogue.textContent = `User: ${convo.users.find((user) => user.name != currentUser.name).name}`;

      dialogue.addEventListener("click", async () => {
        await joinRoomFn(
          convo.id,
          convo.users.find((user) => user.name != currentUser.name).name,
        );
      });

      messages.append(dialogue);
    });

    currentConvo = "";
    roomNameHeader.textContent = "All Conversations";
    toggleRoomBtn.textContent = "New Conversation";
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
joinRoomForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const targetUser = roomInput.value.trim();
  if (targetUser) {
    socket.emit(
      "new conversation",
      [currentUser.name, targetUser],
      async ({ convoId }) => {
        currentConvo = convoId;
        await joinRoomFn(convoId, targetUser);
      },
    );
  }
});

const joinRoomFn = async (convoId, targetUser) => {
  roomNameHeader.textContent = `User:  ${targetUser}`;

  // Change button to Leave Room
  toggleRoomBtn.textContent = "Leave Conversation";
  toggleRoomBtn.classList.remove("btn-join");
  toggleRoomBtn.classList.add("btn-leave");
  messages.innerHTML = "";

  joinRoomModal.classList.add("hidden");
  setTimeout(() => {
    joinRoomModal.style.display = "none";
    roomInput.value = "";
  }, 300);

  const response = await fetch(`http://localhost:3000/api/convos/${convoId}`);
  const correspondingConvo = await response.json();

  currentConvo = correspondingConvo.id;

  correspondingConvo.msgs.forEach((msg) => {
    const message = document.createElement("li");
    if (msg.userId == currentUser.id) {
      message.textContent = `You: ${msg.msg}`;
    } else {
      message.textContent = `${targetUser}: ${msg.msg}`;
    }

    messages.append(message);
  });
};
