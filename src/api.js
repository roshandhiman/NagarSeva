import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export let supabase = null;
export let useSupabase = false;

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
  {
    userId: 'user1',
    username: 'AmanRoy',
    points: 420,
    badges: ['Pioneer', 'Pothole Slayer', 'Street Sentinel', 'Municipal Magnet'],
    bio: 'Civic-minded engineer based in Chandigarh. Passionate about road safety and pothole reporting.'
  },
  {
    userId: 'user2',
    username: 'PriyaSharma',
    points: 280,
    badges: ['Eco Warrior', 'Street Sentinel'],
    bio: 'Environmental volunteer in Delhi. Dedicated to waste management and clean neighborhood parks.'
  },
  {
    userId: 'user3',
    username: 'KabirSingh',
    points: 190,
    badges: ['Leak Watcher', 'First Responder'],
    bio: 'Active citizen from Chandigarh outskirts. Love organizing clean-up drives and reporting water leaks.'
  },
  {
    userId: 'user4',
    username: 'DivyaPatel',
    points: 150,
    badges: ['Novice', 'First Responder'],
    bio: 'Student activist helping keep Sector 15 green and clean. Always ready to raise alerts for community issues.'
  },
  {
    userId: 'user5',
    username: 'RohanSharma',
    points: 95,
    badges: ['First Responder'],
    bio: 'Resident of Chandigarh. Enthusiastic helper reporting electrical and public hazards.'
  },
  {
    userId: 'current_user',
    username: 'You (Citizen Hero)',
    points: 40,
    badges: ['First Responder'],
    bio: 'Proud community member reporting issues to keep our streets safe and clean.'
  }
];

// Preseeded Mock Reports
const MOCK_REPORTS = [
  {
    id: 'report_1',
    title: 'Deep hazardous pothole near Sector 17 Market',
    type: 'pothole',
    description: 'A deep pothole right at the entry curve of Sector 17 Market. It is extremely dangerous for two-wheelers during night time.',
    latitude: 30.7398,
    longitude: 76.7827,
    photoUrl: '/mock_images/pothole_before.png',
    status: 'fixed',
    timestamp: Date.now() - 3600000 * 48, // 48 hours ago
    userId: 'user1',
    username: 'AmanRoy',
    solvedPhotoUrl: '/mock_images/pothole_after.png',
    solvedAt: Date.now() - 3600000 * 18, // 18 hours ago
    comments: [
      { username: 'KabirSingh', text: 'Spotted this too, glad you reported it Aman. Thanks!', timestamp: Date.now() - 3600000 * 40 },
      { username: 'AmanRoy', text: 'Yes, it was causing major issues. Glad the municipal corp resolved it within a day!', timestamp: Date.now() - 3600000 * 17 },
      { username: 'PriyaSharma', text: 'Wow, that patch looks very solid and neat. Great job team.', timestamp: Date.now() - 3600000 * 15 },
      {
        username: 'Municipal Board',
        text: 'Official Resolution Update: This issue has been successfully resolved and fixed! Thank you for keeping our community safe.',
        photoUrl: '/mock_images/pothole_after.png',
        timestamp: Date.now() - 3600000 * 18
      }
    ]
  },
  {
    id: 'report_2',
    title: 'Overflowing garbage bin near Sector 22 Plaza',
    type: 'garbage',
    description: 'The main trash bin near Sector 22 shopping plaza is overflowing with commercial waste. Stray animals are scattering trash across the street.',
    latitude: 30.7295,
    longitude: 76.7645,
    photoUrl: '/mock_images/garbage_bin.png',
    status: 'reported',
    timestamp: Date.now() - 3600000 * 3, // 3 hours ago
    userId: 'user2',
    username: 'PriyaSharma',
    comments: [
      { username: 'RohanSharma', text: 'Just walked by and it smells awful. I have registered a complaint too.', timestamp: Date.now() - 3600000 * 2 },
      { username: 'DivyaPatel', text: 'This dumpster needs daily clearing, especially on weekends.', timestamp: Date.now() - 3600000 * 1 }
    ]
  },
  {
    id: 'report_3',
    title: 'Drinking water pipe leakage on Sector 35 Outer road',
    type: 'leakage',
    description: 'A major leakage in the main supply pipe is wasting thousands of gallons of clean drinking water. Water has accumulated on the side road.',
    latitude: 30.7225,
    longitude: 76.7510,
    photoUrl: '/mock_images/leakage_before.png',
    status: 'fixed',
    timestamp: Date.now() - 3600000 * 72, // 3 days ago
    userId: 'user3',
    username: 'KabirSingh',
    solvedPhotoUrl: '/mock_images/leakage_after.png',
    solvedAt: Date.now() - 3600000 * 36, // 36 hours ago
    comments: [
      { username: 'AmanRoy', text: 'This is a serious waste. Hope the water supply division is informed.', timestamp: Date.now() - 3600000 * 60 },
      { username: 'KabirSingh', text: 'I called their hotline right after posting here. They arrived in a few hours and repaired the main seal!', timestamp: Date.now() - 3600000 * 35 },
      {
        username: 'Municipal Board',
        text: 'Official Resolution Update: This issue has been successfully resolved and fixed! Thank you for keeping our community safe.',
        photoUrl: '/mock_images/leakage_after.png',
        timestamp: Date.now() - 3600000 * 36
      }
    ]
  },
  {
    id: 'report_4',
    title: 'Exposed high-voltage wires on street lamp post',
    type: 'hazard',
    description: 'The base panel of the street lamp post at the Sector 8 crossing is completely open, exposing live electrical wires at a height children can touch.',
    latitude: 30.7512,
    longitude: 76.7932,
    photoUrl: '/mock_images/exposed_wires.png',
    status: 'review',
    timestamp: Date.now() - 3600000 * 5, // 5 hours ago
    userId: 'user5',
    username: 'RohanSharma',
    comments: [
      { username: 'AmanRoy', text: 'This is extremely hazardous! Especially with the monsoon rain starting.', timestamp: Date.now() - 3600000 * 4 },
      { username: 'KabirSingh', text: 'Adding a plastic wrap marker so people stay away. Hope they fix this on high priority!', timestamp: Date.now() - 3600000 * 3 }
    ]
  }
];

// Helper to initialize local storage
function initLocalMock() {
  const seedKey = 'ch_mock_seeded_v5';
  if (localStorage.getItem(seedKey) !== 'true') {
    localStorage.removeItem('ch_users');
    localStorage.removeItem('ch_reports');
    localStorage.removeItem('ch_local_bios'); // clear custom local bios so we use fresh seed
    localStorage.setItem(seedKey, 'true');
  }

  if (!localStorage.getItem('ch_users')) {
    localStorage.setItem('ch_users', JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem('ch_reports')) {
    localStorage.setItem('ch_reports', JSON.stringify(MOCK_REPORTS));
  } else {
    const current = JSON.parse(localStorage.getItem('ch_reports')) || [];
    let updated = false;
    current.forEach(r => {
      if (!r.comments) {
        r.comments = [];
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('ch_reports', JSON.stringify(current));
    }
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
    const profileData = {
      user_id: data.user.id,
      username: username,
      points: 50,
      badges: ['First Responder']
    };
    
    try {
      // Try including email in the profile insertion
      const { error: profileError } = await supabase
        .from('users')
        .insert([{ ...profileData, email }]);
        
      if (profileError) {
        // If the email column doesn't exist on public.users table, fallback to insert without email
        if (profileError.message.includes('column') || profileError.code === '42703') {
          console.warn("email column does not exist on users table, retrying insert without email");
          const { error: fallbackError } = await supabase
            .from('users')
            .insert([profileData]);
          if (fallbackError) console.error("Error creating user profile (fallback):", fallbackError);
        } else {
          console.error("Error creating user profile:", profileError);
        }
      }
    } catch (e) {
      console.error("Failed to insert user profile:", e);
    }
  }
  return data;
}

export async function signIn(emailOrUsername, password) {
  if (emailOrUsername.toLowerCase() === 'admin' && password === 'admin') {
    return { user: { id: 'admin', role: 'admin' } }; // Hardcoded admin for now
  }
  
  if (!useSupabase) throw new Error("Supabase is not configured.");
  
  let email = emailOrUsername;
  
  // If it's not a valid email format, assume it is a username and look up their email from the DB
  if (!emailOrUsername.includes('@')) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('username', emailOrUsername)
        .maybeSingle();
        
      if (data && data.email) {
        email = data.email;
      } else {
        // If username exists but no email is stored, throw a specific message
        const { data: userExists } = await supabase
          .from('users')
          .select('username')
          .eq('username', emailOrUsername)
          .maybeSingle();
          
        if (userExists) {
          throw new Error(`Username login is not supported yet for your account because your email is not linked. Please sign in using your full email address.`);
        } else {
          throw new Error(`No account found with username or email "${emailOrUsername}".`);
        }
      }
    } catch (err) {
      console.error("Username email lookup failed:", err);
      if (err.message.includes('column') || err.message.includes('does not exist')) {
        throw new Error(`To log in with username, please use your email address, or run the SQL command: 'ALTER TABLE public.users ADD COLUMN email TEXT;' in your Supabase SQL editor.`);
      }
      throw err;
    }
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function ensureUserProfile(userId, email) {
  if (!useSupabase) return null;
  
  // Check if profile exists
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching user profile in ensureUserProfile:", error);
    return null;
  }
  
  if (!profile) {
    // Profile does not exist, create it!
    const username = email ? email.split('@')[0] : 'citizen_' + Math.random().toString(36).substring(2, 7);
    const profileData = {
      user_id: userId,
      username: username,
      points: 50,
      badges: ['First Responder']
    };
    
    let createdProfile = null;
    
    try {
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert([{ ...profileData, email }])
        .select()
        .single();
        
      if (createError) {
        if (createError.message.includes('column') || createError.code === '42703') {
          console.warn("email column does not exist on users table, retrying profile creation without email");
          const { data: fallbackProfile, error: fallbackError } = await supabase
            .from('users')
            .insert([profileData])
            .select()
            .single();
          if (!fallbackError) {
            createdProfile = fallbackProfile;
          } else {
            console.error("Error creating user profile (fallback):", fallbackError);
          }
        } else {
          console.error("Error creating user profile:", createError);
        }
      } else {
        createdProfile = newProfile;
      }
    } catch (e) {
      console.error("Failed to insert user profile in ensureUserProfile:", e);
    }
    
    if (createdProfile) {
      return {
        userId: createdProfile.user_id,
        username: createdProfile.username,
        points: createdProfile.points,
        badges: createdProfile.badges || []
      };
    }
    return null;
  }
  
  return {
    userId: profile.user_id,
    username: profile.username,
    points: profile.points,
    badges: profile.badges || []
  };
}

export async function signInWithGoogle() {
  if (!useSupabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/dashboard.html'
    }
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
  if (useSupabase && userId !== 'current_user' && !userId.startsWith('user') && userId !== 'admin') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data && !error) {
        // Read local bio fallback if column doesn't exist on Supabase users table
        const localBios = JSON.parse(localStorage.getItem('ch_local_bios') || '{}');
        const savedBio = localBios[userId] || data.bio || "";

        return {
          userId: data.user_id,
          username: data.username,
          points: data.points,
          badges: data.badges || [],
          bio: savedBio
        };
      }
    } catch (e) {
      console.error("Supabase getUserProfile failed, falling back to mock", e);
    }
  }
  
  // Local storage mock
  const users = JSON.parse(localStorage.getItem('ch_users') || '[]');
  const found = users.find(u => u.userId === userId) || users[users.length - 1];
  if (found) {
    if (!found.bio) found.bio = "";
    return found;
  }
  
  // Dynamic mock user fallback
  return {
    userId: userId,
    username: 'citizen_' + userId.substring(0, 5),
    points: 50,
    badges: ['First Responder'],
    bio: ""
  };
}

// Update user profile information
export async function updateUserProfile(userId, { username, bio }) {
  if (useSupabase && userId !== 'current_user' && !userId.startsWith('user') && userId !== 'admin') {
    try {
      // 1. Try updating both username and bio
      const { data, error } = await supabase
        .from('users')
        .update({ username, bio })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (data && !error) {
        return {
          userId: data.user_id,
          username: data.username,
          points: data.points,
          badges: data.badges || [],
          bio: data.bio || ""
        };
      } else if (error && (error.message.includes('column') || error.code === '42703')) {
        console.warn("bio column does not exist on users table, retrying update with username only");
        
        // 2. Try updating username only
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .update({ username })
          .eq('user_id', userId)
          .select()
          .single();

        if (retryData && !retryError) {
          // Save bio locally since database schema doesn't have it
          const localBios = JSON.parse(localStorage.getItem('ch_local_bios') || '{}');
          localBios[userId] = bio;
          localStorage.setItem('ch_local_bios', JSON.stringify(localBios));

          return {
            userId: retryData.user_id,
            username: retryData.username,
            points: retryData.points,
            badges: retryData.badges || [],
            bio: bio
          };
        }
      }
    } catch (e) {
      console.error("Supabase updateUserProfile failed", e);
    }
  }

  // Local storage mock fallback
  const users = JSON.parse(localStorage.getItem('ch_users') || '[]');
  let userIndex = users.findIndex(u => u.userId === userId);
  
  if (userIndex === -1) {
    const newUser = {
      userId: userId,
      username: username,
      points: 50,
      badges: ['First Responder'],
      bio: bio
    };
    users.push(newUser);
    localStorage.setItem('ch_users', JSON.stringify(users));
    userIndex = users.length - 1;
  } else {
    users[userIndex].username = username;
    users[userIndex].bio = bio;
    localStorage.setItem('ch_users', JSON.stringify(users));
  }

  // Update active session metadata
  const session = JSON.parse(localStorage.getItem('ch_session'));
  if (session && session.userId === userId) {
    session.username = username;
    localStorage.setItem('ch_session', JSON.stringify(session));
  }

  return users[userIndex];
}

// Helper to check if current session should bypass Supabase (e.g. citizen login bypass)
function shouldBypassSupabase() {
  try {
    const session = JSON.parse(localStorage.getItem('ch_session') || 'null');
    // Admin bypass does NOT bypass Supabase if connected so they can manage live data
    if (session && (session.userId === 'current_user' || (session.userId && session.userId.startsWith('user')))) {
      return true;
    }
  } catch (e) {
    console.error("Error reading session for shouldBypassSupabase", e);
  }
  return false;
}

// Get the top users sorted by points
export async function getLeaderboard() {
  if (useSupabase && !shouldBypassSupabase()) {
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
  if (useSupabase && !shouldBypassSupabase()) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });
        
      if (data && !error) {
        const seenIds = new Set();
        const seenTitles = new Set();
        const uniqueReports = [];
        data.forEach(d => {
          // Deduplicate by title to collapse double-inserts from seeder runs with varying timestamps
          const titleKey = d.title ? d.title.trim().toLowerCase() : '';
          if (!seenIds.has(d.id) && !seenTitles.has(titleKey)) {
            seenIds.add(d.id);
            seenTitles.add(titleKey);
            uniqueReports.push({
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
              username: d.username,
              solvedPhotoUrl: d.solved_photo_url || null,
              solvedAt: d.solved_at || null,
              comments: d.comments || []
            });
          }
        });
        return uniqueReports;
      }
    } catch (e) {
      console.error("Supabase getReports failed, falling back to mock", e);
    }
  }

  // Local storage mock
  const reports = JSON.parse(localStorage.getItem('ch_reports')) || [];
  const seenIds = new Set();
  const seenTitles = new Set();
  const uniqueReports = [];
  reports.forEach(r => {
    const titleKey = r.title ? r.title.trim().toLowerCase() : '';
    if (!seenIds.has(r.id) && !seenTitles.has(titleKey)) {
      seenIds.add(r.id);
      seenTitles.add(titleKey);
      uniqueReports.push(r);
    }
  });
  return uniqueReports.sort((a, b) => b.timestamp - a.timestamp);
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
    if (useSupabase && !shouldBypassSupabase()) {
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

  if (useSupabase && !shouldBypassSupabase()) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([finalReport])
        .select()
        .single();
        
      if (error) {
        console.error("Supabase submitReport insert error:", error);
        throw new Error(`Failed to save report to database: ${error.message}`);
      }
        
      if (data) {
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
      console.error("Supabase submitReport failed", e);
      throw e;
    }
  } else {
    // Local storage mock fallback
    const reports = JSON.parse(localStorage.getItem('ch_reports'));
    const newId = `report_${Date.now()}`;
    const savedReport = { 
      id: newId, 
      ...finalReport,
      photoUrl: finalReport.photo_url,
      userId: finalReport.user_id,
      comments: [],
      solvedPhotoUrl: null,
      solvedAt: null
    };
    reports.push(savedReport);
    localStorage.setItem('ch_reports', JSON.stringify(reports));

    // Add points to user
    await updateUserPoints(finalReport.user_id, 50);

    return savedReport;
  }
}

// Update report status (admin feature)
export async function updateReportStatus(reportId, newStatus, solvedImageFile = null) {
  let solvedPhotoUrl = null;
  let solvedAt = null;

  if (newStatus === 'fixed') {
    solvedAt = Date.now();
    if (solvedImageFile) {
      if (useSupabase && !shouldBypassSupabase() && !reportId.startsWith('report_')) {
        try {
          const fileExt = solvedImageFile.name.split('.').pop();
          const fileName = `${Date.now()}_solved_${Math.random()}.${fileExt}`;
          const filePath = `reports/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('community_hero_bucket')
            .upload(filePath, solvedImageFile);

          if (!uploadError) {
            const { data } = supabase.storage
              .from('community_hero_bucket')
              .getPublicUrl(filePath);
            solvedPhotoUrl = data.publicUrl;
          } else {
            solvedPhotoUrl = await readAsDataURL(solvedImageFile);
          }
        } catch (e) {
          console.error("Supabase solved storage upload failed, converting to dataURI", e);
          solvedPhotoUrl = await readAsDataURL(solvedImageFile);
        }
      } else {
        solvedPhotoUrl = await readAsDataURL(solvedImageFile);
      }
    }
  }

  if (useSupabase && !shouldBypassSupabase() && !reportId.startsWith('report_')) {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'fixed') {
        updateData.solved_at = solvedAt;
        if (solvedPhotoUrl) {
          updateData.solved_photo_url = solvedPhotoUrl;
        }
      }

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase updateReportStatus error:", error);
        throw new Error(`Failed to update report status in database: ${error.message}`);
      }
        
      if (data) {
        if (newStatus === 'fixed') {
          await updateUserPoints(data.user_id, 100);

          // Auto-post official resolution comment from admin on the post with the fixed image URL
          try {
            const { data: reportData, error: checkError } = await supabase
              .from('reports')
              .select('comments')
              .eq('id', reportId)
              .single();

            if (checkError) throw checkError;

            if (reportData) {
              const currentComments = reportData.comments || [];
              const adminComment = {
                username: 'Municipal Board',
                text: 'Official Resolution Update: This issue has been successfully resolved and fixed! Thank you for keeping our community safe.',
                photoUrl: solvedPhotoUrl,
                timestamp: Date.now()
              };
              const { error: commentUpdateErr } = await supabase
                .from('reports')
                .update({ comments: [...currentComments, adminComment] })
                .eq('id', reportId);
              if (commentUpdateErr) throw commentUpdateErr;
            }
          } catch (commentErr) {
            console.warn("Could not auto-post resolution comment:", commentErr);
          }
        }
        return true;
      }
    } catch (e) {
      console.error("Supabase updateReportStatus failed", e);
      throw e;
    }
  } else {
    // Local storage mock fallback
    const reports = JSON.parse(localStorage.getItem('ch_reports'));
    const reportIndex = reports.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      reports[reportIndex].status = newStatus;
      if (newStatus === 'fixed') {
        reports[reportIndex].solvedAt = solvedAt;
        if (solvedPhotoUrl) {
          reports[reportIndex].solvedPhotoUrl = solvedPhotoUrl;
        }
        
        // Auto-post official admin comment with solved photo in LocalStorage mock
        if (!reports[reportIndex].comments) {
          reports[reportIndex].comments = [];
        }
        reports[reportIndex].comments.push({
          username: 'Municipal Board',
          text: 'Official Resolution Update: This issue has been successfully resolved and fixed! Thank you for keeping our community safe.',
          photoUrl: solvedPhotoUrl,
          timestamp: Date.now()
        });
      }
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
}

// Add comment to a report
export async function addReportComment(reportId, username, text) {
  const newComment = {
    username,
    text,
    timestamp: Date.now()
  };

  if (useSupabase && !shouldBypassSupabase() && !reportId.startsWith('report_')) {
    // Fetch current comments first
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('comments')
      .eq('id', reportId)
      .single();

    if (fetchError) {
      console.error("Supabase addReportComment fetch error:", fetchError);
      throw new Error(`Failed to fetch comments: ${fetchError.message}`);
    }

    if (report) {
      const currentComments = report.comments || [];
      const updatedComments = [...currentComments, newComment];

      const { data, error } = await supabase
        .from('reports')
        .update({ comments: updatedComments })
        .eq('id', reportId)
        .select()
        .single();

      if (error) {
        console.error("Supabase addReportComment update error:", error);
        throw new Error(`Failed to save comment: ${error.message}`);
      }

      if (data) {
        return data.comments;
      }
    }
  } else {
    // Local storage mock fallback
    const reports = JSON.parse(localStorage.getItem('ch_reports'));
    const reportIndex = reports.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      if (!reports[reportIndex].comments) {
        reports[reportIndex].comments = [];
      }
      reports[reportIndex].comments.push(newComment);
      localStorage.setItem('ch_reports', JSON.stringify(reports));
      return reports[reportIndex].comments;
    }
    return [];
  }
}

// Helper to award points and calculate badge upgrades
async function updateUserPoints(userId, pointsToAdd) {
  if (useSupabase && userId !== 'current_user' && !userId.startsWith('user') && userId !== 'admin') {
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
