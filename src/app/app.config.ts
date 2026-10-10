import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfVSHqFBv9Nc0id5CsirDVY9HEy01v7Lc",
  authDomain: "urban-vibe-446e0.firebaseapp.com",
  projectId: "urban-vibe-446e0",
  storageBucket: "urban-vibe-446e0.firebasestorage.app",
  messagingSenderId: "413976439592",
  appId: "1:413976439592:web:3bc0b3f7473d9ad177fe1d",
  measurementId: "G-PXQFWGL74L"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore())
  ]
};
