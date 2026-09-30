/**
 * BlogSphere - Posts & Articles Management
 * Handles post rendering, feeds, create/edit/delete, likes, comments, bookmarks, and sharing.
 */

const Posts = {
  getAllPosts() {
    return BlogSphereDB.getData(BlogSphereDB.KEYS.POSTS, []);
  },

  getPostById(id) {
    const posts = this.getAllPosts();
    return posts.find(p => p.id === id) || null;
  },

  getAllDrafts(userId) {
    const drafts = BlogSphereDB.getData(BlogSphereDB.KEYS.DRAFTS, []);
    return userId ? drafts.filter(d => d.authorId === userId) : drafts;
  },

  getDraftById(id) {
    const drafts = BlogSphereDB.getData(BlogSphereDB.KEYS.DRAFTS, []);
    return drafts.find(d => d.id === id) || null;
  },

  isPostLiked(postId, userId) {
    if (!userId) return false;
    const likes = BlogSphereDB.getData(BlogSphereDB.KEYS.LIKES, []);
    return likes.some(l => l.postId === postId && l.userId === userId);
  },

  isPostBookmarked(postId, userId) {
    if (!userId) return false;
    const bookmarks = BlogSphereDB.getData(BlogSphereDB.KEYS.BOOKMARKS, []);
    return bookmarks.some(b => b.postId === postId && b.userId === userId);
  },

  toggleLike(postId, btnElement = null) {
    const user = Auth.getCurrentUser();
    if (!user) {
      showToast('Please log in to like posts.', 'warning');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      return false;
    }

    let likes = BlogSphereDB.getData(BlogSphereDB.KEYS.LIKES, []);
    let posts = this.getAllPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return false;

    const existingIndex = likes.findIndex(l => l.postId === postId && l.userId === user.id);
    let isLiked = false;

    if (existingIndex !== -1) {
      // Remove like
      likes.splice(existingIndex, 1);
      posts[postIndex].likesCount = Math.max(0, (posts[postIndex].likesCount || 1) - 1);
      isLiked = false;
      showToast('Removed from liked posts', 'info');
    } else {
      // Add like
      likes.push({ postId, userId: user.id, likedAt: new Date().toISOString() });
      posts[postIndex].likesCount = (posts[postIndex].likesCount || 0) + 1;
      isLiked = true;
      showToast('Post liked!', 'success');
    }

    BlogSphereDB.saveData(BlogSphereDB.KEYS.LIKES, likes);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.POSTS, posts);

    // Update UI elements for this post across the page
    const likeButtons = document.querySelectorAll(`[data-like-post="${postId}"]`);
    likeButtons.forEach(btn => {
      const countEl = btn.querySelector('.like-count');
      const icon = btn.querySelector('i');
      if (countEl) countEl.textContent = posts[postIndex].likesCount;
      if (isLiked) {
        btn.classList.add('active');
        if (icon) icon.className = 'fa-solid fa-heart';
      } else {
        btn.classList.remove('active');
        if (icon) icon.className = 'fa-regular fa-heart';
      }
    });

    return isLiked;
  },

  toggleBookmark(postId, btnElement = null) {
    const user = Auth.getCurrentUser();
    if (!user) {
      showToast('Please log in to bookmark stories.', 'warning');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      return false;
    }

    let bookmarks = BlogSphereDB.getData(BlogSphereDB.KEYS.BOOKMARKS, []);
    const existingIndex = bookmarks.findIndex(b => b.postId === postId && b.userId === user.id);
    let isBookmarked = false;

    if (existingIndex !== -1) {
      bookmarks.splice(existingIndex, 1);
      isBookmarked = false;
      showToast('Removed from bookmarks.', 'info');
    } else {
      bookmarks.push({ postId, userId: user.id, savedAt: new Date().toISOString() });
      isBookmarked = true;
      showToast('Post bookmarked!', 'success');
    }

    BlogSphereDB.saveData(BlogSphereDB.KEYS.BOOKMARKS, bookmarks);

    // Update UI elements for this post across page
    const bookmarkButtons = document.querySelectorAll(`[data-bookmark-post="${postId}"]`);
    bookmarkButtons.forEach(btn => {
      const icon = btn.querySelector('i');
      if (isBookmarked) {
        btn.classList.add('active');
        if (icon) icon.className = 'fa-solid fa-bookmark';
      } else {
        btn.classList.remove('active');
        if (icon) icon.className = 'fa-regular fa-bookmark';
      }
    });

    return isBookmarked;
  },

  sharePost(postId, postTitle) {
    const postUrl = `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/post.html?id=${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: postTitle || 'BlogSphere Story',
        text: `Check out this story on BlogSphere: "${postTitle}"`,
        url: postUrl
      }).then(() => {
        showToast('Shared successfully!', 'success');
      }).catch(err => {
        if (err.name !== 'AbortError') {
          this.copyToClipboard(postUrl);
        }
      });
    } else {
      this.copyToClipboard(postUrl);
    }
  },

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!', 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  },

  fallbackCopy(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast('Link copied to clipboard!', 'success');
    } catch (e) {
      showToast('Unable to copy link.', 'error');
    }
    document.body.removeChild(tempInput);
  },

  renderPostCard(post) {
    const currentUser = Auth.getCurrentUser();
    const isLiked = this.isPostLiked(post.id, currentUser ? currentUser.id : null);
    const isBookmarked = this.isPostBookmarked(post.id, currentUser ? currentUser.id : null);
    
    // Snippet extraction
    const rawSnippet = post.subtitle || post.content.replace(/<[^>]*>?/gm, '').substring(0, 130) + '...';

    return `
      <article class="post-card" data-id="${post.id}">
        <div class="post-card-cover-wrap">
          <a href="post.html?id=${post.id}" class="post-card-cover-link">
            <img 
              src="${post.coverImage}" 
              alt="${escapeHtml(post.title)}" 
              loading="lazy" 
              class="post-card-img"
              onerror="handleImageError(this)"
            />
          </a>
          <span class="post-card-category badge badge-gradient">${escapeHtml(post.category)}</span>
        </div>

        <div class="post-card-body">
          <div class="post-card-meta">
            <div class="author-inline">
              <a href="profile.html?user=${post.authorUsername}" class="author-avatar-link">
                <img src="${post.authorAvatar}" alt="${escapeHtml(post.authorName)}" class="author-mini-avatar" onerror="handleAvatarError(this)">
              </a>
              <div class="author-mini-details">
                <a href="profile.html?user=${post.authorUsername}" class="author-mini-name">${escapeHtml(post.authorName)}</a>
                <span class="post-mini-date">${escapeHtml(post.dateFormatted || 'Recently')} &bull; ${escapeHtml(post.readTime || '5 min read')}</span>
              </div>
            </div>
          </div>

          <h3 class="post-card-title">
            <a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a>
          </h3>

          <p class="post-card-snippet">${escapeHtml(rawSnippet)}</p>

          <div class="post-card-tags">
            ${(post.tags || []).slice(0, 3).map(tag => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join('')}
          </div>

          <div class="post-card-footer">
            <div class="post-actions-group">
              <button 
                class="action-btn like-btn ${isLiked ? 'active' : ''}" 
                data-like-post="${post.id}" 
                onclick="Posts.toggleLike('${post.id}', this)"
                title="Like story"
                aria-label="Like story"
              >
                <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                <span class="like-count">${post.likesCount || 0}</span>
              </button>

              <a href="post.html?id=${post.id}#comments" class="action-btn comment-btn" title="Comments">
                <i class="fa-regular fa-comment"></i>
                <span>${post.commentsCount || 0}</span>
              </a>

              <button 
                class="action-btn bookmark-btn ${isBookmarked ? 'active' : ''}" 
                data-bookmark-post="${post.id}" 
                onclick="Posts.toggleBookmark('${post.id}', this)"
                title="Save story"
                aria-label="Save story"
              >
                <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
              </button>

              <button 
                class="action-btn share-btn" 
                onclick="Posts.sharePost('${post.id}', '${escapeHtml(post.title.replace(/'/g, "\\'"))}')"
                title="Share story"
                aria-label="Share story"
              >
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
              </button>
            </div>

            <a href="post.html?id=${post.id}" class="read-more-link">
              Read <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  },

  renderFeed(posts, containerElement) {
    if (!containerElement) return;
    if (!posts || posts.length === 0) {
      containerElement.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-feather-pointed"></i></div>
          <h3 class="empty-state-title">No stories found</h3>
          <p class="empty-state-desc">There are no published stories in this section right now.</p>
          <a href="create-post.html" class="btn btn-primary"><i class="fa-solid fa-pen-nib"></i> Write First Story</a>
        </div>
      `;
      return;
    }

    containerElement.innerHTML = posts.map(post => this.renderPostCard(post)).join('');
  },

  saveDraft({ id, title, subtitle, category, tags, coverImage, content }) {
    const user = Auth.requireAuth();
    if (!user) return false;

    if (!title || title.trim().length === 0) {
      showToast('Please enter at least a title for the draft.', 'warning');
      return false;
    }

    let drafts = BlogSphereDB.getData(BlogSphereDB.KEYS.DRAFTS, []);
    const draftId = id || BlogSphereDB.generateId('draft');
    const existingIndex = drafts.findIndex(d => d.id === draftId);

    const draftData = {
      id: draftId,
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      category: category || 'Technology',
      tags: tags || [],
      coverImage: coverImage || 'assets/images/placeholder.svg',
      content: content || '',
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      updatedAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    if (existingIndex !== -1) {
      drafts[existingIndex] = draftData;
    } else {
      drafts.unshift(draftData);
    }

    BlogSphereDB.saveData(BlogSphereDB.KEYS.DRAFTS, drafts);
    showToast('Draft saved successfully!', 'success');
    return draftData;
  },

  publishPost({ id, title, subtitle, category, tags, coverImage, content, draftId = null }) {
    const user = Auth.requireAuth();
    if (!user) return false;

    // Strict Validations
    if (!title || title.trim().length < 5) {
      showToast('Blog title must be at least 5 characters.', 'error');
      return false;
    }
    if (!category) {
      showToast('Please select a valid category.', 'error');
      return false;
    }
    if (!content || content.trim().replace(/<[^>]*>?/gm, '').length < 30) {
      showToast('Article content is too short. Please write more details.', 'error');
      return false;
    }

    let posts = this.getAllPosts();
    const postId = id || BlogSphereDB.generateId('post');
    const existingIndex = posts.findIndex(p => p.id === postId);

    // Calculate approximate read time
    const wordCount = content.replace(/<[^>]*>?/gm, ' ').split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.ceil(wordCount / 180));

    const postData = {
      id: postId,
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      category: category.trim(),
      tags: tags && tags.length ? tags : [category.trim()],
      coverImage: coverImage && coverImage.trim() ? coverImage.trim() : 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      content: content,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorAvatar: user.avatar || 'assets/images/avatar-default.svg',
      publishedAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: `${readMinutes} min read`,
      likesCount: existingIndex !== -1 ? (posts[existingIndex].likesCount || 0) : 0,
      commentsCount: existingIndex !== -1 ? (posts[existingIndex].commentsCount || 0) : 0,
      featured: false
    };

    if (existingIndex !== -1) {
      posts[existingIndex] = { ...posts[existingIndex], ...postData };
    } else {
      posts.unshift(postData);
    }

    BlogSphereDB.saveData(BlogSphereDB.KEYS.POSTS, posts);

    // If published from draft, clean up that draft
    if (draftId) {
      let drafts = BlogSphereDB.getData(BlogSphereDB.KEYS.DRAFTS, []);
      drafts = drafts.filter(d => d.id !== draftId);
      BlogSphereDB.saveData(BlogSphereDB.KEYS.DRAFTS, drafts);
    }

    showToast('Blog published successfully!', 'success');
    setTimeout(() => {
      window.location.href = `post.html?id=${postId}`;
    }, 600);

    return postData;
  },

  deletePost(postId) {
    const user = Auth.requireAuth();
    if (!user) return false;

    let posts = this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      showToast('Post not found.', 'error');
      return false;
    }

    if (post.authorId !== user.id && user.username !== 'alexrivera') {
      showToast('You are not authorized to delete this post.', 'error');
      return false;
    }

    if (!confirm('Are you sure you want to permanently delete this story?')) {
      return false;
    }

    // Remove post
    posts = posts.filter(p => p.id !== postId);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.POSTS, posts);

    // Clean likes, bookmarks, comments
    let likes = BlogSphereDB.getData(BlogSphereDB.KEYS.LIKES, []);
    likes = likes.filter(l => l.postId !== postId);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.LIKES, likes);

    let bookmarks = BlogSphereDB.getData(BlogSphereDB.KEYS.BOOKMARKS, []);
    bookmarks = bookmarks.filter(b => b.postId !== postId);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.BOOKMARKS, bookmarks);

    let comments = BlogSphereDB.getData(BlogSphereDB.KEYS.COMMENTS, []);
    comments = comments.filter(c => c.postId !== postId);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.COMMENTS, comments);

    showToast('Story deleted successfully.', 'info');
    return true;
  },

  deleteDraft(draftId) {
    const user = Auth.requireAuth();
    if (!user) return false;

    let drafts = BlogSphereDB.getData(BlogSphereDB.KEYS.DRAFTS, []);
    drafts = drafts.filter(d => d.id !== draftId);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.DRAFTS, drafts);
    showToast('Draft removed.', 'info');
    return true;
  },

  // Comments System
  getCommentsForPost(postId) {
    const comments = BlogSphereDB.getData(BlogSphereDB.KEYS.COMMENTS, []);
    return comments.filter(c => c.postId === postId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  addComment(postId, content) {
    const user = Auth.requireAuth();
    if (!user) return false;

    content = (content || '').trim();
    if (!content) {
      showToast('Comment cannot be empty.', 'warning');
      return false;
    }

    const comments = BlogSphereDB.getData(BlogSphereDB.KEYS.COMMENTS, []);
    const newComment = {
      id: BlogSphereDB.generateId('comm'),
      postId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar || 'assets/images/avatar-default.svg',
      content,
      createdAt: new Date().toISOString(),
      dateFormatted: 'Just now'
    };

    comments.unshift(newComment);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.COMMENTS, comments);

    // Update post commentsCount
    let posts = this.getAllPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      posts[postIndex].commentsCount = (posts[postIndex].commentsCount || 0) + 1;
      BlogSphereDB.saveData(BlogSphereDB.KEYS.POSTS, posts);
    }

    showToast('Comment added!', 'success');
    return newComment;
  },

  deleteComment(commentId, postId) {
    const user = Auth.getCurrentUser();
    if (!user) return false;

    let comments = BlogSphereDB.getData(BlogSphereDB.KEYS.COMMENTS, []);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return false;

    if (comment.userId !== user.id) {
      showToast('You can only delete your own comments.', 'error');
      return false;
    }

    comments = comments.filter(c => c.id !== commentId);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.COMMENTS, comments);

    // Decrement post commentsCount
    let posts = this.getAllPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      posts[postIndex].commentsCount = Math.max(0, (posts[postIndex].commentsCount || 1) - 1);
      BlogSphereDB.saveData(BlogSphereDB.KEYS.POSTS, posts);
    }

    showToast('Comment deleted.', 'info');
    return true;
  }
};

window.Posts = Posts;
