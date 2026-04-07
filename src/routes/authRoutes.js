import { Router } from "express";
import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: username,
      hashedPassword,
    },
  });

  res.status(201).json(user);
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const matchingUser = await prisma.user.findFirstOrThrow({
      where: { name: username },
    });

    const isMatch = await bcrypt.compare(password, matchingUser.hashedPassword);

    if (!isMatch) {
      throw new Error();
    }

    const payload = { id: matchingUser.id, username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({ accessToken: token });
  } catch (err) {
    res.status(404).json({ message: "invalid credentials" });
  }
});

export default router;
