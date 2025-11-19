
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// Corrected Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCS3QZqttO4w5on-_3ofjNhHXOjRCAB_ik",
  authDomain: "eventify-ddd2d.firebaseapp.com",
  projectId: "eventify-ddd2d",
  storageBucket: "eventify-ddd2d.appspot.com",
  messagingSenderId: "213374368964",
  appId: "1:213374368964:web:55e6fa460887d43b425d91",
  measurementId: "G-H6G8Q8M0L4"
};

let app;
let db: any;
let auth: any;

try {
    // Check if firebase app is already initialized to avoid "already exists" error in HMR
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    
    db = firebase.firestore();
    auth = firebase.auth();

    // Enable offline persistence
    db.enablePersistence()
        .catch((err: any) => {
            if (err.code == 'failed-precondition') {
                console.warn("Persistence failed: multiple tabs open.");
            } else if (err.code == 'unimplemented') {
                console.warn("Persistence not supported by browser.");
            }
        });

    // Attempt to sign in anonymously to satisfy Firestore security rules
    auth.signInAnonymously().catch((err: any) => {
        console.warn("Anonymous authentication failed:", err);
    });

    console.log("Firebase initialized successfully");
} catch (e) {
    console.error("Error initializing Firebase:", e);
}

export { db, app, auth };
