// Firebase Configuration
// For production deployment, use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBwP9vc8mQi7KXqVH0EXAMPLE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "healit-lab.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "healit-lab",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "healit-lab.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

export default firebaseConfig;
