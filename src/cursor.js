/**
 * Shared Custom Cursor Module
 * Injects cursor elements into the DOM and animates them.
 * Import this in any page's JS entry point to enable the custom cursor.
 */
export function initCursor() {
  // Inject cursor DOM elements if they don't already exist
  if (!document.getElementById('cursor-follower')) {
    const follower = document.createElement('div');
    follower.className = 'cursor-follower';
    follower.id = 'cursor-follower';
    document.body.appendChild(follower);

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.id = 'cursor-dot';
    document.body.appendChild(dot);
  }

  const cursorFollower = document.getElementById('cursor-follower');
  const cursorDot = document.getElementById('cursor-dot');
  let cursorX = 0, cursorY = 0;
  let followerX = 0, followerY = 0;

  // Track mouse position — update dot instantly
  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    if (cursorDot) {
      cursorDot.style.left = cursorX + 'px';
      cursorDot.style.top = cursorY + 'px';
    }
  });

  // Animate follower with smooth lag
  function animateCursor() {
    followerX += (cursorX - followerX) * 0.08;
    followerY += (cursorY - followerY) * 0.08;
    if (cursorFollower) {
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top = followerY + 'px';
    }
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hide cursor when mouse leaves the window
  document.addEventListener('mouseleave', () => {
    if (cursorFollower) cursorFollower.style.opacity = '0';
    if (cursorDot) cursorDot.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    if (cursorFollower) cursorFollower.style.opacity = '1';
    if (cursorDot) cursorDot.style.opacity = '1';
  });

  // Grow cursor on interactive elements
  function attachHoverEffects() {
    document.querySelectorAll('a, button, .btn, .feature-card, .tilt-card, input, textarea, select, label').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorFollower?.classList.add('cursor-hover');
        cursorDot?.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        cursorFollower?.classList.remove('cursor-hover');
        cursorDot?.classList.remove('cursor-hover');
      });
    });
  }

  // Run immediately and also on DOM changes (for dynamically added elements)
  attachHoverEffects();

  // Re-attach on any new DOM mutations (e.g. modals opening, new cards loading)
  const observer = new MutationObserver(() => {
    attachHoverEffects();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
