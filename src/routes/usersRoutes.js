import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

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
