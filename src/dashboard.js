import './style.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase, useSupabase, getUserProfile, getLeaderboard, getReports, submitReport, updateReportStatus, signIn, signUp, signOut, getCurrentSession, signInWithGoogle, ensureUserProfile, addReportComment, updateUserProfile } from './api.js';
import { initCursor } from './cursor.js';
import { initChatbot, setChatReports, checkDuplicateReport } from './ai.js';

// Initialize custom cursor on this page
initCursor();

// Fix Leaflet marker path assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// App State
let map = null;
let modalMap = null;
let modalMarker = null;
let currentUserLat = null;
let currentUserLng = null;
let userReports = [];
let allReports = [];
let currentUser = null;
let activeMarkers = [];
let session = null;
let isMapInitiallyCentered = false;

// DOM Elements - Layout
const loginWrapper = document.getElementById('login-wrapper');
const dashboardContainer = document.getElementById('dashboard-container');
const btnLogout = document.getElementById('btn-logout');

// DOM Elements - Forms & Toggles
const loginFormState = document.getElementById('login-form-state');
const signupFormState = document.getElementById('signup-form-state');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const linkGoToSignup = document.getElementById('link-go-to-signup');
const linkGoToLogin = document.getElementById('link-go-to-login');
const btnToggleLoginPass = document.getElementById('btn-toggle-login-pass');
const btnToggleSignupPass = document.getElementById('btn-toggle-signup-pass');
const btnLoginGoogle = document.getElementById('btn-login-google');
const btnSignupGoogle = document.getElementById('btn-signup-google');

// DOM Elements - Citizen Dashboard
const userCard = document.getElementById('user-card');
const reportsGrid = document.getElementById('reports-grid');
const reportsCountBadge = document.getElementById('reports-count-badge');
const leaderboardList = document.getElementById('leaderboard-list');
const btnQuickReport = document.getElementById('btn-quick-report');
const btnLocateMe = document.getElementById('btn-locate-me');
const citizenSectionsGrid = document.getElementById('citizen-sections-grid');

// DOM Elements - Admin Dashboard
const adminStatsRow = document.getElementById('admin-stats-row');
const adminReportsSection = document.getElementById('admin-reports-section');
const adminReportsGrid = document.getElementById('admin-reports-grid');
const adminReportsCount = document.getElementById('admin-reports-count');
const adminSyncIndicator = document.getElementById('admin-sync-indicator');
const dashboardTitleText = document.getElementById('dashboard-title-text');
const dashboardSubtitleText = document.getElementById('dashboard-subtitle-text');
const mapCardTitle = document.getElementById('map-card-title');
const mapOverlayTipText = document.getElementById('map-overlay-tip-text');

// DOM Elements - Public Feed
const feedReportsContainer = document.getElementById('feed-reports-container');
const feedReportsCount = document.getElementById('feed-reports-count');

// DOM Elements - Modal & Form
const reportModal = document.getElementById('report-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const reportForm = document.getElementById('report-form');
const reportLatInput = document.getElementById('report-lat');
const reportLngInput = document.getElementById('report-lng');
const fileInput = document.getElementById('report-image');
const fileLabel = document.getElementById('file-label');
const fileLabelText = document.getElementById('file-label-text');
const imagePreview = document.getElementById('image-preview');
const formError = document.getElementById('form-error');
const btnSubmitReport = document.getElementById('btn-submit-report');

// Stats Displays
const statTotal = document.getElementById('stat-total');
const statReported = document.getElementById('stat-reported');
const statReview = document.getElementById('stat-review');
const statFixed = document.getElementById('stat-fixed');

// Setup page backgrounds
setupConstellationBackground();
setupLoginCanvas();

/* =========================================================================
   SESSION & INITIALIZATION
   ========================================================================= */

async function checkSession() {
  const loadingScreen = document.getElementById('app-loading-screen');

  try {
    const supaSession = await getCurrentSession();
    if (supaSession) {
      // User is logged in via Supabase (e.g. Google OAuth redirect)
      const profile = await ensureUserProfile(supaSession.user.id, supaSession.user.email);
      session = {
        userId: supaSession.user.id,
        username: profile?.username || supaSession.user.email.split('@')[0],
        role: 'citizen'
      };
      localStorage.setItem('ch_session', JSON.stringify(session));
      loginWrapper.style.display = 'none';
      dashboardContainer.style.display = 'grid';
      if (loadingScreen) loadingScreen.remove();
      initDashboard();
      return;
    }
  } catch (e) {
    console.error("Session check failed", e);
  }

  const storedSession = localStorage.getItem('ch_session');
  if (storedSession) {
    session = JSON.parse(storedSession);
    loginWrapper.style.display = 'none';
    dashboardContainer.style.display = 'grid';
    if (loadingScreen) loadingScreen.remove();
    initDashboard();
  } else {
    loginWrapper.style.display = 'flex';
    dashboardContainer.style.display = 'none';
    if (loadingScreen) loadingScreen.remove();
    setupAuthHandlers();
  }
}

checkSession();

function setupAuthHandlers() {
  // Toggle between Login & Signup states
  linkGoToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormState.style.display = 'none';
    signupFormState.style.display = 'block';
    signupError.style.display = 'none';
    signupForm.reset();
  });

  linkGoToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormState.style.display = 'none';
    loginFormState.style.display = 'block';
    loginError.style.display = 'none';
    loginForm.reset();
  });

  // Toggle Password Visibilities
  let showLoginPass = false;
  btnToggleLoginPass.addEventListener('click', () => {
    showLoginPass = !showLoginPass;
    const input = document.getElementById('login-password');
    input.type = showLoginPass ? 'text' : 'password';
    btnToggleLoginPass.innerHTML = showLoginPass ? 
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` : 
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });

  let showSignupPass = false;
  btnToggleSignupPass.addEventListener('click', () => {
    showSignupPass = !showSignupPass;
    const input = document.getElementById('signup-password');
    input.type = showSignupPass ? 'text' : 'password';
    btnToggleSignupPass.innerHTML = showSignupPass ? 
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` : 
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });



  // Login Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    
    const email = document.getElementById('login-username').value.trim(); // Reusing the same input for email
    const pass = document.getElementById('login-password').value;

    if (!email) {
      showError(loginError, "Please enter a valid email.");
      return;
    }
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
      if (email.toLowerCase() === 'admin' && pass === 'admin') {
        session = {
          userId: 'admin',
          username: 'Municipal Board',
          role: 'admin'
        };
        localStorage.setItem('ch_session', JSON.stringify(session));
        window.location.reload();
        return;
      }

      if (email.toLowerCase() === 'citizen' && pass === 'citizen') {
        session = {
          userId: 'current_user',
          username: 'You (NagarSeva Citizen)',
          role: 'citizen'
        };
        localStorage.setItem('ch_session', JSON.stringify(session));
        window.location.reload();
        return;
      }

      const authData = await signIn(email, pass);
      
      // Ensure user profile exists in public.users table!
      const profile = await ensureUserProfile(authData.user.id, authData.user.email);
      
      session = {
        userId: authData.user.id,
        username: profile?.username || email.split('@')[0],
        role: 'citizen'
      };

      localStorage.setItem('ch_session', JSON.stringify(session));
      window.location.reload();
      
    } catch (error) {
      console.error('Login error:', error);
      showError(loginError, error.message || "Invalid credentials.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // Signup Form Submission (Create Account option)
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.style.display = 'none';
    signupError.style.color = '#ef4444'; // Reset to red error color

    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;

    if (username.toLowerCase() === 'admin') {
      showError(signupError, "Username 'admin' is reserved for municipal authority.");
      return;
    }
    
    if (!email || !pass || pass.length < 6) {
      showError(signupError, "Please provide a valid email and a password with at least 6 characters.");
      return;
    }
    
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    try {
      const authData = await signUp(email, pass, username);
      
      if (!authData.session) {
        signupError.style.color = '#10b981'; // Green for success info
        showError(signupError, "Account created! Please check your email to confirm registration before signing in. (You can also turn off 'Confirm email' under Auth -> Providers -> Email in your Supabase dashboard)");
        return;
      }
      
      session = {
        userId: authData.user?.id || 'new_user',
        username: username,
        role: 'citizen'
      };

      localStorage.setItem('ch_session', JSON.stringify(session));
      window.location.reload();
      
    } catch (error) {
      console.error('Signup error:', error);
      showError(signupError, error.message || "Failed to create account.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function seedUserInDB(username) {
  const users = JSON.parse(localStorage.getItem('ch_users') || '[]');
  let user = users.find(u => u.username === username);
  if (!user) {
    user = { userId: 'google_user', username: username, points: 50, badges: ['First Responder'] };
    users.push(user);
    localStorage.setItem('ch_users', JSON.stringify(users));
  }
}

async function initDashboard() {
  toggleRoleLayout();
  await loadUserData();
  initMap();
  await refreshIncidents();
  setupEventListeners();

  // Init NagBot AI chatbot (only once)
  if (!document.getElementById('nagbot-container')) {
    initChatbot();
  }

  // Handle initial URL hash routing
  if (window.location.hash === '#feed-section') {
    const navItemFeed = document.getElementById('nav-item-feed');
    if (navItemFeed) {
      navItemFeed.click();
    }
  }
}

function toggleRoleLayout() {
  const citizenEls = document.querySelectorAll('.citizen-only');
  const adminEls = document.querySelectorAll('.admin-only');
  const feedSection = document.getElementById('feed-section');
  if (feedSection) feedSection.style.display = 'none';

  if (session.role === 'admin') {
    adminEls.forEach(el => el.style.display = 'flex');
    citizenEls.forEach(el => el.style.display = 'none');
    
    citizenSectionsGrid.style.display = 'none';
    adminStatsRow.style.display = 'grid';
    adminReportsSection.style.display = 'block';

    dashboardTitleText.textContent = "Municipal Command Center";
    dashboardSubtitleText.textContent = "Review filed complaints and mark items as fixed";
    mapCardTitle.textContent = "Incident Command Map Radar";
    mapOverlayTipText.textContent = "Select any pins below to see details or trigger municipal fixes";
    
    const dotTip = document.getElementById('map-overlay-tip-dot');
    if (dotTip) {
      dotTip.style.background = 'var(--warning)';
      dotTip.style.boxShadow = '0 0 8px var(--warning)';
    }

    const navItemMap = document.getElementById('nav-item-map');
    const navItemAdmin = document.getElementById('nav-item-admin');
    const navItemFeed = document.getElementById('nav-item-feed');
    if (navItemMap) navItemMap.classList.add('active');
    if (navItemAdmin) navItemAdmin.classList.remove('active');
    if (navItemFeed) navItemFeed.classList.remove('active');

  } else {
    citizenEls.forEach(el => el.style.display = 'flex');
    adminEls.forEach(el => el.style.display = 'none');

    citizenSectionsGrid.style.display = 'grid';
    adminStatsRow.style.display = 'none';
    adminReportsSection.style.display = 'none';

    dashboardTitleText.textContent = "Citizen Command";
    dashboardSubtitleText.textContent = "Report hazards and track real-time resolution";
    mapCardTitle.textContent = "Interactive Incident Radar";
    mapOverlayTipText.textContent = "Click directly on the map to drop a pin and report at that exact location";

    const navItemMap = document.getElementById('nav-item-map');
    const navItemFeed = document.getElementById('nav-item-feed');
    if (navItemMap) navItemMap.classList.add('active');
    if (navItemFeed) navItemFeed.classList.remove('active');
  }
}

/* =========================================================================
   USER PROFILE DATA
   ========================================================================= */

async function loadUserData() {
  if (session.role === 'admin') {
    userCard.className = 'user-card';
    userCard.style.borderColor = 'rgba(245, 158, 11, 0.25)';
    userCard.innerHTML = `
      <div class="user-avatar-container">
        <div class="user-avatar" style="border-color: var(--warning); box-shadow: 0 0 15px rgba(245, 158, 11, 0.25); color: var(--warning);">M</div>
        <span class="user-badge-level" style="background: var(--warning); color: #000;">ADM</span>
      </div>
      <div class="user-info">
        <h3>Municipal Board</h3>
        <p style="color: var(--warning); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">Authorized Admin</p>
      </div>
    `;
  } else {
    currentUser = await getUserProfile(session.userId);
    const avatarChar = currentUser.username.charAt(0).toUpperCase();
    userCard.className = 'user-card';
    userCard.style.borderColor = '';
    userCard.innerHTML = `
      <button id="btn-edit-profile" class="btn-edit-profile" title="Edit Profile" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <div class="user-avatar-container">
        <div class="user-avatar">${avatarChar}</div>
        <span class="user-badge-level">LV ${Math.floor(currentUser.points / 100) + 1}</span>
      </div>
      <div class="user-info">
        <h3>${currentUser.username}</h3>
        <p style="margin-top: 4px; display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
          ${currentUser.badges.map(b => `<span class="mini-badge" style="background: rgba(0, 242, 254, 0.1); color: var(--primary);">${b}</span>`).join('')}
        </p>
      </div>
      <div class="user-stats-bar">
        <div class="user-stat-small">
          <h4>${currentUser.points}</h4>
          <span>Points</span>
        </div>
        <div class="user-stat-small">
          <h4>${currentUser.badges.length}</h4>
          <span>Badges</span>
        </div>
      </div>
    `;

    const btnEditProfile = document.getElementById('btn-edit-profile');
    if (btnEditProfile) {
      btnEditProfile.addEventListener('click', (e) => {
        e.preventDefault();
        const navItems = document.querySelectorAll('.sidebar-nav li');
        navItems.forEach(i => i.classList.remove('active'));
        handleNavigation('nav-item-profile');
      });
    }
  }
}

/* =========================================================================
   MAP SETUP
   ========================================================================= */

function initMap() {
  const defaultCoords = [28.6139, 77.2090];
  
  map = L.map('map', {
    zoomControl: true,
    minZoom: 3,
    maxZoom: 18
  }).setView(defaultCoords, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Automatically request GPS location on load (without panning the map view)
  locateUser(false);

  if (session.role === 'citizen') {
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      openReportModal(lat, lng);
    });
  }
}

function locateUser(setView = true) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentUserLat = latitude;
        currentUserLng = longitude;
        if (setView && map) {
          map.setView([latitude, longitude], 15);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied or timed out.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }
}

/* =========================================================================
   DATA REFRESH & GRID RENDERS
   ========================================================================= */

async function refreshIncidents() {
  allReports = await getReports();

  activeMarkers.forEach(marker => map.removeLayer(marker));
  activeMarkers = [];

  allReports.forEach(report => {
    const color = getStatusColor(report.status);
    
    const marker = L.circleMarker([report.latitude, report.longitude], {
      radius: 9,
      color: color,
      fillColor: color,
      fillOpacity: 0.8,
      weight: 3,
      className: 'glowing-map-marker'
    }).addTo(map);

    let adminActionHTML = '';
    if (session.role === 'admin') {
      if (report.status === 'reported') {
        adminActionHTML = `<button class="btn btn-primary quick-action-btn" data-id="${report.id}" data-action="review" style="width: 100%; margin-top: 10px; padding: 6px 0; font-size: 0.75rem;">Review Issue</button>`;
      } else if (report.status === 'review') {
        adminActionHTML = `<button class="btn btn-primary quick-action-btn" data-id="${report.id}" data-action="fixed" style="width: 100%; margin-top: 10px; padding: 6px 0; font-size: 0.75rem; background: var(--accent);">Resolve & Fix</button>`;
      }
    }

    const popupContent = `
      <div style="color: #07080e; font-family: var(--font-body); padding: 5px; max-width: 220px;">
        <span class="status-pill ${report.status}" style="font-size: 0.65rem; padding: 2px 6px;">${report.status}</span>
        <h4 style="margin: 8px 0 4px; font-weight: 700; font-family: var(--font-heading); font-size: 0.95rem;">${report.title}</h4>
        <p style="margin: 0 0 8px; font-size: 0.8rem; color: #475569;">${report.description}</p>
        <img src="${report.photoUrl}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" alt="incident">
        <div style="font-size: 0.7rem; color: #64748b; display: flex; justify-content: space-between;">
          <span class="view-user-profile-popup" data-username="${report.username}" style="cursor: pointer; color: #0ea5e9; font-weight: 600;">By @${report.username}</span>
          <span>${formatTimeAgo(report.timestamp)}</span>
        </div>
        ${adminActionHTML}
      </div>
    `;

    marker.bindPopup(popupContent);
    
    marker.on('popupopen', () => {
      const btn = document.querySelector('.quick-action-btn');
      if (btn) {
        btn.addEventListener('click', async (e) => {
          const reportId = btn.dataset.id;
          const act = btn.dataset.action;
          btn.disabled = true;
          btn.textContent = 'Updating...';
          await updateReportStatus(reportId, act);
          await refreshIncidents();
        });
      }
      // Attach popup username click
      document.querySelectorAll('.view-user-profile-popup').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          openUserProfileModal(el.dataset.username);
        });
      });
    });

    activeMarkers.push(marker);
  });

  // Center map on the average of all active reports only once on initial load
  if (!isMapInitiallyCentered && allReports.length > 0) {
    let sumLat = 0;
    let sumLng = 0;
    allReports.forEach(r => {
      sumLat += r.latitude;
      sumLng += r.longitude;
    });
    const centerLat = sumLat / allReports.length;
    const centerLng = sumLng / allReports.length;
    if (map) {
      map.setView([centerLat, centerLng], 13);
      isMapInitiallyCentered = true;
    }
  }

  if (session.role === 'admin') {
    updateAdminStats();
    renderAdminReportsGrid();
  } else {
    userReports = allReports.filter(rep => rep.userId === session.userId);
    reportsCountBadge.textContent = `${userReports.length} ${userReports.length === 1 ? 'Report' : 'Reports'}`;
    renderMyReports();
    await loadLeaderboard();
  }

  // Render public feed for all roles
  renderFeedSection();

  // Feed NagBot ONLY the current user's own reports (not all reports)
  if (session.role !== 'admin') {
    const myReports = allReports.filter(r => r.userId === session.userId || r.username === (currentUser?.username || session.username));
    setChatReports(myReports, currentUser?.username || session.username || 'Citizen');
  }
}

function updateAdminStats() {
  const total = allReports.length;
  const reported = allReports.filter(r => r.status === 'reported').length;
  const review = allReports.filter(r => r.status === 'review').length;
  const fixed = allReports.filter(r => r.status === 'fixed').length;

  if (statTotal) statTotal.textContent = total;
  if (statReported) statReported.textContent = reported;
  if (statReview) statReview.textContent = review;
  if (statFixed) statFixed.textContent = fixed;
}

function renderMyReports() {
  if (userReports.length === 0) {
    reportsGrid.innerHTML = `
      <p style="color: var(--text-muted); text-align: center; grid-column: 1/-1; padding-top: 40px;">No incidents reported yet. Click on the map to drop a pin!</p>
    `;
    return;
  }

  reportsGrid.innerHTML = userReports.map(rep => {
    return `
      <div class="report-card">
        <img src="${rep.photoUrl}" class="report-image" alt="incident report image">
        <div class="report-details">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <h4>${rep.title}</h4>
            <span class="status-pill ${rep.status}">${rep.status}</span>
          </div>
          <p>${rep.description}</p>
          <div class="report-meta">
            <a href="#" class="report-location" data-lat="${rep.latitude}" data-lng="${rep.longitude}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>View Pin</span>
            </a>
            <span>${formatTimeAgo(rep.timestamp)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.report-location').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lat = parseFloat(link.dataset.lat);
      const lng = parseFloat(link.dataset.lng);
      map.setView([lat, lng], 17);
      
      const markerIndex = allReports.findIndex(r => r.latitude === lat && r.longitude === lng);
      if (markerIndex !== -1 && activeMarkers[markerIndex]) {
        activeMarkers[markerIndex].openPopup();
      }

      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderAdminReportsGrid() {
  adminReportsCount.textContent = `${allReports.length} Active Tickets`;

  if (allReports.length === 0) {
    adminReportsGrid.innerHTML = `
      <p style="color: var(--text-muted); text-align: center; grid-column: 1/-1; padding-top: 40px;">No incidents have been filed by citizens yet.</p>
    `;
    return;
  }

  adminReportsGrid.innerHTML = allReports.map(rep => {
    let actionButtonsHTML = '';
    
    if (rep.status === 'reported') {
      actionButtonsHTML = `
        <button class="btn btn-primary admin-action-btn" data-id="${rep.id}" data-action="review" style="width: 100%; padding: 10px;">
          <span>Acknowledge & Review</span>
        </button>
      `;
    } else if (rep.status === 'review') {
      actionButtonsHTML = `
        <div class="admin-resolve-container" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
          <label class="btn btn-outline" style="width: 100%; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span id="admin-file-label-${rep.id}">Upload Proof of Fix</span>
            <input type="file" id="admin-file-input-${rep.id}" class="admin-solved-file-input" data-id="${rep.id}" accept="image/*" style="display: none;">
          </label>
          <div id="admin-preview-container-${rep.id}" style="display: none; border-radius: 8px; overflow: hidden; max-height: 100px; border: 1px solid var(--border-color); margin-top: 4px;">
            <img id="admin-preview-${rep.id}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <button class="btn btn-primary admin-action-btn" data-id="${rep.id}" data-action="fixed" style="width: 100%; padding: 10px; background: var(--accent);">
            <span>Mark as Resolved / Fixed</span>
          </button>
        </div>
      `;
    } else {
      actionButtonsHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${rep.solvedPhotoUrl ? `
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Resolution Proof:</div>
            <img src="${rep.solvedPhotoUrl}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);" alt="Resolution proof">
          ` : ''}
          <div style="text-align: center; font-size: 0.8rem; font-weight: 700; color: var(--accent); display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Issue Resolved Successfully</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="report-card" id="admin-card-${rep.id}">
        <img src="${rep.photoUrl}" class="report-image" alt="Incident location image">
        <div class="report-details" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="status-pill ${rep.status}">${rep.status}</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">${formatTimeAgo(rep.timestamp)}</span>
            </div>
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">${rep.title}</h4>
            <p style="font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 12px;">${rep.description}</p>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; border-top: 1px solid var(--border-color); padding: 10px 0; color: var(--text-muted); margin-bottom: 10px;">
              <span>Reporter: <strong class="view-user-profile-admin" data-username="${rep.username}" style="cursor: pointer; color: var(--primary);">@${rep.username}</strong></span>
              <a href="#" class="report-location-admin" data-lat="${rep.latitude}" data-lng="${rep.longitude}" style="color: var(--primary); text-decoration: none; font-weight: 600;">Locate Pin</a>
            </div>
            ${actionButtonsHTML}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Handle image selections for resolved issues
  document.querySelectorAll('.admin-solved-file-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const reportId = input.dataset.id;
      const file = e.target.files[0];
      if (file) {
        const label = document.getElementById(`admin-file-label-${reportId}`);
        if (label) label.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = document.getElementById(`admin-preview-${reportId}`);
          const container = document.getElementById(`admin-preview-container-${reportId}`);
          if (img && container) {
            img.src = ev.target.result;
            container.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  });

  document.querySelectorAll('.admin-action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const reportId = btn.dataset.id;
      const act = btn.dataset.action;
      
      btn.disabled = true;
      btn.textContent = 'Processing Action...';

      let solvedImageFile = null;
      if (act === 'fixed') {
        const fileInput = document.getElementById(`admin-file-input-${reportId}`);
        if (fileInput && fileInput.files.length > 0) {
          solvedImageFile = fileInput.files[0];
        }
      }

      try {
        await updateReportStatus(reportId, act, solvedImageFile);
        await refreshIncidents();
      } catch (err) {
        alert("Failed to update status: " + err.message);
        btn.disabled = false;
        btn.textContent = act === 'review' ? 'Acknowledge & Review' : 'Mark as Resolved / Fixed';
      }
    });
  });

  document.querySelectorAll('.report-location-admin').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lat = parseFloat(link.dataset.lat);
      const lng = parseFloat(link.dataset.lng);
      map.setView([lat, lng], 17);
      
      const markerIndex = allReports.findIndex(r => r.latitude === lat && r.longitude === lng);
      if (markerIndex !== -1 && activeMarkers[markerIndex]) {
        activeMarkers[markerIndex].openPopup();
      }

      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Admin reporter username click -> open profile modal
  document.querySelectorAll('.view-user-profile-admin').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openUserProfileModal(el.dataset.username);
    });
  });
}

/* =========================================================================
   LEADERBOARD LOADING
   ========================================================================= */

async function loadLeaderboard() {
  const leaderboard = await getLeaderboard();
  
  leaderboardList.innerHTML = leaderboard.slice(0, 5).map((user, idx) => {
    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
    const avatarChar = user.username.charAt(0).toUpperCase();
    return `
      <div class="leaderboard-row ${rankClass} view-user-profile-leaderboard" data-username="${user.username}" style="cursor: pointer;">
        <div class="leaderboard-rank-info">
          <span class="leaderboard-rank-num">${idx + 1}</span>
          <div class="leaderboard-avatar">${avatarChar}</div>
          <div class="leaderboard-name-section">
            <span class="leaderboard-username">${user.username}</span>
            <div class="leaderboard-badges">
              ${user.badges.slice(0, 2).map(b => `<span class="mini-badge">${b}</span>`).join('')}
            </div>
          </div>
        </div>
        <span class="leaderboard-points">${user.points} pts</span>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.view-user-profile-leaderboard').forEach(el => {
    el.addEventListener('click', () => {
      openUserProfileModal(el.dataset.username);
    });
  });
}

/* =========================================================================
   MODAL & SUBMISSION FORM FLOW
   ========================================================================= */

async function updateGeocodedAddress(lat, lng) {
  const addressTextEl = document.getElementById('address-text');
  if (!addressTextEl) return;

  addressTextEl.textContent = 'Resolving address...';

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'NagarSevaCivicApp/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        const addr = data.address;
        const mainLocation = addr.road || addr.suburb || addr.neighbourhood || addr.city_district || '';
        const city = addr.city || addr.town || addr.village || addr.county || '';
        const country = addr.country || '';
        
        let displayAddr = '';
        if (mainLocation && city) {
          displayAddr = `${mainLocation}, ${city}${country ? `, ${country}` : ''}`;
        } else if (city) {
          displayAddr = `${city}${country ? `, ${country}` : ''}`;
        } else {
          displayAddr = data.display_name.split(',').slice(0, 3).join(',').trim();
        }

        addressTextEl.textContent = displayAddr;
        return;
      }
    }
  } catch (error) {
    console.warn("Real reverse geocoding failed, falling back to local Sector calculations:", error);
  }

  // Fallback to local Sector matching
  const neighborhoods = [
    { name: 'Sector 17 (City Center)', lat: 30.7410, lng: 76.7842 },
    { name: 'Sector 22', lat: 30.7333, lng: 76.7725 },
    { name: 'Sector 15', lat: 30.7508, lng: 76.7640 },
    { name: 'Sector 35', lat: 30.7225, lng: 76.7680 },
    { name: 'Sector 43', lat: 30.7126, lng: 76.7538 },
    { name: 'Sector 8', lat: 30.7490, lng: 76.7910 },
    { name: 'Industrial Area Phase 1', lat: 30.7075, lng: 76.8010 },
    { name: 'Sukhna Lake Road', lat: 30.7420, lng: 76.8120 }
  ];

  let closest = neighborhoods[0];
  let minDistance = Infinity;

  neighborhoods.forEach(n => {
    const dist = Math.sqrt(Math.pow(lat - n.lat, 2) + Math.pow(lng - n.lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closest = n;
    }
  });

  const distanceInKm = minDistance * 111.32;
  
  let address = '';
  if (distanceInKm < 0.2) {
    address = `Directly in ${closest.name}, Chandigarh, India`;
  } else if (distanceInKm < 0.8) {
    address = `Near ${closest.name}, Chandigarh, India`;
  } else {
    address = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E — Outskirts, India`;
  }

  addressTextEl.textContent = address;
}

function initOrUpdateModalMap(lat, lng) {
  const container = document.getElementById('report-modal-map');
  if (!container) return;

  if (!modalMap) {
    modalMap = L.map('report-modal-map', {
      zoomControl: true,
      minZoom: 3,
      maxZoom: 18
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(modalMap);

    modalMarker = L.marker([lat, lng], {
      draggable: true
    }).addTo(modalMap);

    modalMarker.on('drag', () => {
      const latlng = modalMarker.getLatLng();
      reportLatInput.value = latlng.lat.toFixed(6);
      reportLngInput.value = latlng.lng.toFixed(6);
    });

    modalMarker.on('dragend', () => {
      const latlng = modalMarker.getLatLng();
      reportLatInput.value = latlng.lat.toFixed(6);
      reportLngInput.value = latlng.lng.toFixed(6);
      updateGeocodedAddress(latlng.lat, latlng.lng);
    });

    modalMap.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      modalMarker.setLatLng([clickLat, clickLng]);
      reportLatInput.value = clickLat.toFixed(6);
      reportLngInput.value = clickLng.toFixed(6);
      updateGeocodedAddress(clickLat, clickLng);
    });
  } else {
    modalMap.setView([lat, lng], 15);
    modalMarker.setLatLng([lat, lng]);
  }

  modalMap.invalidateSize();
}

function openReportModal(lat = null, lng = null) {
  formError.style.display = 'none';
  reportForm.reset();
  
  const imagePreviewContainer = document.getElementById('image-preview-container');
  if (imagePreviewContainer) {
    imagePreviewContainer.style.display = 'none';
  }
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  fileLabel.style.display = 'flex';

  const defaultLat = 30.7333;
  const defaultLng = 76.7794;
  
  const targetLat = lat || currentUserLat || defaultLat;
  const targetLng = lng || currentUserLng || defaultLng;

  reportLatInput.value = targetLat.toFixed(6);
  reportLngInput.value = targetLng.toFixed(6);
  
  updateGeocodedAddress(targetLat, targetLng);
  reportModal.classList.add('open');

  setTimeout(() => {
    initOrUpdateModalMap(targetLat, targetLng);
  }, 350);

  // If we don't have any location yet (pre-detected or clicked), fetch it now
  if (!lat && !lng && !currentUserLat && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const currentLat = pos.coords.latitude;
      const currentLng = pos.coords.longitude;
      currentUserLat = currentLat;
      currentUserLng = currentLng;
      reportLatInput.value = currentLat.toFixed(6);
      reportLngInput.value = currentLng.toFixed(6);
      updateGeocodedAddress(currentLat, currentLng);
      initOrUpdateModalMap(currentLat, currentLng);
    }, (err) => {
      console.warn("Geolocation in modal failed", err);
    }, { enableHighAccuracy: true, timeout: 5000 });
  }
}

function closeReportModal() {
  reportModal.classList.remove('open');
  formError.style.display = 'none';
  reportForm.reset();
}

function setupEventListeners() {
  // Google Social Signin
  if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signInWithGoogle();
      } catch (error) {
        showError(loginError, "Google login failed.");
      }
    });
  }

  if (btnSignupGoogle) {
    btnSignupGoogle.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signInWithGoogle();
      } catch (error) {
        showError(signupError, "Google signup failed.");
      }
    });
  }

  // Logout Handler
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await signOut();
      localStorage.removeItem('ch_session');
      window.location.reload();
    });
  }

  if (session.role === 'citizen') {
    btnQuickReport.addEventListener('click', () => openReportModal());
    btnCloseModal.addEventListener('click', closeReportModal);
    
    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) closeReportModal();
    });

    btnLocateMe.addEventListener('click', () => locateUser(true));

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          imagePreview.src = ev.target.result;
          imagePreview.style.display = 'block';
          const imagePreviewContainer = document.getElementById('image-preview-container');
          if (imagePreviewContainer) {
            imagePreviewContainer.style.display = 'block';
          }
          fileLabel.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });

    const btnRemoveImage = document.getElementById('btn-remove-image');
    if (btnRemoveImage) {
      btnRemoveImage.addEventListener('click', () => {
        fileInput.value = '';
        const imagePreviewContainer = document.getElementById('image-preview-container');
        if (imagePreviewContainer) {
          imagePreviewContainer.style.display = 'none';
        }
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        fileLabel.style.display = 'flex';
      });
    }

    const modalBtnLocate = document.getElementById('modal-btn-locate');
    if (modalBtnLocate) {
      modalBtnLocate.addEventListener('click', () => {
        if (navigator.geolocation) {
          modalBtnLocate.disabled = true;
          modalBtnLocate.innerHTML = `<svg class="spin-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Geotagging...`;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const currentLat = pos.coords.latitude;
              const currentLng = pos.coords.longitude;
              currentUserLat = currentLat;
              currentUserLng = currentLng;
              reportLatInput.value = currentLat.toFixed(6);
              reportLngInput.value = currentLng.toFixed(6);
              updateGeocodedAddress(currentLat, currentLng);
              initOrUpdateModalMap(currentLat, currentLng);
              modalBtnLocate.disabled = false;
              modalBtnLocate.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg> Locate Me`;
            },
            (error) => {
              console.error("Locate error", error);
              modalBtnLocate.disabled = false;
              modalBtnLocate.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg> Locate Me`;
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      });
    }

    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.style.display = 'none';

      // Remove any previous duplicate warning
      const prevWarn = document.getElementById('duplicate-warning-banner');
      if (prevWarn) prevWarn.remove();

      const reportData = {
        title: document.getElementById('report-title').value,
        type: document.getElementById('report-type').value,
        description: document.getElementById('report-desc').value,
        latitude: reportLatInput.value,
        longitude: reportLngInput.value,
        userId: session.userId,
        username: currentUser.username
      };

      const imageFile = fileInput.files[0];

      // ── AI Duplicate Detection ──────────────────────────
      btnSubmitReport.disabled = true;
      btnSubmitReport.textContent = '🤖 AI checking for duplicates...';

      const dupResult = await checkDuplicateReport(reportData, allReports);

      if (dupResult) {
        // Show warning and wait for user decision
        btnSubmitReport.disabled = false;
        btnSubmitReport.textContent = 'Submit Community Incident';

        const warningHTML = `
          <div class="duplicate-warning" id="duplicate-warning-banner">
            <div class="duplicate-warning-title">
              ⚠️ AI Detected a Possible Duplicate
            </div>
            <div class="duplicate-warning-body">
              <strong>${dupResult.matchedReport?.title || 'Similar issue'}</strong> was already reported nearby (Status: ${dupResult.matchedReport?.status || 'reported'}).<br>
              <em>${dupResult.reason}</em><br><br>
              Do you still want to submit your report?
            </div>
            <div class="duplicate-warning-actions">
              <button class="btn-dup-cancel" id="btn-dup-cancel">❌ Cancel</button>
              <button class="btn-dup-continue" id="btn-dup-continue">✅ Submit Anyway</button>
            </div>
          </div>
        `;
        const formErrorEl = document.getElementById('form-error');
        formErrorEl.insertAdjacentHTML('afterend', warningHTML);

        // Cancel
        document.getElementById('btn-dup-cancel').addEventListener('click', () => {
          document.getElementById('duplicate-warning-banner')?.remove();
        });

        // Continue anyway
        document.getElementById('btn-dup-continue').addEventListener('click', async () => {
          document.getElementById('duplicate-warning-banner')?.remove();
          await doSubmitReport(reportData, imageFile);
        });

        return; // Don't submit yet
      }
      // ── End Duplicate Detection ─────────────────────────

      await doSubmitReport(reportData, imageFile);
    });

    async function doSubmitReport(reportData, imageFile) {
      btnSubmitReport.disabled = true;
      btnSubmitReport.textContent = 'Uploading...';
      try {
        await submitReport(reportData, imageFile);
        await loadUserData();
        await refreshIncidents();
        closeReportModal();
        alert('Success! Incident reported. You gained +50 points!');
      } catch (err) {
        const formError = document.getElementById('form-error');
        formError.textContent = err.message;
        formError.style.display = 'block';
      } finally {
        btnSubmitReport.disabled = false;
        btnSubmitReport.textContent = 'Submit Community Incident';
      }
    }

    const profileEditForm = document.getElementById('profile-edit-form');
    if (profileEditForm) {
      profileEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('profile-username');
        const bioInput = document.getElementById('profile-bio');
        const errorDiv = document.getElementById('profile-error');
        const successDiv = document.getElementById('profile-success');
        const saveBtn = document.getElementById('btn-save-profile');

        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';

        const newUsername = usernameInput.value.trim();
        const newBio = bioInput.value.trim();

        if (!newUsername) {
          if (errorDiv) {
            errorDiv.textContent = "Username is required.";
            errorDiv.style.display = 'block';
          }
          return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Profile...';

        try {
          const updatedProfile = await updateUserProfile(session.userId, { username: newUsername, bio: newBio });
          if (updatedProfile) {
            currentUser = updatedProfile;
            if (successDiv) successDiv.style.display = 'block';
            await loadUserData(); // reload sidebar username/avatar
          } else {
            throw new Error("Update failed.");
          }
        } catch (err) {
          if (errorDiv) {
            errorDiv.textContent = err.message || "Failed to update profile changes.";
            errorDiv.style.display = 'block';
          }
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Profile Changes';
        }
      });
    }
  }

  const navItems = document.querySelectorAll('.sidebar-nav li');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      handleNavigation(item.id);
    });
  });
}

function handleNavigation(targetId) {
  const mapSection = document.getElementById('map-section');
  const feedSection = document.getElementById('feed-section');
  const profileSection = document.getElementById('profile-section');
  
  if (targetId === 'nav-item-feed') {
    // Hide other sections
    if (mapSection) mapSection.style.display = 'none';
    if (citizenSectionsGrid) citizenSectionsGrid.style.display = 'none';
    if (adminReportsSection) adminReportsSection.style.display = 'none';
    if (adminStatsRow) adminStatsRow.style.display = 'none';
    if (profileSection) profileSection.style.display = 'none';

    // Show public feed section
    if (feedSection) feedSection.style.display = 'block';

    // Update header
    if (dashboardTitleText) dashboardTitleText.textContent = "Community Feed";
    if (dashboardSubtitleText) dashboardSubtitleText.textContent = "Browse, discuss, and track community resolution progress";
  } else if (targetId === 'nav-item-profile') {
    // Hide other sections
    if (mapSection) mapSection.style.display = 'none';
    if (citizenSectionsGrid) citizenSectionsGrid.style.display = 'none';
    if (adminReportsSection) adminReportsSection.style.display = 'none';
    if (adminStatsRow) adminStatsRow.style.display = 'none';
    if (feedSection) feedSection.style.display = 'none';

    // Show profile section
    if (profileSection) {
      profileSection.style.display = 'block';

      // Load inputs
      const usernameInput = document.getElementById('profile-username');
      const bioInput = document.getElementById('profile-bio');
      if (usernameInput && currentUser) usernameInput.value = currentUser.username || '';
      if (bioInput && currentUser) bioInput.value = currentUser.bio || '';

      const errDiv = document.getElementById('profile-error');
      const succDiv = document.getElementById('profile-success');
      if (errDiv) errDiv.style.display = 'none';
      if (succDiv) succDiv.style.display = 'none';
    }

    // Update header
    if (dashboardTitleText) dashboardTitleText.textContent = "Edit NagarSeva Profile";
    if (dashboardSubtitleText) dashboardSubtitleText.textContent = "Manage your community public username and action biography";
  } else {
    // Hide feed & profile sections
    if (feedSection) feedSection.style.display = 'none';
    if (profileSection) profileSection.style.display = 'none';

    // Restore standard layout based on active role
    if (session.role === 'admin') {
      if (mapSection) mapSection.style.display = 'block';
      if (adminReportsSection) adminReportsSection.style.display = 'block';
      if (adminStatsRow) adminStatsRow.style.display = 'grid';
      if (citizenSectionsGrid) citizenSectionsGrid.style.display = 'none';

      if (dashboardTitleText) dashboardTitleText.textContent = "Municipal Command Center";
      if (dashboardSubtitleText) dashboardSubtitleText.textContent = "Review filed complaints and mark items as fixed";
    } else {
      if (mapSection) mapSection.style.display = 'block';
      if (citizenSectionsGrid) citizenSectionsGrid.style.display = 'grid';
      if (adminReportsSection) adminReportsSection.style.display = 'none';
      if (adminStatsRow) adminStatsRow.style.display = 'none';

      if (dashboardTitleText) dashboardTitleText.textContent = "Citizen Command";
      if (dashboardSubtitleText) dashboardSubtitleText.textContent = "Report hazards and track real-time resolution";
    }

    // Force Map resize invalidation to redraw tiles cleanly
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }
}

/* =========================================================================
   UTILS & FALLBACKS
   ========================================================================= */

function getStatusColor(status) {
  if (status === 'reported') return '#f59e0b';
  if (status === 'review') return '#6366f1';
  if (status === 'fixed') return '#10b981';
  return '#f59e0b';
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Particle background implementation matching main.js
function setupConstellationBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(30, Math.floor((width * height) / 50000));

  class Ember {
    constructor() {
      this.reset(true);
    }

    reset(randomY = false) {
      this.x = Math.random() * width;
      this.y = randomY ? Math.random() * height : height + 10;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = -0.15 - Math.random() * 0.35;
      this.radius = Math.random() * 2 + 0.6;
      this.life = 0.4 + Math.random() * 0.6;
      this.decay = 0.002 + Math.random() * 0.003;
      
      const colors = [
        'rgba(255, 107, 74, ',
        'rgba(255, 94, 58, ',
        'rgba(255, 165, 0, '
      ];
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;

      this.vx += (Math.random() - 0.5) * 0.01;

      if (this.life <= 0 || this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset(false);
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      const alpha = this.life * 0.35;
      ctx.fillStyle = `${this.colorBase}${alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Ember());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// Particle ascending animation for Nova login card wrapper
function setupLoginCanvas() {
  const canvas = document.getElementById('login-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const setSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  setSize();

  let ps = [];
  let raf = 0;

  const make = () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    v: Math.random() * 0.25 + 0.05,
    o: Math.random() * 0.35 + 0.15,
  });

  const init = () => {
    ps = [];
    const count = Math.floor((canvas.width * canvas.height) / 9000);
    for (let i = 0; i < count; i++) ps.push(make());
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ps.forEach((p) => {
      p.y -= p.v;
      if (p.y < 0) {
        p.x = Math.random() * canvas.width;
        p.y = canvas.height + Math.random() * 40;
        p.v = Math.random() * 0.25 + 0.05;
        p.o = Math.random() * 0.35 + 0.15;
      }
      ctx.fillStyle = `rgba(250,250,250,${p.o})`;
      ctx.fillRect(p.x, p.y, 0.7, 2.2);
    });
    raf = requestAnimationFrame(draw);
  };

  const onResize = () => {
    setSize();
    init();
  };

  window.addEventListener('resize', onResize);
  init();
  raf = requestAnimationFrame(draw);
}

function renderFeedSection() {
  if (!feedReportsContainer) return;

  if (feedReportsCount) {
    feedReportsCount.textContent = `${allReports.length} ${allReports.length === 1 ? 'Incident' : 'Incidents'}`;
  }

  if (allReports.length === 0) {
    feedReportsContainer.innerHTML = `
      <p style="color: var(--text-muted); text-align: center; padding: 40px 0;">No community reports to show in the feed yet.</p>
    `;
    return;
  }

  feedReportsContainer.innerHTML = allReports.map(rep => {
    const statusText = rep.status === 'fixed' ? 'Solved' : rep.status === 'review' ? 'Under Review' : 'Reported';
    const statusClass = rep.status;

    const publishDate = new Date(rep.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let resolvedDateHTML = '';
    if (rep.status === 'fixed' && rep.solvedAt) {
      const resolvedDate = new Date(rep.solvedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      resolvedDateHTML = `
        <div class="resolved-badge-banner" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; margin-top: 10px; border-radius: 8px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--accent); font-size: 0.8rem; font-weight: 700;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Resolved on ${resolvedDate}</span>
        </div>
      `;
    }

    let mediaHTML = '';
    if (rep.status === 'fixed' && rep.solvedPhotoUrl) {
      mediaHTML = `
        <div class="feed-media-comparison" style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="media-side" style="position: relative;">
            <span class="media-label before" style="position: absolute; top: 8px; left: 8px; z-index: 2; background: rgba(239, 68, 68, 0.85); color: white; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(4px);">BEFORE</span>
            <img src="${rep.photoUrl}" alt="Before incident" class="feed-media-img" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);">
          </div>
          <div class="media-side" style="position: relative;">
            <span class="media-label after" style="position: absolute; top: 8px; left: 8px; z-index: 2; background: rgba(16, 185, 129, 0.85); color: white; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(4px);">AFTER</span>
            <img src="${rep.solvedPhotoUrl}" alt="After resolved" class="feed-media-img" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.2);">
          </div>
        </div>
      `;
    } else {
      mediaHTML = `
        <div class="feed-media-single" style="margin-top: 12px;">
          <img src="${rep.photoUrl}" alt="Incident image" class="feed-media-img" style="width: 100%; height: 240px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);">
        </div>
      `;
    }

    const commentsListHTML = (rep.comments || []).map(comment => {
      const commentTime = formatTimeAgo(comment.timestamp);
      return `
        <div class="comment-bubble" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div class="comment-header" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted);">
            <span class="comment-user view-user-profile-comment" data-username="${comment.username}" style="color: var(--primary); font-weight: 600; cursor: pointer;">@${comment.username}</span>
            <span class="comment-time">${commentTime}</span>
          </div>
          <p class="comment-text" style="font-size: 0.8rem; line-height: 1.4; color: var(--text-secondary); margin: 0;">${comment.text}</p>
          ${comment.photoUrl ? `
            <div style="margin-top: 6px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(16, 185, 129, 0.15); max-height: 110px; width: fit-content; max-width: 100%;">
              <img src="${comment.photoUrl}" style="height: 90px; max-width: 100%; object-fit: cover; cursor: pointer;" onclick="window.open('${comment.photoUrl}')" alt="Attachment">
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    const commentsContainerHTML = `
      <div class="comments-section" data-id="${rep.id}" style="margin-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 16px;">
        <div class="comments-title" style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">Comments (${(rep.comments || []).length})</div>
        <div class="comments-list" id="comments-list-${rep.id}" style="max-height: 200px; overflow-y: auto; margin-bottom: 12px; padding-right: 4px;">
          ${commentsListHTML || '<p class="no-comments-text" style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 12px 0;">No comments yet. Start the conversation!</p>'}
        </div>
        <form class="comment-form" data-id="${rep.id}" style="display: flex; gap: 8px;">
          <input type="text" class="comment-input" placeholder="Write a comment..." required style="flex: 1; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; font-size: 0.8rem; color: var(--text-primary); transition: all 0.2s;">
          <button type="submit" class="btn btn-primary comment-submit-btn" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 8px; border: none; cursor: pointer;">Post</button>
        </form>
      </div>
    `;

    return `
      <div class="feed-card" id="feed-card-${rep.id}" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px; transition: all var(--transition-normal); margin-bottom: 20px; width: 100%; box-sizing: border-box;">
        <div class="feed-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div class="feed-user-info view-user-profile" data-username="${rep.username}" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <div class="feed-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(0, 242, 254, 0.1); border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--primary); font-size: 0.85rem;">${rep.username.charAt(0).toUpperCase()}</div>
            <div style="display: flex; flex-direction: column;">
              <span class="feed-username" style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary);">@${rep.username}</span>
              <span class="feed-date" style="font-size: 0.7rem; color: var(--text-muted);">Published ${publishDate}</span>
            </div>
          </div>
          <span class="status-pill ${statusClass}">${statusText}</span>
        </div>

        <div class="feed-card-body" style="display: flex; flex-direction: column; gap: 6px;">
          <h3 class="feed-title" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;">${rep.title}</h3>
          <p class="feed-desc" style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin: 0;">${rep.description}</p>
          ${resolvedDateHTML}
          ${mediaHTML}
        </div>

        <div class="feed-card-footer" style="margin-top: 6px;">
          <div style="display: flex; gap: 15px; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.03); padding-bottom: 8px;">
            <a href="#" class="report-location-feed" data-lat="${rep.latitude}" data-lng="${rep.longitude}" style="color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 4px; font-weight: 600;">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Locate Radar Pin</span>
            </a>
          </div>
          ${commentsContainerHTML}
        </div>
      </div>
    `;
  }).join('');

  // Attach comment submit event listeners
  document.querySelectorAll('.comment-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reportId = form.dataset.id;
      const input = form.querySelector('.comment-input');
      const text = input.value.trim();
      if (!text) return;

      const btn = form.querySelector('.comment-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Posting...';

      const username = session.role === 'admin' ? 'Municipal Board' : (currentUser ? currentUser.username : session.username);

      try {
        const updatedComments = await addReportComment(reportId, username, text);
        // Refresh local memory of allReports
        allReports = await getReports();
        
        // Re-render comments list for this card
        const listContainer = document.getElementById(`comments-list-${reportId}`);
        if (listContainer) {
          if (updatedComments.length === 0) {
            listContainer.innerHTML = '<p class="no-comments-text" style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 12px 0;">No comments yet. Start the conversation!</p>';
          } else {
            listContainer.innerHTML = updatedComments.map(comment => {
              return `
                <div class="comment-bubble" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px;">
                  <div class="comment-header" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted);">
                    <span class="comment-user view-user-profile-comment" data-username="${comment.username}" style="color: var(--primary); font-weight: 600; cursor: pointer;">@${comment.username}</span>
                    <span class="comment-time">${formatTimeAgo(comment.timestamp)}</span>
                  </div>
                  <p class="comment-text" style="font-size: 0.8rem; line-height: 1.4; color: var(--text-secondary); margin: 0;">${comment.text}</p>
                  ${comment.photoUrl ? `
                    <div style="margin-top: 6px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(16, 185, 129, 0.15); max-height: 110px; width: fit-content; max-width: 100%;">
                      <img src="${comment.photoUrl}" style="height: 90px; max-width: 100%; object-fit: cover; cursor: pointer;" onclick="window.open('${comment.photoUrl}')" alt="Attachment">
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('');

            // Re-attach profile click listeners on newly rendered comments
            listContainer.querySelectorAll('.view-user-profile-comment').forEach(el => {
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                openUserProfileModal(el.dataset.username);
              });
            });
          }
        }
        
        // Update comments count in this feed card
        const commentsTitle = form.parentElement.querySelector('.comments-title');
        if (commentsTitle) {
          commentsTitle.textContent = `Comments (${updatedComments.length})`;
        }
        
        input.value = '';
      } catch (err) {
        alert("Failed to add comment: " + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Post';
      }
    });
  });

  // Attach user profile click listeners
  document.querySelectorAll('.view-user-profile').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openUserProfileModal(el.dataset.username);
    });
  });

  document.querySelectorAll('.view-user-profile-comment').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openUserProfileModal(el.dataset.username);
    });
  });

  // Attach location click listeners for feed card
  document.querySelectorAll('.report-location-feed').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lat = parseFloat(link.dataset.lat);
      const lng = parseFloat(link.dataset.lng);
      map.setView([lat, lng], 17);
      
      const markerIndex = allReports.findIndex(r => r.latitude === lat && r.longitude === lng);
      if (markerIndex !== -1 && activeMarkers[markerIndex]) {
        activeMarkers[markerIndex].openPopup();
      }

      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// User Profile Details Modal helper
async function openUserProfileModal(username) {
  const modal = document.getElementById('user-profile-modal');
  if (!modal) return;

  let targetUser = null;
  
  // Find in local storage
  const localUsers = JSON.parse(localStorage.getItem('ch_users') || '[]');
  targetUser = localUsers.find(u => u.username === username);

  // Query Supabase
  if (!targetUser && useSupabase) {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (data) {
        targetUser = {
          userId: data.user_id,
          username: data.username,
          points: data.points,
          badges: data.badges || [],
          bio: data.bio || ""
        };
      }
    } catch (e) {
      console.error("Failed to fetch user profile for modal", e);
    }
  }

  // Fallback template
  if (!targetUser) {
    targetUser = {
      username: username,
      points: 50,
      badges: ['First Responder'],
      bio: "Just a NagarSeva citizen keeping the community clean!"
    };
  }

  // Update modal content
  document.getElementById('modal-user-name').textContent = `@${targetUser.username}`;
  document.getElementById('modal-user-level').textContent = `LEVEL ${Math.floor((targetUser.points || 0) / 100) + 1}`;
  document.getElementById('modal-user-points').textContent = `${targetUser.points || 0} pts`;
  document.getElementById('modal-user-bio').textContent = targetUser.bio || "No bio provided by this citizen yet.";
  document.getElementById('modal-user-avatar').textContent = targetUser.username.charAt(0).toUpperCase();

  // Badges
  const badgesContainer = document.getElementById('modal-user-badges');
  if (badgesContainer) {
    const badges = targetUser.badges || [];
    if (badges.length === 0) {
      badgesContainer.innerHTML = '<span class="mini-badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">No badges unlocked yet</span>';
    } else {
      badgesContainer.innerHTML = badges.map(b => `<span class="mini-badge" style="background: rgba(0, 242, 254, 0.1); color: var(--primary); font-size: 0.72rem; padding: 4px 10px; border-radius: 6px; font-weight: 700;">${b}</span>`).join('');
    }
  }

  // Filed Incidents
  const reportsListContainer = document.getElementById('modal-user-reports-list');
  const reportsCountSpan = document.getElementById('modal-user-reports-count');
  
  const userIncidents = allReports.filter(r => r.username === targetUser.username);
  if (reportsCountSpan) reportsCountSpan.textContent = userIncidents.length;

  if (reportsListContainer) {
    if (userIncidents.length === 0) {
      reportsListContainer.innerHTML = '<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 12px 0;">No reported incidents found for this citizen.</p>';
    } else {
      reportsListContainer.innerHTML = userIncidents.map(rep => {
        const dateStr = new Date(rep.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusText = rep.status === 'fixed' ? 'Solved' : rep.status === 'review' ? 'Under Review' : 'Reported';
        return `
          <div class="user-modal-report-item" data-lat="${rep.latitude}" data-lng="${rep.longitude}" style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 8px 10px; cursor: pointer; transition: all 0.2s;">
            <img src="${rep.photoUrl}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px;" alt="report thumbnail">
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;">${rep.title}</span>
              <span style="font-size: 0.68rem; color: var(--text-muted); margin: 0;">Filed on ${dateStr}</span>
            </div>
            <span class="status-pill ${rep.status}" style="font-size: 0.62rem; padding: 2px 6px;">${statusText}</span>
          </div>
        `;
      }).join('');

      reportsListContainer.querySelectorAll('.user-modal-report-item').forEach(item => {
        item.addEventListener('click', () => {
          const lat = parseFloat(item.dataset.lat);
          const lng = parseFloat(item.dataset.lng);
          modal.classList.remove('open');
          map.setView([lat, lng], 17);
          const markerIndex = allReports.findIndex(r => r.latitude === lat && r.longitude === lng);
          if (markerIndex !== -1 && activeMarkers[markerIndex]) {
            activeMarkers[markerIndex].openPopup();
          }
          document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
        });
      });
    }
  }

  modal.classList.add('open');
}

// Global modal binder execution
function setupUserProfileModal() {
  const btnClose = document.getElementById('btn-close-profile-modal');
  const modal = document.getElementById('user-profile-modal');
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }
}

setupUserProfileModal();
