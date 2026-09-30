/**
 * BlogSphere - Authentication & Session Management
 * Handles sign up, sign in, logout, route guards, validation, and user session state.
 */

// Route Guards & Authentication Helpers
const Auth = {
  getCurrentUser() {
    return BlogSphereDB.getData(BlogSphereDB.KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user) {
    // Keep credentials safe from session storage if needed, but persist id and basic profile
    const safeUser = { ...user };
    delete safeUser.password;
    BlogSphereDB.saveData(BlogSphereDB.KEYS.CURRENT_USER, safeUser);
    return safeUser;
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  logout() {
    BlogSphereDB.removeData(BlogSphereDB.KEYS.CURRENT_USER);
    if (window.showToast) {
      showToast('Logged out successfully.', 'info');
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 600);
  },

  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      const currentPath = window.location.pathname.split('/').pop() || 'home.html';
      const search = window.location.search;
      const redirectTarget = encodeURIComponent(currentPath + search);
      window.location.href = `login.html?redirect=${redirectTarget}`;
      return false;
    }
    return user;
  },

  redirectIfAuth(target = 'home.html') {
    const user = this.getCurrentUser();
    if (user) {
      window.location.href = target;
      return true;
    }
    return false;
  },

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).trim().toLowerCase());
  },

  validateUsername(username) {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(String(username).trim());
  },

  calculatePasswordStrength(password) {
    if (!password || password.length === 0) return { score: 0, text: '', class: '' };
    if (password.length < 6) return { score: 1, text: 'Too Short (min 6)', class: 'weak' };
    
    let score = 1;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

    if (score === 2) return { score: 2, text: 'Fair', class: 'fair' };
    if (score === 3) return { score: 3, text: 'Good', class: 'good' };
    return { score: 4, text: 'Strong', class: 'strong' };
  },

  signup({ name, username, email, password, confirmPassword }) {
    name = (name || '').trim();
    username = (username || '').trim().toLowerCase();
    email = (email || '').trim().toLowerCase();

    // Validations
    if (!name || name.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters.' };
    }
    if (!this.validateUsername(username)) {
      return { success: false, error: 'Username must be 3-20 characters (alphanumeric and underscore only).' };
    }
    if (!this.validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    const users = BlogSphereDB.getData(BlogSphereDB.KEYS.USERS, []);

    // Check duplicate email
    if (users.some(u => u.email.toLowerCase() === email)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === username)) {
      return { success: false, error: 'This username is already taken. Please pick another.' };
    }

    // Create new user
    const newUser = {
      id: BlogSphereDB.generateId('user'),
      name,
      username,
      email,
      password, // Stored locally for demo authentication
      avatar: 'assets/images/avatar-default.svg',
      bio: 'New storyteller on BlogSphere. Exploring exciting ideas and sharing knowledge.',
      location: 'Earth',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      followersCount: 0,
      followingCount: 0
    };

    users.push(newUser);
    BlogSphereDB.saveData(BlogSphereDB.KEYS.USERS, users);

    return { success: true, message: 'Account created successfully!', user: newUser };
  },

  login(identifier, password, rememberMe = false) {
    identifier = (identifier || '').trim().toLowerCase();
    
    if (!identifier || !password) {
      return { success: false, error: 'Please enter both username/email and password.' };
    }

    const users = BlogSphereDB.getData(BlogSphereDB.KEYS.USERS, []);
    const user = users.find(u => 
      (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) && 
      u.password === password
    );

    if (!user) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    // Save session
    this.setCurrentUser(user);
    if (rememberMe) {
      localStorage.setItem('blogsphere_remember', identifier);
    } else {
      localStorage.removeItem('blogsphere_remember');
    }

    return { success: true, user };
  }
};

window.Auth = Auth;
