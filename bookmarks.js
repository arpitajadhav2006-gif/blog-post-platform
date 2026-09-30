// ==========================================
// BLOGSPHERE AI - BOOKMARKS JAVASCRIPT
// ==========================================

let allBookmarks = [];
let isSearching = false;

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuthentication()) return;
    loadBookmarks();
    initSearchListener();
});

// 1. Authentication Check
function checkAuthentication() {
    if (!api.isLoggedIn()) {
        showUnauthorizedState();
        return false;
    }
    return true;
}

function showUnauthorizedState() {
    const grid = document.getElementById('bookmarksGrid');
    const skeleton = document.getElementById('skeletonContainer');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');

    if (skeleton) skeleton.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';

    if (grid) {
        grid.style.display = 'block';
        grid.innerHTML = `
            <div class="empty-bookmark-state">
                <div class="empty-bookmark-icon">🔒</div>
                <h2 class="empty-bookmark-title">Authentication Required</h2>
                <p class="empty-bookmark-desc">Please login to view your saved bookmarks.</p>
                <a href="login.html" class="btn btn-primary">[ Login ]</a>
            </div>
        `;
    }
    showToast('Please login to view your bookmarks.', 'info');
}

// 2. Load Bookmarks from API
async function loadBookmarks() {
    const grid = document.getElementById('bookmarksGrid');
    const skeleton = document.getElementById('skeletonContainer');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');

    // Show skeleton loaders
    if (skeleton) skeleton.style.display = 'grid';
    if (grid) grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';

    try {
        const res = await api.getBookmarks();
        if (skeleton) skeleton.style.display = 'none';

        if (res.success) {
            allBookmarks = Array.isArray(res.data) ? res.data : (res.data.posts || []);
            renderBookmarks(allBookmarks);
            updateBookmarkCount(allBookmarks.length);
        } else {
            showErrorState(res.message || 'Unable to load bookmarks. Please try again.');
        }
    } catch (error) {
        if (skeleton) skeleton.style.display = 'none';
        if (error.message && error.message.includes('401')) {
            showUnauthorizedState();
        } else {
            showErrorState('Unable to load bookmarks. Please try again.');
        }
    }
}

// 3. Render Bookmarks Grid or Empty State
function renderBookmarks(posts) {
    const grid = document.getElementById('bookmarksGrid');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');

    if (errorState) errorState.style.display = 'none';

    if (!posts || posts.length === 0) {
        if (grid) grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (grid) {
        grid.style.display = 'grid';
        grid.innerHTML = posts.map(post => createBookmarkCardHTML(post)).join('');
    }
}

// Helper: Build Card HTML
function createBookmarkCardHTML(post) {
    const title = escapeHTML(post.title || 'Untitled Story');
    const excerpt = escapeHTML(post.excerpt || (post.content ? post.content.substring(0, 120) + '...' : 'No description available.'));
    const category = escapeHTML(post.category_name || (post.category ? post.category.name : 'General'));
    const author = escapeHTML(post.author_name || (post.author ? post.author.full_name : 'Author'));
    const image = post.image || post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80';
    const readingTime = post.reading_time || '3 min read';
    const views = post.views || 0;
    const likes = post.like_count || 0;

    return `
        <article class="bookmark-card" id="bookmark-card-${post.id}">
            <div class="bookmark-card-img-wrap">
                <img src="${image}" class="bookmark-card-img" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80'">
                <span class="bookmark-card-category">${category}</span>
            </div>
            <div class="bookmark-card-body">
                <h3 class="bookmark-card-title">
                    <a href="post.html?id=${post.id}">${title}</a>
                </h3>
                <p class="bookmark-card-excerpt">${excerpt}</p>
                
                <div class="bookmark-card-meta">
                    <span>${author} · ${readingTime}</span>
                    <span>👁️ ${views} · ❤️ ${likes}</span>
                </div>

                <div class="bookmark-card-actions">
                    <button class="btn-remove-bookmark" onclick="removeBookmark(${post.id})">
                        🔖 Remove Bookmark
                    </button>
                    <a href="post.html?id=${post.id}" class="btn-read-article">
                        📖 Read Article
                    </a>
                </div>
            </div>
        </article>
    `;
}

// 4. Remove Bookmark
async function removeBookmark(id) {
    try {
        const res = await api.unbookmarkPost(id);
        if (res.success) {
            // Animate card removal
            const cardEl = document.getElementById(`bookmark-card-${id}`);
            if (cardEl) {
                cardEl.style.opacity = '0';
                cardEl.style.transform = 'scale(0.9)';
                setTimeout(() => cardEl.remove(), 250);
            }

            // Update in-memory list
            allBookmarks = allBookmarks.filter(p => p.id !== id);
            updateBookmarkCount(allBookmarks.length);
            showToast('Bookmark removed successfully.', 'info');

            // If empty, show empty state view immediately
            if (allBookmarks.length === 0) {
                setTimeout(() => renderBookmarks([]), 300);
            }
        } else {
            showToast(res.message || 'Failed to remove bookmark', 'error');
        }
    } catch (e) {
        showToast(e.message || 'Failed to remove bookmark', 'error');
    }
}

// 5. Search Bookmarks
function initSearchListener() {
    const searchInput = document.getElementById('searchBookmarksInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchBookmarks(query);
    });
}

function searchBookmarks(query = '') {
    if (!query) {
        isSearching = false;
        renderBookmarks(allBookmarks);
        return;
    }

    isSearching = true;
    const filtered = allBookmarks.filter(post => {
        const titleMatch = (post.title || '').toLowerCase().includes(query);
        const authorMatch = (post.author_name || (post.author ? post.author.full_name : '')).toLowerCase().includes(query);
        const categoryMatch = (post.category_name || (post.category ? post.category.name : '')).toLowerCase().includes(query);
        const tagsMatch = (post.tags || []).some(t => (t.name || '').toLowerCase().includes(query));
        return titleMatch || authorMatch || categoryMatch || tagsMatch;
    });

    renderBookmarks(filtered);
}

// 6. Update Navbar Bookmark Counter
function updateBookmarkCount(count) {
    if (typeof count === 'number') {
        applyNavbarBookmarkBadge(count);
    } else {
        fetchAndUpdateGlobalCount();
    }
}

async function fetchAndUpdateGlobalCount() {
    if (!api.isLoggedIn()) return;
    try {
        const res = await api.getBookmarks();
        if (res.success) {
            const posts = Array.isArray(res.data) ? res.data : (res.data.posts || []);
            applyNavbarBookmarkBadge(posts.length);
        }
    } catch (e) {}
}

function applyNavbarBookmarkBadge(count) {
    const navLinks = document.querySelectorAll('.nav-link, a[href="bookmarks.html"], a[href="frontend/bookmarks.html"]');
    navLinks.forEach(link => {
        if (link.getAttribute('href') && link.getAttribute('href').includes('bookmarks.html')) {
            link.innerHTML = `🔖 Bookmarks <span style="background: var(--primary); color: white; border-radius: 999px; padding: 0.15rem 0.55rem; font-size: 0.75rem; margin-left: 0.3rem;">${count}</span>`;
        }
    });
}

// Error State View
function showErrorState(message) {
    const grid = document.getElementById('bookmarksGrid');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');

    if (grid) grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    if (errorState) {
        errorState.style.display = 'block';
        errorState.innerHTML = `
            <div class="error-bookmark-state">
                <div style="font-size: 3rem; margin-bottom: 0.8rem;">⚠️</div>
                <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem;">Error Loading Bookmarks</h3>
                <p style="color: var(--text-muted); margin-bottom: 1.2rem;">${escapeHTML(message)}</p>
                <button onclick="loadBookmarks()" class="btn btn-primary">[ Retry ]</button>
            </div>
        `;
    }
}

// Export functions for HTML inline triggers
window.loadBookmarks = loadBookmarks;
window.removeBookmark = removeBookmark;
window.updateBookmarkCount = updateBookmarkCount;
