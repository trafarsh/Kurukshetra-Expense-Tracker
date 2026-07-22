import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAWv_MXxZIKq_VlAi9SfHwijan4jIBwf6Q",
  authDomain: "karting-expense-tracker.firebaseapp.com",
  projectId: "karting-expense-tracker",
  storageBucket: "karting-expense-tracker.firebasestorage.app",
  messagingSenderId: "254132325456",
  appId: "1:254132325456:web:10734a2065a6db2e875555",
  measurementId: "G-NK06MBM5JF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
