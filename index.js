import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import firebaseconfig from "./firebaseconfig.js";
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRouter);
app.use("/transaction", transactionRouter);

app.listen(port, () => console.log(`Listening on port ${port}`));
