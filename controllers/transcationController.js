import { customAlphabet } from "nanoid";
import { db } from "../firebaseconfig.js";
import { Timestamp } from "firebase-admin/firestore";

export const makeTranscation = async (req, res) => {
  const nanoid = customAlphabet("1234567890", 10);
  const id = nanoid();
  const { phone, amountToTransfer } = req.body;
  const { cid } = req.user;
  const usersRef = db.collection("users");
  const walletRef = db.collection("wallet_amount");
  const checkamount = await walletRef.doc(cid).get();
  const { amount } = checkamount.data();
  if (req.body.phone === req.user.phone) {
    return res.status(400).json({ error: "You cannot transfer to yourself" });
  }
  if (amount - amountToTransfer < 0) {
    return res.status(400).json({ error: "Insufficient Balance" });
  }
  const userdata = await usersRef.where("phone", "==", phone).get();
  if (userdata.empty) {
    return res.status(400).json({ error: "Invalid phone number" });
  }
  let cid2;
  userdata.forEach((doc) => {
    cid2 = doc.data().cid;
  });
  const walletdata = await walletRef.doc(cid2).get();
  const amount2 = walletdata.data().amount;
  const uoneamount = amount - amountToTransfer;
  const utwoamount = amount2 + amountToTransfer;
  const walletHistoryRef1 = db
    .collection("wallet_history")
    .doc(cid)
    .collection(Timestamp.now().toDate().toISOString())
    .doc(id);
  const walletHistoryRef2 = db
    .collection("wallet_history")
    .doc(cid2)
    .collection(Timestamp.now().toDate().toISOString())
    .doc(id);
  try {
    const batch = db.batch();
    batch.update(walletRef.doc(cid), { amount: uoneamount });
    batch.update(walletRef.doc(cid2), { amount: utwoamount });
    batch.set(walletHistoryRef1, {
      amount: amountToTransfer,
      currency: "USD",
      status: 0,
      tran_type: "debit",
      tran_id: id,
    });
    batch.set(walletHistoryRef2, {
      amount: amountToTransfer,
      currency: "USD",
      status: 0,
      tran_type: "credit",
      tran_id: id,
    });
    await batch.commit();
    res.status(200).json({ message: "Transaction successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
