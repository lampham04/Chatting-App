import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

io.on("connection", (socket) => {
  socket.on("join room", (name, room) => {
    socket.join(room);
    socket.broadcast.to(room).emit("room message", `${name} joined ${room}`);
  });

  socket.on("leave room", (name, room) => {
    socket.leave(room);
    socket.broadcast.to(room).emit("room message", `${name} left ${room}`);
  });

  socket.on("room message", (name, room, msg) => {
    socket.broadcast.to(room).emit("room message", `${name}: ${msg}`);
  });

  socket.on("common room", (name, msg) => {
    socket.broadcast.emit("common room", `${name}: ${msg}`);
  });
});

server.listen(3000, () => {
  console.log("server started on port 3000");
});
