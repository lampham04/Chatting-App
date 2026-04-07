import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

// create new user
router.post("/", async (req, res) => {
  const { name } = req.body;

  const user = await prisma.user.create({
    data: {
      name,
    },
  });

  res.status(201).json(user);
});

router.get("/:name", async (req, res) => {
  const { name } = req.params;

  const user = await prisma.user.findFirst({
    where: { name },
    include: {
      convos: {
        include: { users: true },
      },
    },
  });

  res.status(200).json(user);
});

export default router;
