import admin from "firebase-admin";

export function initFirebase(): void {
    admin.initializeApp({
        credential: admin.credential.applicationDefault() 
    });
}