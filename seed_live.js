import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import ws from 'ws';

// Read VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL\s*=\s*(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("No Supabase URL/Key found in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: ws
  }
});

// Mock Image Details
const MOCK_IMAGES = [
  { key: 'pothole_before', localPath: 'public/mock_images/pothole_before.png', dbPath: 'mock/pothole_before.png' },
  { key: 'pothole_after', localPath: 'public/mock_images/pothole_after.png', dbPath: 'mock/pothole_after.png' },
  { key: 'garbage_bin', localPath: 'public/mock_images/garbage_bin.png', dbPath: 'mock/garbage_bin.png' },
  { key: 'leakage_before', localPath: 'public/mock_images/leakage_before.png', dbPath: 'mock/leakage_before.png' },
  { key: 'leakage_after', localPath: 'public/mock_images/leakage_after.png', dbPath: 'mock/leakage_after.png' },
  { key: 'exposed_wires', localPath: 'public/mock_images/exposed_wires.png', dbPath: 'mock/exposed_wires.png' }
];

const missingColumns = {
  users: new Set(),
  reports: new Set()
};

async function insertWithFallback(tableName, row, identifier) {
  let attempt = { ...row };
  while (true) {
    // Use upsert for users to avoid duplicate key issues
    const { error } = tableName === 'users' 
      ? await supabase.from(tableName).upsert([attempt], { onConflict: 'user_id' })
      : await supabase.from(tableName).insert([attempt]);

    if (!error) {
      console.log(`Successfully seeded ${tableName} record: ${identifier}`);
      return true;
    }

    // Try to match missing column errors (Supabase API or Postgres native)
    const errorMsg = error.message || "";
    const missingColMatch = errorMsg.match(/Could not find the '(.+)' column/i) || 
                            errorMsg.match(/column "(.+)" of relation/i) ||
                            errorMsg.match(/column "(.+)" does not exist/i) ||
                            errorMsg.match(/column '(.+)' does not exist/i);

    if (missingColMatch) {
      const col = missingColMatch[1];
      console.warn(`Column '${col}' does not exist in table '${tableName}'. Removing and retrying...`);
      delete attempt[col];
      missingColumns[tableName].add(col);
    } else {
      console.error(`Failed to insert into ${tableName}:`, errorMsg);
      return false;
    }
  }
}

async function run() {
  console.log("=== Starting Live Supabase Seeding with Fallbacks ===");

  // 1. Upload images to Supabase storage bucket
  const imageUrls = {};
  for (const img of MOCK_IMAGES) {
    if (!fs.existsSync(img.localPath)) {
      console.warn(`Local file ${img.localPath} does not exist, skipping upload.`);
      continue;
    }
    console.log(`Uploading ${img.key} to Storage...`);
    const fileBuffer = fs.readFileSync(img.localPath);
    const { error: uploadError } = await supabase.storage
      .from('community_hero_bucket')
      .upload(img.dbPath, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error(`Error uploading ${img.key}:`, uploadError.message);
    }

    const { data } = supabase.storage
      .from('community_hero_bucket')
      .getPublicUrl(img.dbPath);
    
    imageUrls[img.key] = data.publicUrl;
  }

  // Define Mock Users
  const targetUsernames = ['AmanRoy', 'PriyaSharma', 'KabirSingh', 'DivyaPatel', 'RohanSharma'];
  const MOCK_USERS_DATA = [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      username: 'AmanRoy',
      points: 420,
      badges: ['Pioneer', 'Pothole Slayer', 'Street Sentinel', 'Municipal Magnet'],
      bio: 'Civic-minded engineer based in Chandigarh. Passionate about road safety and pothole reporting.'
    },
    {
      user_id: '00000000-0000-0000-0000-000000000002',
      username: 'PriyaSharma',
      points: 280,
      badges: ['Eco Warrior', 'Street Sentinel'],
      bio: 'Environmental volunteer in Delhi. Dedicated to waste management and clean neighborhood parks.'
    },
    {
      user_id: '00000000-0000-0000-0000-000000000003',
      username: 'KabirSingh',
      points: 190,
      badges: ['Leak Watcher', 'First Responder'],
      bio: 'Active citizen from Chandigarh outskirts. Love organizing clean-up drives and reporting water leaks.'
    },
    {
      user_id: '00000000-0000-0000-0000-000000000004',
      username: 'DivyaPatel',
      points: 150,
      badges: ['Novice', 'First Responder'],
      bio: 'Student activist helping keep Sector 15 green and clean. Always ready to raise alerts for community issues.'
    },
    {
      user_id: '00000000-0000-0000-0000-000000000005',
      username: 'RohanSharma',
      points: 95,
      badges: ['First Responder'],
      bio: 'Resident of Chandigarh. Enthusiastic helper reporting electrical and public hazards.'
    }
  ];

  // 2. Clean up existing mock users & reports
  console.log("Cleaning up old mock records...");
  await supabase.from('reports').delete().in('username', targetUsernames);
  await supabase.from('users').delete().in('username', targetUsernames);

  // 3. Insert mock users
  console.log("Seeding mock users...");
  for (const user of MOCK_USERS_DATA) {
    await insertWithFallback('users', user, user.username);
  }

  // 4. Define Mock Reports
  const now = Date.now();
  const MOCK_REPORTS_DATA = [
    {
      title: 'Deep hazardous pothole near Sector 17 Market',
      type: 'pothole',
      description: 'A deep pothole right at the entry curve of Sector 17 Market. It is extremely dangerous for two-wheelers during night time.',
      latitude: 30.7398,
      longitude: 76.7827,
      photo_url: imageUrls['pothole_before'] || '/mock_images/pothole_before.png',
      status: 'fixed',
      timestamp: now - 3600000 * 48,
      user_id: '00000000-0000-0000-0000-000000000001',
      username: 'AmanRoy',
      solved_photo_url: imageUrls['pothole_after'] || '/mock_images/pothole_after.png',
      solved_at: now - 3600000 * 18,
      comments: [
        { username: 'KabirSingh', text: 'Spotted this too, glad you reported it Aman. Thanks!', timestamp: now - 3600000 * 40 },
        { username: 'AmanRoy', text: 'Yes, it was causing major issues. Glad the municipal corp resolved it within a day!', timestamp: now - 3600000 * 17 },
        { username: 'PriyaSharma', text: 'Wow, that patch looks very solid and neat. Great job team.', timestamp: now - 3600000 * 15 },
        {
          username: 'Municipal Board',
          text: 'Official Resolution Update: This issue has been successfully resolved and fixed! Thank you for keeping our community safe.',
          photoUrl: imageUrls['pothole_after'] || '/mock_images/pothole_after.png',
          timestamp: now - 3600000 * 18
        }
      ]
    },
    {
      title: 'Overflowing garbage bin near Sector 22 Plaza',
      type: 'garbage',
      description: 'The main trash bin near Sector 22 shopping plaza is overflowing with commercial waste. Stray animals are scattering trash across the street.',
      latitude: 30.7295,
      longitude: 76.7645,
      photo_url: imageUrls['garbage_bin'] || '/mock_images/garbage_bin.png',
      status: 'reported',
      timestamp: now - 3600000 * 3,
      user_id: '00000000-0000-0000-0000-000000000002',
      username: 'PriyaSharma',
      comments: [
        { username: 'RohanSharma', text: 'Just walked by and it smells awful. I have registered a complaint too.', timestamp: now - 3600000 * 2 },
        { username: 'DivyaPatel', text: 'This dumpster needs daily clearing, especially on weekends.', timestamp: now - 3600000 * 1 }
      ]
    },
    {
      title: 'Drinking water pipe leakage on Sector 35 Outer road',
      type: 'leakage',
      description: 'A major leakage in the main supply pipe is wasting thousands of gallons of clean drinking water. Water has accumulated on the side road.',
      latitude: 30.7225,
      longitude: 76.7510,
      photo_url: imageUrls['leakage_before'] || '/mock_images/leakage_before.png',
      status: 'fixed',
      timestamp: now - 3600000 * 72,
      user_id: '00000000-0000-0000-0000-000000000003',
      username: 'KabirSingh',
      solved_photo_url: imageUrls['leakage_after'] || '/mock_images/leakage_after.png',
      solved_at: now - 3600000 * 36,
      comments: [
        { username: 'AmanRoy', text: 'This is a serious waste. Hope the water supply division is informed.', timestamp: now - 3600000 * 60 },
        { username: 'KabirSingh', text: 'I called their hotline right after posting here. They arrived in a few hours and repaired the main seal!', timestamp: now - 3600000 * 35 },
        {
          username: 'Municipal Board',
          text: 'Official Resolution Update: This issue has been successfully resolved and fixed! Thank you for keeping our community safe.',
          photoUrl: imageUrls['leakage_after'] || '/mock_images/leakage_after.png',
          timestamp: now - 3600000 * 36
        }
      ]
    },
    {
      title: 'Exposed high-voltage wires on street lamp post',
      type: 'hazard',
      description: 'The base panel of the street lamp post at the Sector 8 crossing is completely open, exposing live electrical wires at a height children can touch.',
      latitude: 30.7512,
      longitude: 76.7932,
      photo_url: imageUrls['exposed_wires'] || '/mock_images/exposed_wires.png',
      status: 'review',
      timestamp: now - 3600000 * 5,
      user_id: '00000000-0000-0000-0000-000000000005',
      username: 'RohanSharma',
      comments: [
        { username: 'AmanRoy', text: 'This is extremely hazardous! Especially with the monsoon rain starting.', timestamp: now - 3600000 * 4 },
        { username: 'KabirSingh', text: 'Adding a plastic wrap marker so people stay away. Hope they fix this on high priority!', timestamp: now - 3600000 * 3 }
      ]
    }
  ];

  // 5. Insert mock reports
  console.log("Seeding mock reports...");
  for (const report of MOCK_REPORTS_DATA) {
    await insertWithFallback('reports', report, report.title);
  }

  console.log("\n=== Seeding Completion Summary ===");
  const missingUsers = Array.from(missingColumns.users);
  const missingReports = Array.from(missingColumns.reports);

  if (missingUsers.length > 0 || missingReports.length > 0) {
    console.log("\n[ACTION REQUIRED] Some columns are missing in your remote Supabase database.");
    console.log("To fully enable user bios, resolved before/after comparisons, and post comments on the live site,");
    console.log("please copy and run the following SQL commands in your Supabase SQL Editor:\n");
    
    if (missingUsers.includes('bio')) {
      console.log("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;");
    }
    if (missingReports.includes('comments')) {
      console.log("ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;");
    }
    if (missingReports.includes('solved_photo_url')) {
      console.log("ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS solved_photo_url TEXT;");
    }
    if (missingReports.includes('solved_at')) {
      console.log("ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS solved_at BIGINT;");
    }
    console.log("");
  } else {
    console.log("All records successfully seeded with all column features intact!");
  }
}

run();
