import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { getDatabase, provideDatabase } from "@angular/fire/database";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: "mockrview",
        appId: "1:417992497103:web:e9909044cb8e7cba41a4ba",
        storageBucket: "mockrview.firebasestorage.app",
        apiKey: "AIzaSyBMDhVP5KLjW6WUIYNiW77y7nEkEDiV2Co",
        authDomain: "mockrview.firebaseapp.com",
        messagingSenderId: "417992497103",
        measurementId: "G-BRCQJ56CG1",
      })
    ),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
  ],
};
