import { customAlphabet } from "nanoid";
import { db } from "../firebaseconfig.js";
import { Timestamp } from "firebase-admin/firestore";

export const makeTransaction = async (req, res) => {
  const nanoid = customAlphabet("1234567890", 10);
  const id = nanoid();
  const { phone, amountToTransfer } = req.body;
  if (!phone || !amountToTransfer) {
    return res.status(400).json({
      message: "Please fill all the fields",
    });
  }
  if (isNaN(amountToTransfer)) {
    return res.status(400).json({
      message: "Amount to transfer must be a number",
    });
  }
  if (amountToTransfer <= 0) {
    return res.status(400).json({
      message: "Amount to transfer must be greater than 0",
    });
  }
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

export const getTransaction = async (req, res) => {
  const { cid } = req.user;
  const walletHistoryRef = db.collection("wallet_history").doc(cid);
  try {
    const walletHistory = await walletHistoryRef.listCollections();
    const result = walletHistory.map(async (collection) => {
      await collection.get();
      return collection.id;
    });
    const result2 = await Promise.all(result);
    const transactions = result2.map(async (collection) => {
      const transaction = await walletHistoryRef.collection(collection).get();
      return transaction.docs.map((doc) => {
        const { amount, tran_id, currency, tran_type, status } = doc.data();
        return {
          Timestamp: collection,
          info: { amount, tran_id, currency, tran_type, status },
        };
      });
    });
    const data = await Promise.all(transactions);
    const result3 = data.flat();
    res.status(200).json({ data: result3 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
