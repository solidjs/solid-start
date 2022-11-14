// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import "firebase/auth";
import { getAuth } from "firebase/auth";
import {
  collection,
  getFirestore,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ServerData } from "~/domain/server_data/server_data";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase

export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const auth = getAuth();

// To Domain coverters
export const serverDataCoverter = {
  toFirestore: (data: ServerData) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as ServerData,
};

// Reference to the collection
export const serverDataCollectionRef = collection(
  database,
  "serverData"
).withConverter(serverDataCoverter);
