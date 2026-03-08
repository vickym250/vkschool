// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // 👈 Ye missing tha

const firebaseConfig = {
  apiKey: "AIzaSyDVFbgL4DUnknco-vnq7WgcnKnIpiu1d6I",
  authDomain: "vivekanand-353c0.firebaseapp.com",
  projectId: "vivekanand-353c0",
  storageBucket: "vivekanand-353c0.firebasestorage.app",
  messagingSenderId: "472467274625",
  appId: "1:472467274625:web:a4b1ed6a15c22b39278680",
  measurementId: "G-R4H6EHKNYB"
};

const app = initializeApp(firebaseConfig);

// 👇 Teeno cheezein export karni zaroori hain
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // 👈 Isko add kiya