import jwt from "jsonwebtoken";
import { db } from "../firebaseconfig.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const user = await db.collection("users").doc(decoded.id).get();
      req.user = user.data();
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};
