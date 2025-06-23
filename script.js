const socket = io();
let currentUser = "";
let userAvatar = "";

function login() {
  const username = document.getElementById("username").value;

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = username;
        userAvatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`;

        document.getElementById("loginDiv").style.display = "none";
        document.getElementById("chatDiv").style.display = "block";
        document.getElementById("currentUser").innerText = currentUser;

        socket.emit("join", username);
      } else {
        document.getElementById("loginError").innerText = data.error;
      }
    });
}

function sendMessage() {
  const message = document.getElementById("messageInput").value;
  const privateTo = document.getElementById("privateTo").value;

  if (message.trim() !== "") {
    if (privateTo.trim() !== "") {
      socket.emit("private message", { to: privateTo.trim(), message });
    } else {
      socket.emit("chat message", message);
    }
    document.getElementById("messageInput").value = "";
  }
}

function logout() {
  fetch("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser })
  }).then(() => {
    location.reload();
  });
}

socket.on("chat message", (data) => {
  if (!data || !data.user || !data.message) return;

  const { user, message } = data;
  const isCurrentUser = user === currentUser;
  const messages = document.getElementById("messages");

  const avatarURL = `https://api.dicebear.com/7.x/thumbs/svg?seed=${user}`;

  messages.innerHTML += `
    <div class="flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3">
      <div class="flex ${isCurrentUser ? 'flex-row-reverse' : ''} items-center max-w-[75%]">
        <img src="${avatarURL}" class="w-8 h-8 rounded-full mx-2 border border-white" />
        <div class="${isCurrentUser ? 'bg-green-500' : 'bg-gray-700'} text-white p-2 rounded-xl shadow">
          <span class="text-sm font-semibold block">${user}</span>
          <span class="block">${message}</span>
        </div>
      </div>
    </div>
  `;
  playSound();
  messages.scrollTop = messages.scrollHeight;
});


socket.on("user list", (userArray) => {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  userArray.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    userList.appendChild(li);
  });
});

function addEmoji(emoji) {
  const input = document.getElementById("messageInput");
  input.value += emoji;
  input.focus();
}
