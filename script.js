// ==========================================
// BLOGSPHERE AI - COMPATIBILITY SCRIPT MODULE
// ==========================================

// Global helpers if referenced by older components
window.getPostsFromAPI = async function(params) {
    try {
        return await api.getPosts(params);
    } catch (e) {
        return { success: false, message: e.message };
    }
};

window.bookmarkPostAction = async function(postId) {
    if (!api.isLoggedIn()) {
        showToast('Please login to save articles.', 'info');
        return false;
    }
    try {
        const res = await api.bookmarkPost(postId);
        if (res.success) {
            showToast('🔖 Saved to your bookmarks!', 'success');
            if (typeof updateBookmarkCount === 'function') updateBookmarkCount();
            return true;
        }
    } catch (e) {
        showToast(e.message || 'Bookmark operation failed', 'error');
    }
    return false;
};
