// Firebase configuration and Service Layer
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Default mock configuration or read from environment
// User can replace this configuration with their own Firebase project settings.
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || ""
};

let db = null;
let storage = null;
let auth = null;
let useFirebase = false;

// Check if valid credentials are provided
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    useFirebase = true;
    console.log("Community Hero: Successfully connected to Firebase Backend.");
  } catch (e) {
    console.error("Firebase init failed, switching to LocalMock storage.", e);
  }
} else {
  console.log("Community Hero: Firebase configuration not set or empty. Using LocalStorage Mock Backend.");
}

/* =========================================================================
   LOCAL MOCK DATA LAYER (Fallback)
   ========================================================================= */

// Preseeded Mock Users
const MOCK_USERS = [
  { userId: 'user1', username: 'AmanRoy', points: 350, badges: ['Pioneer', 'Pothole Slayer'] },
  { userId: 'user2', username: 'Sarah99', points: 280, badges: ['Eco Warrior'] },
  { userId: 'user3', username: 'VarunD', points: 190, badges: ['Leak Watcher'] },
  { userId: 'user4', username: 'Nisha21', points: 150, badges: ['Novice'] },
  { userId: 'current_user', username: 'You (Citizen Hero)', points: 40, badges: ['First Responder'] }
];

// Preseeded Mock Reports
const MOCK_REPORTS = [
  {
    id: 'report_1',
    title: 'Deep crater on Main Flyover Road',
    type: 'pothole',
    description: 'A deep pothole in the middle of the road causing vehicles to swerve dangerously.',
    latitude: 28.6139,
    longitude: 77.2090,
    photoUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    status: 'fixed',
    timestamp: Date.now() - 3600000 * 24, // 1 day ago
    userId: 'user1',
    username: 'AmanRoy'
  },
  {
    id: 'report_2',
    title: 'Garbage dump near Sector 4 Park',
    type: 'garbage',
    description: 'A massive pile of uncollected garbage bags emitting foul smell right next to the park gate.',
    latitude: 28.6200,
    longitude: 77.2150,
    photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    status: 'reported',
    timestamp: Date.now() - 3600000 * 2, // 2 hours ago
    userId: 'user2',
    username: 'Sarah99'
  },
  {
    id: 'report_3',
    title: 'Water pipe leakage on 8th Street',
    type: 'leakage',
    description: 'High pressure drinking water pipe broken, wasting clean water onto the street.',
    latitude: 28.6080,
    longitude: 77.2020,
    photoUrl: 'https://images.unsplash.com/photo-1542013936693-8848e574047e?auto=format&fit=crop&w=600&q=80',
    status: 'review',
    timestamp: Date.now() - 1800000, // 30 mins ago
    userId: 'user3',
    username: 'VarunD'
  }
];

// Helper to initialize local storage
function initLocalMock() {
  if (!localStorage.getItem('ch_users')) {
    localStorage.setItem('ch_users', JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem('ch_reports')) {
    localStorage.setItem('ch_reports', JSON.stringify(MOCK_REPORTS));
  }
}
initLocalMock();

/* =========================================================================
   GEODISTANCE HELPER (Deduplication)
   ========================================================================= */

export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

/* =========================================================================
   UNIFIED PUBLIC SERVICE API
   ========================================================================= */

// Get current user profile (with points and badges)
export async function getUserProfile(userId = 'current_user') {
  if (useFirebase) {
    // In Firebase, we can fetch from Firestore 'users' collection
    try {
      const q = query(collection(db, 'users'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
    } catch (e) {
      console.error("Firebase getUserProfile failed, falling back to mock", e);
    }
  }
  
  // Local storage mock
  const users = JSON.parse(localStorage.getItem('ch_users'));
  return users.find(u => u.userId === userId) || users[users.length - 1];
}

// Get the top users sorted by points
export async function getLeaderboard() {
  if (useFirebase) {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list = [];
      querySnapshot.forEach(doc => list.push(doc.data()));
      return list.sort((a, b) => b.points - a.points);
    } catch (e) {
      console.error("Firebase getLeaderboard failed, falling back to mock", e);
    }
  }

  // Local storage mock
  const users = JSON.parse(localStorage.getItem('ch_users'));
  return [...users].sort((a, b) => b.points - a.points);
}

// Fetch all reported incidents
export async function getReports() {
  if (useFirebase) {
    try {
      const querySnapshot = await getDocs(collection(db, 'reports'));
      const list = [];
      querySnapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Firebase getReports failed, falling back to mock", e);
    }
  }

  // Local storage mock
  const reports = JSON.parse(localStorage.getItem('ch_reports'));
  return [...reports].sort((a, b) => b.timestamp - a.timestamp);
}

// Check if a report already exists within a 50m radius
export async function checkDuplicateReport(latitude, longitude, type) {
  const reports = await getReports();
  const duplicate = reports.find(rep => {
    if (rep.type !== type || rep.status === 'fixed') return false;
    const distance = getDistance(latitude, longitude, rep.latitude, rep.longitude);
    return distance <= 50; // 50 meters
  });
  return duplicate || null;
}

// Submit a new civic issue report
export async function submitReport(reportData, imageFile = null) {
  // Check for duplicate first
  const duplicate = await checkDuplicateReport(reportData.latitude, reportData.longitude, reportData.type);
  if (duplicate) {
    throw new Error(`A duplicate active report for this ${reportData.type} already exists within a 50-meter radius! (Reported by @${duplicate.username})`);
  }

  let photoUrl = 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80'; // fallback

  if (imageFile) {
    if (useFirebase && storage) {
      try {
        const storageRef = ref(storage, `reports/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      } catch (e) {
        console.error("Firebase storage upload failed, converting to dataURI", e);
        photoUrl = await readAsDataURL(imageFile);
      }
    } else {
      photoUrl = await readAsDataURL(imageFile);
    }
  }

  const finalReport = {
    title: reportData.title,
    type: reportData.type,
    description: reportData.description,
    latitude: parseFloat(reportData.latitude),
    longitude: parseFloat(reportData.longitude),
    photoUrl: photoUrl,
    status: 'reported',
    timestamp: Date.now(),
    userId: reportData.userId || 'current_user',
    username: reportData.username || 'You (Citizen Hero)'
  };

  if (useFirebase && db) {
    try {
      const docRef = await addDoc(collection(db, 'reports'), finalReport);
      // Give points to user
      await updateUserPoints(finalReport.userId, 50); // +50 points per report
      return { id: docRef.id, ...finalReport };
    } catch (e) {
      console.error("Firebase submitReport failed, using local mock", e);
    }
  }

  // Local storage mock fallback
  const reports = JSON.parse(localStorage.getItem('ch_reports'));
  const newId = `report_${Date.now()}`;
  const savedReport = { id: newId, ...finalReport };
  reports.push(savedReport);
  localStorage.setItem('ch_reports', JSON.stringify(reports));

  // Add points to user
  await updateUserPoints(finalReport.userId, 50);

  return savedReport;
}

// Update report status (admin feature)
export async function updateReportStatus(reportId, newStatus) {
  if (useFirebase && db) {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, { status: newStatus });
      return true;
    } catch (e) {
      console.error("Firebase updateReportStatus failed, using local mock", e);
    }
  }

  // Local storage mock fallback
  const reports = JSON.parse(localStorage.getItem('ch_reports'));
  const reportIndex = reports.findIndex(r => r.id === reportId);
  if (reportIndex !== -1) {
    reports[reportIndex].status = newStatus;
    localStorage.setItem('ch_reports', JSON.stringify(reports));

    // If report is marked fixed, reward the original reporter with extra points
    if (newStatus === 'fixed') {
      const reporterId = reports[reportIndex].userId;
      await updateUserPoints(reporterId, 100); // +100 bonus points for resolution!
    }
    return true;
  }
  return false;
}

// Helper to award points and calculate badge upgrades
async function updateUserPoints(userId, pointsToAdd) {
  if (useFirebase && db) {
    try {
      // Fetch user doc, update points
      // We will also update locally to sync
    } catch (e) {
      console.error("Firebase points update failed", e);
    }
  }

  const users = JSON.parse(localStorage.getItem('ch_users'));
  const userIndex = users.findIndex(u => u.userId === userId);
  if (userIndex !== -1) {
    users[userIndex].points += pointsToAdd;
    
    // Badge upgrading logic based on total points
    const points = users[userIndex].points;
    const currentBadges = users[userIndex].badges;

    if (points >= 100 && !currentBadges.includes('Street Sentinel')) {
      currentBadges.push('Street Sentinel');
    }
    if (points >= 200 && !currentBadges.includes('Municipal Magnet')) {
      currentBadges.push('Municipal Magnet');
    }
    if (points >= 400 && !currentBadges.includes('Grand Architect')) {
      currentBadges.push('Grand Architect');
    }

    users[userIndex].badges = currentBadges;
    localStorage.setItem('ch_users', JSON.stringify(users));
  }
}

// FileReader utility
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
