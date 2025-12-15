import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGSJyxrDlNnyvhVdC7YZ7_YL5Tu2O5CEQ",
  authDomain: "filipinoemigrantsdb-51c1d.firebaseapp.com",
  projectId: "filipinoemigrantsdb-51c1d",
  storageBucket: "filipinoemigrantsdb-51c1d.firebasestorage.app",
  messagingSenderId: "578799324439",
  appId: "1:578799324439:web:09f8c9f8baee0ea226fb52",
  measurementId: "G-KXKR2QH406"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
