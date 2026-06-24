import './style.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUserProfile, getLeaderboard, getReports, submitReport, updateReportStatus, signIn, signUp, signOut, getCurrentSession } from './api.js';
import { initCursor } from './cursor.js';

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
let userReports = [];
let allReports = [];
let currentUser = null;
let activeMarkers = [];
let session = null;

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

function checkSession() {
  const storedSession = localStorage.getItem('ch_session');
  if (storedSession) {
    session = JSON.parse(storedSession);
    loginWrapper.style.display = 'none';
    dashboardContainer.style.display = 'grid';
    initDashboard();
  } else {
    loginWrapper.style.display = 'flex';
    dashboardContainer.style.display = 'none';
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

      const authData = await signIn(email, pass);
      
      // Get the user profile to get the username
      const profile = await getUserProfile(authData.user.id);
      
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

  // Google Social Signin Mocks
  const handleGoogleMock = () => {
    session = {
      userId: 'google_user',
      username: 'Google Hero',
      role: 'citizen'
    };
    seedUserInDB('Google Hero');
    localStorage.setItem('ch_session', JSON.stringify(session));
    window.location.reload();
  };

  btnLoginGoogle.addEventListener('click', handleGoogleMock);
  btnSignupGoogle.addEventListener('click', handleGoogleMock);
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
}

function toggleRoleLayout() {
  const citizenEls = document.querySelectorAll('.citizen-only');
  const adminEls = document.querySelectorAll('.admin-only');

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
    if (navItemMap) navItemMap.classList.add('active');
    if (navItemAdmin) navItemAdmin.classList.remove('active');

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

  if (session.role === 'citizen') {
    locateUser(false);

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
          <span>By @${report.username}</span>
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
    });

    activeMarkers.push(marker);
  });

  if (session.role === 'admin') {
    updateAdminStats();
    renderAdminReportsGrid();
  } else {
    userReports = allReports.filter(rep => rep.userId === session.userId);
    reportsCountBadge.textContent = `${userReports.length} ${userReports.length === 1 ? 'Report' : 'Reports'}`;
    renderMyReports();
    await loadLeaderboard();
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
        <button class="btn btn-primary admin-action-btn" data-id="${rep.id}" data-action="fixed" style="width: 100%; padding: 10px; background: var(--accent);">
          <span>Mark as Resolved / Fixed</span>
        </button>
      `;
    } else {
      actionButtonsHTML = `
        <div style="text-align: center; font-size: 0.8rem; font-weight: 700; color: var(--accent); display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Issue Resolved Successfully</span>
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
              <span>Reporter: <strong>@${rep.username}</strong></span>
              <a href="#" class="report-location-admin" data-lat="${rep.latitude}" data-lng="${rep.longitude}" style="color: var(--primary); text-decoration: none; font-weight: 600;">Locate Pin</a>
            </div>
            ${actionButtonsHTML}
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.admin-action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const reportId = btn.dataset.id;
      const act = btn.dataset.action;
      
      btn.disabled = true;
      btn.textContent = 'Processing Action...';

      try {
        await updateReportStatus(reportId, act);
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
      <div class="leaderboard-row ${rankClass}">
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
}

/* =========================================================================
   MODAL & SUBMISSION FORM FLOW
   ========================================================================= */

function openReportModal(lat = null, lng = null) {
  formError.style.display = 'none';
  reportForm.reset();
  imagePreview.style.display = 'none';
  fileLabel.style.display = 'flex';

  if (lat && lng) {
    reportLatInput.value = lat.toFixed(6);
    reportLngInput.value = lng.toFixed(6);
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        reportLatInput.value = pos.coords.latitude.toFixed(6);
        reportLngInput.value = pos.coords.longitude.toFixed(6);
      });
    }
  }

  reportModal.classList.add('open');
}

function closeReportModal() {
  reportModal.classList.remove('open');
  formError.style.display = 'none';
  reportForm.reset();
}

/* =========================================================================
   EVENT LISTENERS SETUP
   ========================================================================= */

function setupEventListeners() {
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
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
          fileLabel.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });

    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.style.display = 'none';
      btnSubmitReport.disabled = true;
      btnSubmitReport.textContent = 'Analyzing and uploading...';

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

      try {
        await submitReport(reportData, imageFile);
        
        await loadUserData();
        await refreshIncidents();
        closeReportModal();
        
        alert("Success! Incident reported. You gained +50 points!");
      } catch (err) {
        formError.textContent = err.message;
        formError.style.display = 'block';
      } finally {
        btnSubmitReport.disabled = false;
        btnSubmitReport.textContent = 'Submit Community Incident';
      }
    });
  }

  const navItems = document.querySelectorAll('.sidebar-nav li');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
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
