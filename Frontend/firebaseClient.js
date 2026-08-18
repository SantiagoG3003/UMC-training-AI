// Config de Firebase para el FRONTEND. El apiKey de acá no es secreto
// (Firebase está diseñado así, la seguridad real la ponen las reglas de
// Firestore y el backend) — lo que sí es secreto es el .json del backend,
// ese nunca va en el frontend.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLwr9QQQNESWNl2vm3bymt9Js3v4-95rc",
  authDomain: "umc-ai.firebaseapp.com",
  projectId: "umc-ai",
  storageBucket: "umc-ai.firebasestorage.app",
  messagingSenderId: "679103193591",
  appId: "1:679103193591:web:baf341134f7ae4dcd5cef2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
