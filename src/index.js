import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import usersRoutes from "./routes/usersRoutes.js";
import convosRoutes from "./routes/convosRoutes.js";
import prisma from "./prisma.js";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("login", async (userId) => {
    const convos = await prisma.convo.findMany({
      where: { users: { some: { id: parseInt(userId) } } },
    });

    if (!onlineUsers.has(userId.toString())) {
      onlineUsers.set(userId.toString(), new Set());
    }
    onlineUsers.get(userId.toString()).add(socket.id);

    socket.join(convos.map((convo) => convo.id.toString()));
  });

  socket.on("new conversation", async (names, callback) => {
    const newConvo = await prisma.convo.create({
      data: {
        users: {
          connect: names.map((name) => ({ name })),
        },
      },
      include: { users: true },
    });

    newConvo.users.forEach((user) => {
      const targetSocketIds = onlineUsers.get(user.id.toString());
      if (targetSocketIds) {
        targetSocketIds.forEach((targetSocketId) => {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.join(newConvo.id.toString());
            targetSocket.emit("new conversation", newConvo.id);
          }
        });
      }
    });

    callback({ convoId: newConvo.id });
  });

  socket.on("message", async (convoId, userId, username, msg) => {
    await prisma.message.create({
      data: {
        msg,
        userId: parseInt(userId),
        convoId: parseInt(convoId),
      },
    });
    socket.broadcast
      .to(convoId.toString())
      .emit("message", convoId, userId, username, msg);
  });
});

// api routes
app.use("/api/users", usersRoutes);
app.use("/api/convos", convosRoutes);

server.listen(3000, () => {
  console.log("server started on port 3000");
});
