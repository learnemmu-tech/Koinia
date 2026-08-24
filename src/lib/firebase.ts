import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { firebaseWebConfig } from "./firebase-config";
import {
  getGsUrl,
  getStorageRestBaseUrl,
  resolveClientStorageBucket,
} from "./firebase-storage-config";
import { storageLog } from "./firebase-storage-logger";

const storageBucket = resolveClientStorageBucket();

/** Console config with env-overridable storageBucket */
const firebaseConfig = {
  ...firebaseWebConfig,
  storageBucket,
};

storageLog.config("Initializing Firebase client", {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  consoleStorageBucket: firebaseWebConfig.storageBucket,
  gsUrl: getGsUrl(storageBucket),
  restApiBase: getStorageRestBaseUrl(storageBucket),
});

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

/** Explicit gs:// bucket — must match Console storageBucket */
export const storage = getStorage(app, getGsUrl(storageBucket));

export { storageBucket as clientStorageBucket };
