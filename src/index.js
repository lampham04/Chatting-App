import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import usersRouter from "./routes/usersRoutes.js";
import convosRouter from "./routes/convosRoutes.js";
import authRouter from "./routes/authRoutes.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import prisma from "./prisma.js";
import jwt from "jsonwebtoken";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("no token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id; // attach to socket for later use
    next(); // allow connection
  } catch (err) {
    next(new Error("invalid token")); // reject connection
  }
});

io.on("connection", async (socket) => {
  const convos = await prisma.convo.findMany({
    where: { users: { some: { id: socket.userId } } },
  });

  socket.join(socket.userId.toString());

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
      socket.to(user.id.toString()).emit("new conversation");
    });

    callback({ convoId: newConvo.id });
  });

  socket.on("message", async (convoId, userId, username, targetId, msg) => {
    await prisma.message.create({
      data: {
        msg,
        userId: parseInt(userId),
        convoId: parseInt(convoId),
      },
    });

    socket.broadcast
      .to(targetId.toString())
      .emit("message", convoId, userId, username, msg);
  });
});

// api routes
app.use("/api/auth", authRouter);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/convos", authMiddleware, convosRouter);

server.listen(3000, () => {
  console.log("server started on port 3000");
});
