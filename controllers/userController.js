import { db } from "../firebaseconfig.js";
import { customAlphabet } from "nanoid";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const registerUser = async (req, res) => {
  const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);
  const { name, phone, country_code, password } = req.body;
  const usersRef = db.collection("users");

  try {
    const userdata = await usersRef.where("phone", "==", phone).get();

    if (!userdata.empty) {
      res.status(400).send("User already exists");
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const id = nanoid();
      const user = {
        cid: `cid_${id}`,
        country_code,
        name,
        phone,
        password: hashedPassword,
      };
      const response = await db.collection("users").doc(id).set(user);

      await db
        .collection("wallet_amount")
        .doc(user.cid)
        .set({ amount: 1000, currency: "USD" });
      res.status(201).json({ token: generateToken(id) });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const loginUser = async (req, res) => {
  const { phone, password } = req.body;
  const usersRef = db.collection("users");
  const userdata = await usersRef.where("phone", "==", phone).get();
  let id, passcheck;
  userdata.forEach((doc) => {
    id = doc.id;
    passcheck = doc.data().password;
  });
  if (!userdata.empty && (await bcrypt.compare(password, passcheck))) {
    res.status(200).json({ token: generateToken(id) });
  } else {
    res.status(400).json({ error: "Invalid Credentials" });
  }
};

export const getBalance = async (req, res) => {
  const { cid } = req.user;
  const walletRef = db.collection("wallet_amount");

  try {
    const userdata = await walletRef.doc(cid).get();
    const { amount, currency } = userdata.data();

    if (userdata.exists) {
      res.send({ amount, currency });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};
