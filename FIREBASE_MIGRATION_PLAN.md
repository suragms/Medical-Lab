# Firebase Migration Plan for HEALit Lab App

## Problem
Currently, the application stores data in the browser's `localStorage`. This causes:
1. **Data Loss**: Clearing browser cache deletes all data.
2. **No Sync**: Data on one device (e.g., PC) is not visible on another (e.g., Phone).
3. **Deployment Issues**: When deployed to Netlify, each user/device has their own isolated data.

## Solution: Firebase Cloud Firestore
Migrate to Google Firebase, which provides a free, real-time, cloud-based database. This fits your budget (Free Tier is generous) and solves all sync issues.

---

## Step 1: Create Firebase Project
1. Go to [firebase.google.com](https://firebase.google.com/) and sign in with your Google account.
2. Click **"Go to Console"** -> **"Add project"**.
3. Name it `Healit-Lab-App`.
4. Disable Google Analytics (optional).
5. Click **Create Project**.

## Step 2: Setup Firestore Database
1. In the Firebase Console sidebar, click **Build** -> **Firestore Database**.
2. Click **Create Database**.
3. Choose a location (e.g., `asia-south1` for Mumbai/India).
4. Start in **Test Mode** (allows read/write for 30 days) - *We will secure this later*.

## Step 3: Register Web App
1. Click the **Project Overview** (Home icon).
2. Click the **Web** icon (`</>`).
3. App nickname: `Healit-Web`.
4. Click **Register app**.
5. **Copy the `firebaseConfig` object** shown on the screen. You will need this.

## Step 4: Install Firebase in Project
Run this command in your project terminal:
```bash
npm install firebase
```

## Step 5: Configure Firebase in Code
Create a new file `src/lib/firebase.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

## Step 6: Update Data Service (`src/features/shared/dataService.js`)
Modify your data service to read/write from Firestore instead of localStorage.

**Example - Saving a Patient:**
```javascript
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs } from "firebase/firestore";

// OLD (LocalStorage)
// const patients = JSON.parse(localStorage.getItem('patients') || '[]');
// patients.push(newPatient);
// localStorage.setItem('patients', JSON.stringify(patients));

// NEW (Firebase)
export const addPatient = async (patientData) => {
  try {
    const docRef = await addDoc(collection(db, "patients"), patientData);
    console.log("Document written with ID: ", docRef.id);
    return { success: true, id: docRef.id };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, error: e };
  }
};
```

## Step 7: Deploy
1. Commit your changes to GitHub.
2. Netlify will auto-deploy.
3. Now, all 65 devices will see the SAME data in real-time!

## Budget
- **Firebase Spark Plan**: Free (up to 1GB storage, 50k reads/day). This is sufficient for thousands of patients.
- **Cost**: ₹0 / month.

---
**Next Steps**:
If you approve, I can start implementing Step 5 and 6 for you immediately.
