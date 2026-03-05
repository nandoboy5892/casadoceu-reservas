import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRJiT2aagQrp-zKSc2ZoVyvhouPhB4LRw",
  authDomain: "casadoceu-reservas.firebaseapp.com",
  projectId: "casadoceu-reservas",
  storageBucket: "casadoceu-reservas.firebasestorage.app",
  messagingSenderId: "376548443368",
  appId: "1:376548443368:web:c4c8373ddd8c0e6bf0f55d",
  measurementId: "G-GX7Q1B0RKN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase inicializado com sucesso");