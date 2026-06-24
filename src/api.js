import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export let supabase = null;
let useSupabase = false;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL") {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    useSupabase = true;
    console.log("Community Hero: Successfully connected to Supabase Backend.");
  } catch (e) {
    console.error("Supabase init failed, switching to LocalMock storage.", e);
  }
} else {
  console.log("Community Hero: Supabase configuration not set. Using LocalStorage Mock Backend.");
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
   AUTHENTICATION (Supabase Auth)
   ========================================================================= */

export async function signUp(email, password, username) {
  if (!useSupabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Create user profile in 'users' table
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        user_id: data.user.id,
        username: username,
        points: 50,
        badges: ['First Responder']
      }]);
    if (profileError) console.error("Error creating user profile:", profileError);
  }
  return data;
}

export async function signIn(email, password) {
  if (email.toLowerCase() === 'admin' && password === 'admin') {
    return { user: { id: 'admin', role: 'admin' } }; // Hardcoded admin for now
  }
  
  if (!useSupabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (useSupabase) {
    await supabase.auth.signOut();
  }
}

export async function getCurrentSession() {
  if (useSupabase) {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
  return null;
}

/* =========================================================================
   UNIFIED PUBLIC SERVICE API
   ========================================================================= */

// Get current user profile (with points and badges)
export async function getUserProfile(userId = 'current_user') {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data && !error) {
        return {
          userId: data.user_id,
          username: data.username,
          points: data.points,
          badges: data.badges || []
        };
      }
    } catch (e) {
      console.error("Supabase getUserProfile failed, falling back to mock", e);
    }
  }
  
  // Local storage mock
  const users = JSON.parse(localStorage.getItem('ch_users'));
  return users.find(u => u.userId === userId) || users[users.length - 1];
}

// Get the top users sorted by points
export async function getLeaderboard() {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('points', { ascending: false });
        
      if (data && !error) {
        return data.map(d => ({
          userId: d.user_id,
          username: d.username,
          points: d.points,
          badges: d.badges || []
        }));
      }
    } catch (e) {
      console.error("Supabase getLeaderboard failed, falling back to mock", e);
    }
  }

  // Local storage mock
  const users = JSON.parse(localStorage.getItem('ch_users'));
  return [...users].sort((a, b) => b.points - a.points);
}

// Fetch all reported incidents
export async function getReports() {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });
        
      if (data && !error) {
        return data.map(d => ({
          id: d.id,
          title: d.title,
          type: d.type,
          description: d.description,
          latitude: d.latitude,
          longitude: d.longitude,
          photoUrl: d.photo_url,
          status: d.status,
          timestamp: d.timestamp,
          userId: d.user_id,
          username: d.username
        }));
      }
    } catch (e) {
      console.error("Supabase getReports failed, falling back to mock", e);
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
    if (useSupabase) {
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `reports/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('community_hero_bucket')
          .upload(filePath, imageFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('community_hero_bucket')
            .getPublicUrl(filePath);
          photoUrl = data.publicUrl;
        } else {
          photoUrl = await readAsDataURL(imageFile);
        }
      } catch (e) {
        console.error("Supabase storage upload failed, converting to dataURI", e);
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
    photo_url: photoUrl,
    status: 'reported',
    timestamp: Date.now(),
    user_id: reportData.userId || 'current_user',
    username: reportData.username || 'You (Citizen Hero)'
  };

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([finalReport])
        .select()
        .single();
        
      if (data && !error) {
        await updateUserPoints(finalReport.user_id, 50); // +50 points per report
        return {
          id: data.id,
          title: data.title,
          type: data.type,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          photoUrl: data.photo_url,
          status: data.status,
          timestamp: data.timestamp,
          userId: data.user_id,
          username: data.username
        };
      }
    } catch (e) {
      console.error("Supabase submitReport failed, using local mock", e);
    }
  }

  // Local storage mock fallback
  const reports = JSON.parse(localStorage.getItem('ch_reports'));
  const newId = `report_${Date.now()}`;
  const savedReport = { 
    id: newId, 
    ...finalReport,
    photoUrl: finalReport.photo_url,
    userId: finalReport.user_id
  };
  reports.push(savedReport);
  localStorage.setItem('ch_reports', JSON.stringify(reports));

  // Add points to user
  await updateUserPoints(finalReport.user_id, 50);

  return savedReport;
}

// Update report status (admin feature)
export async function updateReportStatus(reportId, newStatus) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId)
        .select()
        .single();
        
      if (data && !error) {
        if (newStatus === 'fixed') {
          await updateUserPoints(data.user_id, 100);
        }
        return true;
      }
    } catch (e) {
      console.error("Supabase updateReportStatus failed, using local mock", e);
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
  if (useSupabase) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('points, badges')
        .eq('user_id', userId)
        .single();
        
      if (user) {
        let newPoints = user.points + pointsToAdd;
        let currentBadges = user.badges || [];
        
        if (newPoints >= 100 && !currentBadges.includes('Street Sentinel')) currentBadges.push('Street Sentinel');
        if (newPoints >= 200 && !currentBadges.includes('Municipal Magnet')) currentBadges.push('Municipal Magnet');
        if (newPoints >= 400 && !currentBadges.includes('Grand Architect')) currentBadges.push('Grand Architect');
        
        await supabase
          .from('users')
          .update({ points: newPoints, badges: currentBadges })
          .eq('user_id', userId);
      }
    } catch (e) {
      console.error("Supabase points update failed", e);
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
