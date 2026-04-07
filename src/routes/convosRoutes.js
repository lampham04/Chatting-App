import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

// create a new Convo
router.post("/", async (req, res) => {
  const { userIds } = req.body;

  const convo = await prisma.convo.create({
    data: {
      users: {
        connect: userIds.map((userId) => ({ id: userId })),
      },
    },
  });

  res.status(201).json(convo);
});

// get all convos from user id
router.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  const convos = await prisma.convo.findMany({
    where: {
      users: {
        some: { id: parseInt(userId) },
      },
    },
    include: { users: true },
  });

  res.status(200).json(convos);
});

// get a convo with all messages from convo id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const convo = await prisma.convo.findFirst({
    where: { id: parseInt(id) },
    include: { msgs: true },
  });

  res.status(200).json(convo);
});

export default router;
