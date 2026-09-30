/**
 * BlogSphere - Core Application Controller
 * Handles theme toggling, global navigation, toasts, search bar, modals, and responsive layout.
 */

// Immediate Theme Setup (can also run before DOMContentLoaded to prevent flash)
function initTheme() {
  const savedTheme = localStorage.getItem(BlogSphereDB.KEYS.THEME) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(BlogSphereDB.KEYS.THEME, newTheme);
  updateThemeIcon(newTheme);
  if (window.showToast) {
    showToast(`Switched to ${newTheme} mode`, 'info');
  }
}

function updateThemeIcon(theme) {
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  themeBtns.forEach(btn => {
    if (theme === 'dark') {
      btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      btn.setAttribute('title', 'Switch to Light Mode');
      btn.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      btn.setAttribute('title', 'Switch to Dark Mode');
      btn.setAttribute('aria-label', 'Switch to Dark Mode');
    }
  });
}

// Global Image Error Fallback Handler
function handleImageError(img) {
  img.onerror = null; // Prevent loop
  img.src = 'assets/images/placeholder.svg';
  img.classList.add('img-fallback-loaded');
}

function handleAvatarError(img) {
  img.onerror = null;
  img.src = 'assets/images/avatar-default.svg';
}

// Toast Notification System
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  
  let icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';
  if (type === 'info') icon = 'fa-circle-info';
  if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
    <div class="toast-message">${escapeHtml(message)}</div>
    <button class="toast-close" aria-label="Close Notification"><i class="fa-solid fa-xmark"></i></button>
    <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
  `;

  const removeToast = () => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', removeToast);
  container.appendChild(toast);

  // Auto remove
  setTimeout(removeToast, duration);
}

// Utility: HTML Escaping
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Utility: Time Ago Formatter
function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// Global Search in Navbar
function initNavbarSearch() {
  const searchInput = document.getElementById('navSearchInput');
  const searchDropdown = document.getElementById('navSearchDropdown');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      if (searchDropdown) searchDropdown.classList.remove('active');
      return;
    }

    const posts = BlogSphereDB.getData(BlogSphereDB.KEYS.POSTS, []);
    const matches = posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(query))) ||
      post.authorName.toLowerCase().includes(query)
    ).slice(0, 5);

    if (searchDropdown) {
      if (matches.length === 0) {
        searchDropdown.innerHTML = `
          <div class="search-drop-empty">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>No matching stories found</span>
          </div>
        `;
      } else {
        searchDropdown.innerHTML = `
          <div class="search-drop-header">Top Results</div>
          ${matches.map(post => `
            <a href="post.html?id=${post.id}" class="search-drop-item">
              <img src="${post.coverImage}" alt="${escapeHtml(post.title)}" onerror="handleImageError(this)" class="search-drop-img">
              <div class="search-drop-info">
                <div class="search-drop-title">${escapeHtml(post.title)}</div>
                <div class="search-drop-meta">
                  <span class="badge badge-purple">${escapeHtml(post.category)}</span>
                  <span>${escapeHtml(post.authorName)}</span>
                </div>
              </div>
            </a>
          `).join('')}
          <a href="explore.html?q=${encodeURIComponent(query)}" class="search-drop-view-all">
            View all results for "${escapeHtml(query)}" &rarr;
          </a>
        `;
      }
      searchDropdown.classList.add('active');
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `explore.html?q=${encodeURIComponent(query)}`;
      }
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (searchDropdown && !searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.remove('active');
    }
  });
}

// User Menu Dropdown Toggle
function initUserMenu() {
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
      }
    });
  }

  // Notifications Dropdown
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
      const badge = notifBtn.querySelector('.notif-badge');
      if (badge) badge.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('active');
      }
    });
  }
}

// Mobile Hamburger Menu
function initMobileMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  const mobileOverlay = document.getElementById('mobileOverlay');

  if (hamburger && mobileNav) {
    const toggle = () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      if (mobileOverlay) mobileOverlay.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    };

    hamburger.addEventListener('click', toggle);
    if (mobileOverlay) mobileOverlay.addEventListener('click', toggle);

    // Close when clicking nav links
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }
}

// Initialize everything on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbarSearch();
  initUserMenu();
  initMobileMenu();

  // Attach theme button handlers
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // Attach logout handler buttons
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  });

  // Highlight active nav item
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

window.showToast = showToast;
window.handleImageError = handleImageError;
window.handleAvatarError = handleAvatarError;
window.escapeHtml = escapeHtml;
window.timeAgo = timeAgo;
