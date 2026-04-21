const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

const nameModal = document.getElementById("name-modal");
const nameForm = document.getElementById("name-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const joinRoomModal = document.getElementById("join-room-modal");
const joinRoomForm = document.getElementById("join-room-form");
const roomInput = document.getElementById("room-input");
const toggleRoomBtn = document.getElementById("toggle-room-btn");
const closeJoinModal = document.getElementById("close-join-modal");
const roomNameHeader = document.getElementById("room-name");

let currentUser = null;
let currentConvo = null;
let token = "";
let socket;

// ---- Socket Init ----

function initSocket(token) {
  socket = io("http://localhost:3000", {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("connected!", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("connection error:", err.message);
  });

  socket.on("message", (convoId, userId, username, msg) => {
    if (!currentConvo || convoId != currentConvo.id) {
      window.alert(`New message from ${username}`);
      return;
    }

    const message = document.createElement("li");
    message.textContent = `${msg}`;
    message.classList.add("theirs");
    messages.append(message);
  });

  socket.on("new conversation", async () => {
    const response = await fetch(
      `http://localhost:3000/api/convos/users/${currentUser.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const convos = await response.json();

    if (!currentConvo) {
      renderConvoList(convos);
    }
  });
}

// ---- Helpers ----

function renderConvoList(convos) {
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

const joinRoomFn = async (convoId, targetUser) => {
  roomNameHeader.textContent = `User: ${targetUser}`;

  toggleRoomBtn.textContent = "Leave Conversation";
  toggleRoomBtn.classList.remove("btn-join");
  toggleRoomBtn.classList.add("btn-leave");
  messages.innerHTML = "";

  joinRoomModal.classList.add("hidden");
  setTimeout(() => {
    joinRoomModal.style.display = "none";
    roomInput.value = "";
  }, 300);

  const response = await fetch(`http://localhost:3000/api/convos/${convoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const correspondingConvo = await response.json();

  currentConvo = correspondingConvo;

  correspondingConvo.msgs.forEach((msg) => {
    const message = document.createElement("li");
    message.textContent = `${msg.msg}`;

    if (msg.userId == currentUser.id) {
      message.classList.add("mine");
    } else {
      message.classList.add("theirs");
    }

    messages.append(message);
  });
};

// ---- Login ----

nameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) return;

  const response = await fetch(`http://localhost:3000/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  token = data.accessToken;

  if (!token) {
    console.log("login failed");
    return;
  }

  const userResponse = await fetch(
    `http://localhost:3000/api/users/${username}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  currentUser = await userResponse.json();

  initSocket(token);

  // Hide modal
  nameModal.classList.add("opacity-0", "pointer-events-none");
  setTimeout(() => {
    nameModal.style.display = "none";
  }, 300);

  renderConvoList(currentUser.convos);
});

// ---- Send Message ----

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (currentConvo && input.value.trim()) {
    const message = document.createElement("li");
    message.textContent = `${input.value}`;
    message.classList.add("mine");
    messages.append(message);

    console.log(currentConvo);

    const targetUser = currentConvo.users.find(
      (user) => user.id !== currentUser.id,
    );

    socket.emit(
      "message",
      currentConvo.id,
      currentUser.id,
      currentUser.name,
      targetUser.id,
      input.value,
    );
  }
  input.value = "";
});

// ---- Toggle Room Button ----

toggleRoomBtn.addEventListener("click", async () => {
  if (currentConvo) {
    // Leave conversation
    const response = await fetch(
      `http://localhost:3000/api/convos/users/${currentUser.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const convos = await response.json();

    renderConvoList(convos);

    currentConvo = null;
    roomNameHeader.textContent = "All Conversations";
    toggleRoomBtn.textContent = "New Conversation";
    toggleRoomBtn.classList.remove("btn-leave");
    toggleRoomBtn.classList.add("btn-join");
  } else {
    // Show join room modal
    joinRoomModal.style.display = "flex";
    setTimeout(() => {
      joinRoomModal.classList.remove("hidden");
    }, 10);
    roomInput.focus();
  }
});

// ---- Close Join Modal ----

closeJoinModal.addEventListener("click", () => {
  joinRoomModal.classList.add("hidden");
  setTimeout(() => {
    joinRoomModal.style.display = "none";
  }, 300);
});

// ---- New Conversation ----

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

// ---- Focus on load ----

window.addEventListener("DOMContentLoaded", () => {
  usernameInput.focus();
});
