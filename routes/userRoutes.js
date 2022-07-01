import express from "express";
import {
  registerUser,
  getBalance,
  loginUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getBalance", protect, getBalance);

export default router;
