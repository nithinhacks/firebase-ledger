import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { makeTranscation } from "../controllers/transcationController.js";

const router = express.Router();

router.post("/", protect, makeTranscation);

export default router;
