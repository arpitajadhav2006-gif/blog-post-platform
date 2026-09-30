/**
 * BlogSphere - Profile & Creator Management
 * Handles author profile rendering, user tabs (published, drafts, liked, bookmarked),
 * follow/unfollow interactions, and edit profile updates.
 */

const Profile = {
  getProfileUser() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUsername = urlParams.get('user');
    const users = BlogSphereDB.getData(BlogSphereDB.KEYS.USERS, []);

    if (targetUsername) {
      const found = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
      if (found) return { user: found, isSelf: this.isCurrentUser(found.id) };
    }

    // Default to current logged-in user
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
      const found = users.find(u => u.id === currentUser.id) || currentUser;
      return { user: found, isSelf: true };
    }

    return { user: null, isSelf: false };
  },

  isCurrentUser(userId) {
    const current = Auth.getCurrentUser();
    return current && current.id === userId;
  },

  isFollowing(targetUserId) {
    const current = Auth.getCurrentUser();
    if (!current) return false;
    const follows = BlogSphereDB.getData(BlogSphereDB.KEYS.FOLLOWS, []);
    return follows.some(f => f.followerId === current.id && f.followingId === targetUserId);
  },

  toggleFollow(targetUserId, btnElement) {
    const current = Auth.getCurrentUser();
    if (!current) {
      showToast('Please log in to follow creators.', 'warning');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      return;
    }

    if (current.id === targetUserId) {
      showToast('You cannot follow yourself.', 'info');
      return;
    }

    let follows = BlogSphereDB.getData(BlogSphereDB.KEYS.FOLLOWS, []);
    let users = BlogSphereDB.getData(BlogSphereDB.KEYS.USERS, []);
    const targetIndex = users.findIndex(u => u.id === targetUserId);
    const targetUser = users[targetIndex];

    const existingIndex = follows.findIndex(f => f.followerId === current.id && f.followingId === targetUserId);
    let isNowFollowing = false;

    if (existingIndex !== -1) {
      follows.splice(existingIndex, 1);
      if (targetUser) targetUser.followersCount = Math.max(0, (targetUser.followersCount || 1) - 1);
      isNowFollowing = false;
      showToast(`Unfollowed @${targetUser ? targetUser.username : ''}`, 'info');
    } else {
      follows.push({ followerId: current.id, followingId: targetUserId, createdAt: new Date().toISOString() });
      if (targetUser) targetUser.followersCount = (targetUser.followersCount || 0) + 1;
      isNowFollowing = true;
      showToast(`Now following @${targetUser ? targetUser.username : ''}!`, 'success');
    }

    BlogSphereDB.saveData(BlogSphereDB.KEYS.FOLLOWS, follows);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.USERS, users);

    // Update UI
    if (btnElement) {
      if (isNowFollowing) {
        btnElement.classList.add('btn-following');
        btnElement.innerHTML = '<i class="fa-solid fa-user-check"></i> Following';
      } else {
        btnElement.classList.remove('btn-following');
        btnElement.innerHTML = '<i class="fa-solid fa-user-plus"></i> Follow';
      }
    }

    const followersCountEl = document.getElementById('followersCount');
    if (followersCountEl && targetUser) {
      followersCountEl.textContent = targetUser.followersCount;
    }
  },

  renderProfileHeader(user, isSelf) {
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const usernameEl = document.getElementById('profileUsername');
    const bioEl = document.getElementById('profileBio');
    const locationEl = document.getElementById('profileLocation');
    const joinedEl = document.getElementById('profileJoined');
    const postsCountEl = document.getElementById('postsCount');
    const followersCountEl = document.getElementById('followersCount');
    const followingCountEl = document.getElementById('followingCount');
    const actionContainer = document.getElementById('profileActions');

    if (avatarEl) {
      avatarEl.src = user.avatar || 'assets/images/avatar-default.svg';
      avatarEl.alt = user.name;
    }
    if (nameEl) nameEl.textContent = user.name;
    if (usernameEl) usernameEl.textContent = `@${user.username}`;
    if (bioEl) bioEl.textContent = user.bio || 'Exploring ideas and sharing knowledge on BlogSphere.';
    if (locationEl) locationEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(user.location || 'Remote')}`;
    if (joinedEl) joinedEl.innerHTML = `<i class="fa-regular fa-calendar"></i> Joined ${escapeHtml(user.joinedDate || 'Recently')}`;

    // Calculate actual post count
    const posts = Posts.getAllPosts().filter(p => p.authorId === user.id || p.authorUsername === user.username);
    if (postsCountEl) postsCountEl.textContent = posts.length;
    if (followersCountEl) followersCountEl.textContent = user.followersCount || 0;
    if (followingCountEl) followingCountEl.textContent = user.followingCount || 0;

    // Action button (Edit Profile if self, Follow if someone else)
    if (actionContainer) {
      if (isSelf) {
        actionContainer.innerHTML = `
          <button id="openEditModalBtn" class="btn btn-outline" onclick="Profile.openEditModal()">
            <i class="fa-solid fa-pen"></i> Edit Profile
          </button>
          <a href="create-post.html" class="btn btn-primary">
            <i class="fa-solid fa-plus"></i> New Story
          </a>
        `;
      } else {
        const isFollowing = this.isFollowing(user.id);
        actionContainer.innerHTML = `
          <button 
            id="followUserBtn" 
            class="btn ${isFollowing ? 'btn-following' : 'btn-primary'}" 
            onclick="Profile.toggleFollow('${user.id}', this)"
          >
            <i class="fa-solid ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i> ${isFollowing ? 'Following' : 'Follow'}
          </button>
        `;
      }
    }
  },

  renderTabs(user, isSelf) {
    const tabHeaders = document.querySelectorAll('.profile-tab-btn');
    const allPosts = Posts.getAllPosts();
    const userPosts = allPosts.filter(p => p.authorId === user.id || p.authorUsername === user.username);

    // If viewing someone else, hide Drafts and Bookmarks tabs
    if (!isSelf) {
      const draftsTab = document.querySelector('[data-tab="drafts"]');
      const bookmarksTab = document.querySelector('[data-tab="bookmarked"]');
      if (draftsTab) draftsTab.style.display = 'none';
      if (bookmarksTab) bookmarksTab.style.display = 'none';
    }

    // Attach click events
    tabHeaders.forEach(btn => {
      btn.addEventListener('click', () => {
        tabHeaders.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabName = btn.getAttribute('data-tab');
        this.switchTabContent(tabName, user, isSelf);
      });
    });

    // Default to published
    this.switchTabContent('published', user, isSelf);
  },

  switchTabContent(tabName, user, isSelf) {
    const container = document.getElementById('profileTabContent');
    if (!container) return;

    if (tabName === 'published') {
      const posts = Posts.getAllPosts().filter(p => p.authorId === user.id || p.authorUsername === user.username);
      if (posts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-regular fa-newspaper"></i></div>
            <h3 class="empty-state-title">No published stories</h3>
            <p class="empty-state-desc">${isSelf ? 'You have not published any stories yet. Share your knowledge with the world!' : 'This author has not published any stories yet.'}</p>
            ${isSelf ? '<a href="create-post.html" class="btn btn-primary"><i class="fa-solid fa-pen-nib"></i> Write Your First Story</a>' : ''}
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="posts-grid">
          ${posts.map(p => this.renderProfilePostCard(p, isSelf)).join('')}
        </div>
      `;
    } 
    else if (tabName === 'drafts' && isSelf) {
      const drafts = Posts.getAllDrafts(user.id);
      if (drafts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-regular fa-file-lines"></i></div>
            <h3 class="empty-state-title">No saved drafts</h3>
            <p class="empty-state-desc">When you begin drafting an idea without publishing, it will appear here safely.</p>
            <a href="create-post.html" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Start a Draft</a>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="drafts-list">
          ${drafts.map(d => `
            <div class="draft-card">
              <div class="draft-info">
                <span class="badge badge-purple">${escapeHtml(d.category)}</span>
                <h4 class="draft-title">${escapeHtml(d.title)}</h4>
                <p class="draft-snippet">${escapeHtml(d.subtitle || d.content.replace(/<[^>]*>?/gm, '').substring(0, 100))}</p>
                <div class="draft-meta">Last updated: ${escapeHtml(d.dateFormatted || 'Recently')}</div>
              </div>
              <div class="draft-actions">
                <a href="create-post.html?draft=${d.id}" class="btn btn-sm btn-outline"><i class="fa-solid fa-pen"></i> Edit</a>
                <button class="btn btn-sm btn-danger-outline" onclick="Profile.deleteDraftItem('${d.id}')"><i class="fa-solid fa-trash-can"></i> Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    else if (tabName === 'liked') {
      const likes = BlogSphereDB.getData(BlogSphereDB.KEYS.LIKES, []);
      const userLikedPostIds = likes.filter(l => l.userId === user.id).map(l => l.postId);
      const allPosts = Posts.getAllPosts();
      const likedPosts = allPosts.filter(p => userLikedPostIds.includes(p.id));

      if (likedPosts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-regular fa-heart"></i></div>
            <h3 class="empty-state-title">No liked stories</h3>
            <p class="empty-state-desc">${isSelf ? 'Stories you like will be archived here for easy discovery.' : 'This creator has not liked any stories yet.'}</p>
            <a href="explore.html" class="btn btn-outline"><i class="fa-solid fa-compass"></i> Explore Stories</a>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="posts-grid">
          ${likedPosts.map(p => Posts.renderPostCard(p)).join('')}
        </div>
      `;
    }
    else if (tabName === 'bookmarked' && isSelf) {
      const bookmarks = BlogSphereDB.getData(BlogSphereDB.KEYS.BOOKMARKS, []);
      const userBookmarkedIds = bookmarks.filter(b => b.userId === user.id).map(b => b.postId);
      const allPosts = Posts.getAllPosts();
      const bookmarkedPosts = allPosts.filter(p => userBookmarkedIds.includes(p.id));

      if (bookmarkedPosts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-regular fa-bookmark"></i></div>
            <h3 class="empty-state-title">No saved bookmarks</h3>
            <p class="empty-state-desc">Bookmark intriguing articles while reading to reference them anytime.</p>
            <a href="explore.html" class="btn btn-primary"><i class="fa-solid fa-magnifying-glass"></i> Explore Stories</a>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="posts-grid">
          ${bookmarkedPosts.map(p => Posts.renderPostCard(p)).join('')}
        </div>
      `;
    }
  },

  renderProfilePostCard(post, isSelf) {
    const cardHtml = Posts.renderPostCard(post);
    if (!isSelf) return cardHtml;

    // Inject Edit / Delete toolbar for the author
    return `
      <div class="author-post-wrapper">
        <div class="author-post-toolbar">
          <a href="create-post.html?edit=${post.id}" class="author-tool-btn edit" title="Edit Story">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </a>
          <button class="author-tool-btn delete" onclick="Profile.deletePostItem('${post.id}')" title="Delete Story">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </div>
        ${cardHtml}
      </div>
    `;
  },

  deletePostItem(postId) {
    if (Posts.deletePost(postId)) {
      const { user, isSelf } = this.getProfileUser();
      this.switchTabContent('published', user, isSelf);
      const postsCountEl = document.getElementById('postsCount');
      if (postsCountEl) {
        const posts = Posts.getAllPosts().filter(p => p.authorId === user.id);
        postsCountEl.textContent = posts.length;
      }
    }
  },

  deleteDraftItem(draftId) {
    if (confirm('Are you sure you want to delete this draft?')) {
      if (Posts.deleteDraft(draftId)) {
        const { user, isSelf } = this.getProfileUser();
        this.switchTabContent('drafts', user, isSelf);
      }
    }
  },

  // Edit Profile Modal Handling
  openEditModal() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    let modal = document.getElementById('editProfileModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'editProfileModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Edit Profile</h3>
          <button class="modal-close-btn" onclick="Profile.closeEditModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="editProfileForm" class="modal-body" onsubmit="Profile.saveProfileChanges(event)">
          <div class="avatar-preview-box">
            <img id="avatarPreviewImg" src="${user.avatar || 'assets/images/avatar-default.svg'}" alt="Preview" onerror="handleAvatarError(this)" class="modal-avatar-preview">
            <div class="form-group flex-1">
              <label for="editAvatarUrl" class="form-label">Avatar Image URL</label>
              <input type="url" id="editAvatarUrl" class="form-input" value="${escapeHtml(user.avatar || '')}" placeholder="https://example.com/avatar.jpg">
            </div>
          </div>

          <div class="form-group">
            <label for="editFullName" class="form-label">Full Name</label>
            <input type="text" id="editFullName" class="form-input" value="${escapeHtml(user.name)}" required minlength="2">
          </div>

          <div class="form-group">
            <label for="editBio" class="form-label">Bio</label>
            <textarea id="editBio" class="form-textarea" rows="3" placeholder="Tell readers about yourself...">${escapeHtml(user.bio || '')}</textarea>
          </div>

          <div class="form-group">
            <label for="editLocation" class="form-label">Location</label>
            <input type="text" id="editLocation" class="form-input" value="${escapeHtml(user.location || '')}" placeholder="e.g. San Francisco, CA">
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" onclick="Profile.closeEditModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Save Changes</button>
          </div>
        </form>
      </div>
    `;

    // Live avatar preview listener
    const avatarInput = modal.querySelector('#editAvatarUrl');
    const previewImg = modal.querySelector('#avatarPreviewImg');
    if (avatarInput && previewImg) {
      avatarInput.addEventListener('input', () => {
        previewImg.src = avatarInput.value.trim() || 'assets/images/avatar-default.svg';
      });
    }

    modal.classList.add('active');
  },

  closeEditModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.remove('active');
  },

  saveProfileChanges(e) {
    e.preventDefault();
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;

    const name = document.getElementById('editFullName').value.trim();
    const avatar = document.getElementById('editAvatarUrl').value.trim() || 'assets/images/avatar-default.svg';
    const bio = document.getElementById('editBio').value.trim();
    const location = document.getElementById('editLocation').value.trim();

    if (!name || name.length < 2) {
      showToast('Name must be at least 2 characters.', 'error');
      return;
    }

    // Update in users array
    let users = BlogSphereDB.getData(BlogSphereDB.KEYS.USERS, []);
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
      users[userIndex].name = name;
      users[userIndex].avatar = avatar;
      users[userIndex].bio = bio;
      users[userIndex].location = location;
      BlogSphereDB.saveData(BlogSphereDB.KEYS.USERS, users);

      // Update currentUser
      Auth.setCurrentUser(users[userIndex]);

      // Update authored posts author metadata
      let posts = Posts.getAllPosts();
      posts.forEach(p => {
        if (p.authorId === currentUser.id) {
          p.authorName = name;
          p.authorAvatar = avatar;
        }
      });
      BlogSphereDB.saveData(BlogSphereDB.KEYS.POSTS, posts);

      showToast('Profile updated successfully!', 'success');
      this.closeEditModal();

      // Refresh view
      this.renderProfileHeader(users[userIndex], true);
      this.switchTabContent('published', users[userIndex], true);

      // Also update navbar avatar if present
      const navAvatar = document.querySelector('.nav-user-avatar');
      if (navAvatar) navAvatar.src = avatar;
    }
  }
};

window.Profile = Profile;
