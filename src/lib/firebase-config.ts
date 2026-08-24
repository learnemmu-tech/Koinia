/**
 * Firebase web app config from Firebase Console → Project settings → Your apps.
 * https://firebase.google.com/docs/web/setup
 */
export const firebaseWebConfig = {
  apiKey: "AIzaSyDQ2g5-hdBojMLNW1Ar9V2RaCskhu_53nw",
  authDomain: "faithconnecthub-a4e6b.firebaseapp.com",
  projectId: "faithconnecthub-a4e6b",
  storageBucket: "faithconnecthub-a4e6b.firebasestorage.app",
  messagingSenderId: "673302821760",
  appId: "1:673302821760:web:167ab6e06d40a123ca9f65",
  measurementId: "G-W5HXWCWFS6",
} as const;

export const FIREBASE_PROJECT_ID = firebaseWebConfig.projectId;
export const FIREBASE_STORAGE_BUCKET = firebaseWebConfig.storageBucket;
