const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const users = {};
const userSockets = {};

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!username || users[username]) {
    return res.status(400).json({ error: "Invalid or taken username" });
  }
  users[username] = true;
  res.json({ success: true });
  io.emit("user list", Object.keys(users));
});

app.post("/logout", (req, res) => {
  const { username } = req.body;
  delete users[username];
  delete userSockets[username];
  res.json({ success: true });
  io.emit("user list", Object.keys(users));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (username) => {
    socket.username = username;
    userSockets[username] = socket.id;
    io.emit("chat message", `${username} joined the chat`);
    io.emit("user list", Object.keys(users));
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", {
      user: socket.username,
      message: msg
    });
  });

  socket.on("private message", ({ to, message }) => {
    const toSocketId = userSockets[to];
    if (toSocketId) {
      io.to(toSocketId).emit("chat message", `(Private) ${socket.username}: ${message}`);
    } else {
      socket.emit("chat message", `❌ User ${to} not found`);
    }
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("chat message", `${socket.username} left the chat`);
      delete users[socket.username];
      delete userSockets[socket.username];
      io.emit("user list", Object.keys(users));
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
