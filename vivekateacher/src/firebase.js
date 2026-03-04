// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // 👈 Ye missing tha


const firebaseConfig = {
  apiKey: "AIzaSyC9W3ABpuVgmQP3WJtV00At7g3Qud0iQOU",
  authDomain: "schooltest-b8ce2.firebaseapp.com",
  projectId: "schooltest-b8ce2",
  storageBucket: "schooltest-b8ce2.firebasestorage.app",
  messagingSenderId: "436336891260",
  appId: "1:436336891260:web:dc98f8ea6e51897f4300f9",
};

const app = initializeApp(firebaseConfig);

// 👇 Teeno cheezein export karni zaroori hain
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // 👈 Isko add kiya