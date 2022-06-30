import { createRequire } from "module";
const require = createRequire(import.meta.url);

import admin from "firebase-admin";
const credentials = require("./firebasekey.json");

export default admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

export const db = admin.firestore();
