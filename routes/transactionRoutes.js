import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  makeTransaction,
  getTransaction,
} from "../controllers/transcationController.js";

const router = express.Router();

router.post("/maketransaction", protect, makeTransaction);
router.get("/gettransactions", protect, getTransaction);

export default router;
