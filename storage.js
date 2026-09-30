/**
 * BlogSphere - Centralized Storage and Demo Database Management
 * Handles LocalStorage persistence, default data seeding, and database operations.
 */

const STORAGE_KEYS = {
  USERS: 'blogsphere_users',
  CURRENT_USER: 'blogsphere_currentUser',
  POSTS: 'blogsphere_posts',
  DRAFTS: 'blogsphere_drafts',
  COMMENTS: 'blogsphere_comments',
  LIKES: 'blogsphere_likes', // array of { postId, userId }
  BOOKMARKS: 'blogsphere_bookmarks', // array of { postId, userId, savedAt }
  THEME: 'blogsphere_theme',
  SETTINGS: 'blogsphere_settings',
  FOLLOWS: 'blogsphere_follows' // array of { followerId, followingId }
};

// Generic Safe Storage Helpers
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving data for key "${key}":`, error);
    return false;
  }
}

function getData(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading data for key "${key}":`, error);
    return defaultValue;
  }
}

function removeData(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing data for key "${key}":`, error);
    return false;
  }
}

function updateData(key, updaterFn, defaultValue = null) {
  const current = getData(key, defaultValue);
  const updated = updaterFn(current);
  saveData(key, updated);
  return updated;
}

function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Initial Realistic Demo Data Seeding
const DEFAULT_USERS = [
  {
    id: 'user_alex',
    name: 'Alex Rivera',
    username: 'alexrivera',
    email: 'demo@blogsphere.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Full-stack software engineer & tech blogger. Passionate about Web3, AI tooling, and clean UI engineering.',
    location: 'San Francisco, CA',
    joinedDate: 'January 2025',
    followersCount: 1420,
    followingCount: 380
  },
  {
    id: 'user_sophia',
    name: 'Dr. Sophia Chen',
    username: 'sophiacodes',
    email: 'sophia@blogsphere.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    bio: 'Staff AI Researcher & ML consultant. Decoding generative intelligence, multimodal models, and neuro-symbolic systems.',
    location: 'Boston, MA',
    joinedDate: 'March 2025',
    followersCount: 3280,
    followingCount: 215
  },
  {
    id: 'user_marcus',
    name: 'Marcus Vance',
    username: 'marcusv',
    email: 'marcus@blogsphere.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Principal Cloud Architect & Java Champion. 14+ years scaling resilient distributed backends and microservices.',
    location: 'Seattle, WA',
    joinedDate: 'February 2025',
    followersCount: 2190,
    followingCount: 420
  },
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    username: 'elenar',
    email: 'elena@blogsphere.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    bio: 'Senior Design Technologist & Frontend Lead. Obsessed with micro-interactions, CSS craft, and accessible design.',
    location: 'Berlin, Germany',
    joinedDate: 'April 2025',
    followersCount: 1890,
    followingCount: 310
  },
  {
    id: 'user_david',
    name: 'David Kim',
    username: 'davidkim',
    email: 'david@blogsphere.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    bio: 'Tech Career Strategist & former Engineering Manager. Helping ambitious students and career-switchers break into tech.',
    location: 'Austin, TX',
    joinedDate: 'May 2025',
    followersCount: 4120,
    followingCount: 185
  }
];

const DEFAULT_POSTS = [
  {
    id: 'post_1',
    title: 'The Future of Artificial Intelligence: Beyond Large Language Models',
    subtitle: 'Exploring autonomous agents, multimodal reasoning, and the next evolutionary phase of cognitive computing.',
    content: `<p>The past three years have bore witness to an unprecedented surge in generative intelligence. Large Language Models (LLMs) like GPT-4, Claude, and Gemini have redefined how humans write code, analyze data, and synthesize knowledge.</p>
<h3>1. The Shift to Autonomous Reasoning Agents</h3>
<p>While prompt-based LLMs operate primarily on reactive sequence completion, the upcoming generation of AI systems relies on goal-driven agentic loops. These architectures execute continuous plan-evaluate-refine cycles, employing specialized tools, compilers, and browser environments to accomplish complex real-world tasks autonomously.</p>
<blockquote>"The defining trait of next-generation AI won't be fluency in prose, but dependability in execution and rigorous tool orchestration."</blockquote>
<h3>2. Multimodal Perception Meets Embodiment</h3>
<p>True artificial reasoning cannot thrive in text alone. State-of-the-art vision-language-action (VLA) models are grounding abstract spatial concepts in physical reality. From automated robotic warehousing to intelligent drone navigation, multimodal perception is closing the gap between simulated theory and real-world execution.</p>
<h3>3. What Developers Should Focus On Today</h3>
<p>If you are a student or working engineer wondering where to direct your focus:</p>
<ul>
  <li>Master deterministic evaluation pipelines and synthetic dataset generation.</li>
  <li>Deepen your comprehension of embeddings, vector index structures, and retrieval architectures (RAG).</li>
  <li>Learn how to architect resilient error-recovery loops into agent workflows.</li>
</ul>
<p>The journey from pattern recognition to genuine autonomous cognitive synthesis has only just begun. The developers who bridge foundational software engineering with robust agent orchestration will build the defining platforms of the decade.</p>`,
    category: 'AI',
    tags: ['AI', 'MachineLearning', 'FutureTech', 'LLMs'],
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_sophia',
    authorName: 'Dr. Sophia Chen',
    authorUsername: 'sophiacodes',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-28T09:30:00.000Z',
    dateFormatted: 'Sep 28, 2026',
    readTime: '6 min read',
    likesCount: 148,
    commentsCount: 14,
    featured: true
  },
  {
    id: 'post_2',
    title: '10 Python Pro-Tips Every Beginner and Intermediate Dev Should Know',
    subtitle: 'From structural pattern matching to memory-friendly generators: write cleaner, idiomatic Python code.',
    content: `<p>Python is celebrated for its approachable syntax, but mastering its nuances requires moving past standard procedural loops into idiomatic elegance.</p>
<h3>1. Leverage Structural Pattern Matching</h3>
<p>Introduced in Python 3.10 and refined in recent releases, the <code>match...case</code> syntax goes well beyond classic switch statements. It allows destructuring nested dictionaries and objects effortlessly:</p>
<pre><code>def handle_event(event):
    match event:
        case {"type": "click", "coords": (x, y)}:
            print(f"Clicked at coordinates: {x}, {y}")
        case {"type": "keypress", "key": key}:
            print(f"Key pressed: {key}")
        case _:
            print("Unknown user action")</code></pre>
<h3>2. Embrace Dataclasses with Slots</h3>
<p>Using <code>@dataclass(slots=True)</code> avoids creating an internal dictionary for every instance, significantly reducing memory consumption and speeding up attribute access in high-throughput data processing.</p>
<h3>3. List Comprehensions vs Generators</h3>
<p>When working with datasets larger than a few thousand rows, replace square brackets with parentheses to yield a memory-efficient generator instead of eagerly allocating massive memory buffers.</p>
<p>Adopting these small idioms over time separates competent coders from true Python craftsmen.</p>`,
    category: 'Python',
    tags: ['Python', 'CodingTips', 'Backend', 'SoftwareEngineering'],
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_alex',
    authorName: 'Alex Rivera',
    authorUsername: 'alexrivera',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-26T14:15:00.000Z',
    dateFormatted: 'Sep 26, 2026',
    readTime: '5 min read',
    likesCount: 96,
    commentsCount: 8,
    featured: false
  },
  {
    id: 'post_3',
    title: 'How Modern Websites Are Built in 2026: The New Architecture Paradigm',
    subtitle: 'Edge rendering, Islands architecture, and why Vanilla Web Standards are making a powerful comeback.',
    content: `<p>The JavaScript ecosystem has undergone a fascinating pendulum swing. After years of bloated client-side single page bundles with 2MB vendor scripts, modern web engineering has re-discovered speed, accessibility, and architectural restraint.</p>
<h3>The Shift to Edge-First Delivery</h3>
<p>Modern applications run closer to users than ever. Compute at the CDN edge allows personalized page composition with sub-50 millisecond Time-to-First-Byte (TTFB). By executing lightweight routing and session checks at serverless points of presence, the browser receives lean, semantic HTML immediately.</p>
<h3>Native Web Standards are Thriving</h3>
<p>With CSS Subgrid, Container Queries, native Dialogs, Popover APIs, and the View Transition API supported across 99% of browsers, dependencies that once required heavy external libraries are now achievable with clean native primitives.</p>
<p>The lesson for 2026: Choose simplicity, lean into standards, and prioritize perceived performance above unnecessary abstractions.</p>`,
    category: 'Web Development',
    tags: ['WebDev', 'JavaScript', 'Architecture', 'CSS', 'Performance'],
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_elena',
    authorName: 'Elena Rostova',
    authorUsername: 'elenar',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-25T11:20:00.000Z',
    dateFormatted: 'Sep 25, 2026',
    readTime: '7 min read',
    likesCount: 215,
    commentsCount: 19,
    featured: true
  },
  {
    id: 'post_4',
    title: 'Java in 2026: Why Modern Software Architecture Still Runs on the JVM',
    subtitle: 'Virtual threads (Project Loom), pattern matching, and native image compilation keep Java unmatched in enterprise scale.',
    content: `<p>Critics have predicted the demise of Java for more than two decades. Yet today, enterprise banking, high-frequency logistics, cloud telemetry, and distributed messaging platforms still rely overwhelmingly on Java.</p>
<h3>Project Loom: Millions of Concurrent Virtual Threads</h3>
<p>The traditional model of mapping one Java thread to an OS thread severely throttled concurrent I/O throughput. Virtual Threads have fundamentally altered the landscape. You can now write standard synchronous code that effortlessly scales across millions of concurrent network requests without complex reactive callback chains.</p>
<h3>GraalVM and Instant Startup</h3>
<p>With Ahead-Of-Time (AOT) compilation, Java applications compile directly into native binaries that spin up in less than 20 milliseconds with negligible memory overhead, making the JVM perfectly suited for containerized serverless workloads.</p>
<p>Never underestimate the industrial strength of the Java ecosystem. It continues to reinvent itself while providing uncompromising backwards compatibility.</p>`,
    category: 'Java',
    tags: ['Java', 'JVM', 'Backend', 'Microservices', 'Enterprise'],
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_marcus',
    authorName: 'Marcus Vance',
    authorUsername: 'marcusv',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-22T16:45:00.000Z',
    dateFormatted: 'Sep 22, 2026',
    readTime: '6 min read',
    likesCount: 132,
    commentsCount: 11,
    featured: false
  },
  {
    id: 'post_5',
    title: 'How Students Can Prepare for High-Impact Tech Careers Early',
    subtitle: 'Strategic advice on networking, open source contributions, portfolio curation, and technical interviews.',
    content: `<p>Navigating the transition from university coursework to engineering industry roles can feel daunting. The most successful candidates don't rely solely on their degree GPA; they curate evidence of their passion and curiosity.</p>
<h3>1. Build Depth Over Shallow Breadth</h3>
<p>Having twelve copy-pasted tutorial projects on GitHub impresses nobody. Having two full-fledged, meticulously tested, and publicly deployed applications with genuine user feedback speaks volumes to engineering hiring managers.</p>
<h3>2. Contribute to Open Source</h3>
<p>Working on open-source repositories teaches you how to read other people's code, navigate large legacy codebases, follow contribution guidelines, and communicate via pull request reviews—exactly what engineering teams do daily.</p>
<h3>3. Document Your Learning in Public</h3>
<p>Writing technical blogs, sharing architecture breakdowns, and explaining concepts forces you to crystallize your thoughts. Platforms like BlogSphere are the ideal launchpad to build an undeniable personal portfolio.</p>`,
    category: 'Career',
    tags: ['Career', 'College', 'Mentorship', 'Students', 'Advice'],
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_david',
    authorName: 'David Kim',
    authorUsername: 'davidkim',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-20T10:00:00.000Z',
    dateFormatted: 'Sep 20, 2026',
    readTime: '5 min read',
    likesCount: 310,
    commentsCount: 27,
    featured: true
  },
  {
    id: 'post_6',
    title: 'Why Generative AI Is Transforming Daily Software Development Workflows',
    subtitle: 'From pair-programming copilots to automated unit-testing: augmenting human engineering productivity.',
    content: `<p>Software engineering is undergoing its most profound shift since the transition from assembly language to high-level compilers. AI is not replacing the need for creative critical thought; it is eliminating repetitive boilerplate.</p>
<h3>From Code Completion to Architectural Thinking</h3>
<p>Modern developers spend less time manually writing CRUD boilerplate and more time architecting data contracts, verifying security invariants, and orchestrating distributed systems. Developers who learn to effectively prompt, iterate, and verify AI outputs will achieve 5x leverage in rapid prototyping.</p>
<p>The greatest skill of the modern software engineer is no longer memorizing API syntax—it is understanding core computer science foundations well enough to critically validate and audit machine-generated solutions.</p>`,
    category: 'Technology',
    tags: ['Technology', 'AI', 'Productivity', 'DevTools'],
    coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_sophia',
    authorName: 'Dr. Sophia Chen',
    authorUsername: 'sophiacodes',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-18T15:30:00.000Z',
    dateFormatted: 'Sep 18, 2026',
    readTime: '4 min read',
    likesCount: 88,
    commentsCount: 6,
    featured: false
  },
  {
    id: 'post_7',
    title: 'Learning to Code: Overcoming Imposter Syndrome as a Self-Taught Dev',
    subtitle: 'The psychological hurdles of learning programming and practical strategies to stay motivated.',
    content: `<p>Almost every software developer experiences moments where they feel in over their heads. When staring at an incomprehensible stack trace or comparing yourself to ten-year veterans on social media, imposter syndrome strikes hard.</p>
<h3>The Illusion of Omniscience</h3>
<p>Senior engineers don't have all documentation memorized. What separates a seasoned developer from a novice is not innate genius, but comfort with ambiguity and practiced debugging resilience.</p>
<h3>Practical Steps for Your Journey</h3>
<ul>
  <li>Celebrate small milestones: getting an API endpoint to return a 200 OK is genuine progress.</li>
  <li>Avoid tutorial hell by building your own mini projects without video walk-throughs.</li>
  <li>Find a supportive peer community where questions are welcomed without judgment.</li>
</ul>
<p>Progress is rarely linear. Embrace the struggle as evidence that your brain is forging new mental models.</p>`,
    category: 'Education',
    tags: ['Education', 'Learning', 'SelfTaught', 'Mindset'],
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_alex',
    authorName: 'Alex Rivera',
    authorUsername: 'alexrivera',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-15T08:00:00.000Z',
    dateFormatted: 'Sep 15, 2026',
    readTime: '5 min read',
    likesCount: 164,
    commentsCount: 13,
    featured: false
  },
  {
    id: 'post_8',
    title: 'Best Practices for Responsive Web Design and Modern CSS Layouts',
    subtitle: 'CSS Grid, Flexbox, Fluid Typography with clamp(), and accessible design patterns for every screen size.',
    content: `<p>Creating fluid user interfaces that function seamlessly across 375px mobile screens and 4K desktop monitors requires a systematic layout strategy.</p>
<h3>Modern Responsive Principles:</h3>
<ol>
  <li><strong>Fluid Typography:</strong> Use CSS <code>clamp(1rem, 2.5vw, 2.5rem)</code> instead of rigid media query font adjustments.</li>
  <li><strong>Auto-Fit Grids:</strong> Take advantage of <code>grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))</code> for cards that automatically re-flow without single-breakpoint breakpoints.</li>
  <li><strong>Logical Properties:</strong> Adopt <code>margin-block</code> and <code>padding-inline</code> for seamless internationalization and multi-directional layouts.</li>
</ol>
<p>Modern CSS has eliminated the need for heavy UI frameworks for most bespoke web applications. Embrace the native browser engine!</p>`,
    category: 'Programming',
    tags: ['Programming', 'CSS', 'ResponsiveDesign', 'Frontend'],
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_elena',
    authorName: 'Elena Rostova',
    authorUsername: 'elenar',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-12T12:00:00.000Z',
    dateFormatted: 'Sep 12, 2026',
    readTime: '5 min read',
    likesCount: 175,
    commentsCount: 10,
    featured: false
  },
  {
    id: 'post_9',
    title: 'Top Technology Trends Shaping the Next Decade: From Quantum to Edge Computing',
    subtitle: 'A strategic overview of emerging computational paradigms that will define future software infrastructure.',
    content: `<p>As classical silicon architectures encounter physical thermal limits, computational engineering is expanding into decentralized edge computing, optical interconnects, and quantum processing units.</p>
<p>In this comprehensive analysis, we explore how edge micro-datacenters will minimize latency for real-time spatial computing, and how hybrid quantum-classical algorithms will crack complex molecular simulations and cryptography challenges.</p>`,
    category: 'Technology',
    tags: ['Technology', 'Quantum', 'EdgeComputing', 'Innovation'],
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_marcus',
    authorName: 'Marcus Vance',
    authorUsername: 'marcusv',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-09T18:00:00.000Z',
    dateFormatted: 'Sep 9, 2026',
    readTime: '7 min read',
    likesCount: 142,
    commentsCount: 9,
    featured: false
  },
  {
    id: 'post_10',
    title: 'How to Build Standout Portfolio Projects That Actually Impress Recruiters',
    subtitle: 'Move beyond generic todo lists: real-world utility, stellar documentation, and clean system design.',
    content: `<p>Recruiters and hiring managers spend an average of 30 seconds scanning candidate portfolios. How do you ensure your work commands genuine attention?</p>
<p>Focus on authentic utility. Build a tool that solves a tangible frustration in your daily workflow, package it with automated GitHub CI/CD workflows, write thorough README documentation with architecture diagrams, and ensure it is deployed with one-click live access.</p>`,
    category: 'Career',
    tags: ['Career', 'Portfolio', 'Resume', 'Jobs', 'Engineering'],
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_david',
    authorName: 'David Kim',
    authorUsername: 'davidkim',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-05T11:00:00.000Z',
    dateFormatted: 'Sep 5, 2026',
    readTime: '6 min read',
    likesCount: 284,
    commentsCount: 22,
    featured: true
  },
  {
    id: 'post_11',
    title: 'Mindful Living in a Hyper-Connected Tech World: A Developer’s Perspective',
    subtitle: 'Cultivating digital boundaries, deep work rituals, and sustaining mental wellness under constant screen time.',
    content: `<p>Constant push notifications, automated slack alerts, and relentless release cycles can silently erode creativity. Practicing intentional digital disconnection, establishing 90-minute uninterrupted deep work blocks, and prioritizing restorative outdoor habits are essential for lifelong sustainability in tech.</p>`,
    category: 'Lifestyle',
    tags: ['Lifestyle', 'Wellness', 'DeepWork', 'Productivity'],
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_alex',
    authorName: 'Alex Rivera',
    authorUsername: 'alexrivera',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-09-02T14:30:00.000Z',
    dateFormatted: 'Sep 2, 2026',
    readTime: '4 min read',
    likesCount: 93,
    commentsCount: 5,
    featured: false
  },
  {
    id: 'post_12',
    title: 'A Mountain Retreat: Finding Creative Clarity in the High Alps',
    subtitle: 'Why stepping away from the keyboard and immersing in natural landscapes unlocks fresh architectural perspective.',
    content: `<p>There is a profound relationship between panoramic natural landscapes and mental expansion. Hiking across alpine ridges clears mental cache like nothing else, allowing complex subconscious engineering puzzles to assemble themselves into clear, elegant solutions.</p>`,
    category: 'Travel',
    tags: ['Travel', 'Nature', 'Inspiration', 'Adventure'],
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_elena',
    authorName: 'Elena Rostova',
    authorUsername: 'elenar',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-08-29T10:15:00.000Z',
    dateFormatted: 'Aug 29, 2026',
    readTime: '4 min read',
    likesCount: 118,
    commentsCount: 7,
    featured: false
  },
  {
    id: 'post_13',
    title: 'Bootstrapping a Tech Startup: Key Lessons from Zero to First 10,000 Users',
    subtitle: 'Product validation, organic distribution loops, and avoiding the premature optimization trap.',
    content: `<p>Too many technical founders spend months perfecting scalable Kubernetes clusters before acquiring a single paying user. In this post, we unpack the lean execution strategies that drove organic growth: listening directly to user feedback, iterating weekly, and building community-led adoption.</p>`,
    category: 'Business',
    tags: ['Business', 'Startup', 'Entrepreneurship', 'Growth'],
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    authorId: 'user_marcus',
    authorName: 'Marcus Vance',
    authorUsername: 'marcusv',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    publishedAt: '2026-08-25T16:00:00.000Z',
    dateFormatted: 'Aug 25, 2026',
    readTime: '6 min read',
    likesCount: 204,
    commentsCount: 15,
    featured: false
  }
];

const DEFAULT_COMMENTS = [
  {
    id: 'comm_1',
    postId: 'post_1',
    userId: 'user_alex',
    userName: 'Alex Rivera',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    content: 'Incredible breakdown Dr. Chen! The emphasis on evaluation loops and tool orchestration resonates strongly with what we are observing in production agent workflows.',
    createdAt: '2026-09-28T12:00:00.000Z',
    dateFormatted: 'Sep 28, 2026'
  },
  {
    id: 'comm_2',
    postId: 'post_1',
    userId: 'user_marcus',
    userName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    content: 'Completely agree on tool orchestration. We are seeing JVM-based microservices acting as reliable tool endpoints for AI agents with remarkable throughput.',
    createdAt: '2026-09-28T14:30:00.000Z',
    dateFormatted: 'Sep 28, 2026'
  },
  {
    id: 'comm_3',
    postId: 'post_3',
    userId: 'user_alex',
    userName: 'Alex Rivera',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    content: 'The View Transitions API has completely transformed single-page-feel in multi-page architectures. Love this article Elena!',
    createdAt: '2026-09-25T15:20:00.000Z',
    dateFormatted: 'Sep 25, 2026'
  },
  {
    id: 'comm_4',
    postId: 'post_5',
    userId: 'user_sophia',
    userName: 'Dr. Sophia Chen',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    content: 'David makes a crucial point about open source contributions. Reading real production code is where genuine software craftsmanship begins.',
    createdAt: '2026-09-20T11:45:00.000Z',
    dateFormatted: 'Sep 20, 2026'
  }
];

const DEFAULT_SETTINGS = {
  theme: 'light',
  emailNotifications: true,
  commentNotifications: true,
  likeNotifications: true,
  newsletter: true
};

// Seed storage if empty
function initializeBlogSphereDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveData(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    saveData(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    saveData(STORAGE_KEYS.COMMENTS, DEFAULT_COMMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DRAFTS)) {
    saveData(STORAGE_KEYS.DRAFTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LIKES)) {
    // Initial pre-liked posts for demo
    saveData(STORAGE_KEYS.LIKES, [
      { postId: 'post_1', userId: 'user_alex' },
      { postId: 'post_3', userId: 'user_alex' },
      { postId: 'post_5', userId: 'user_alex' }
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) {
    // Initial bookmarks for demo
    saveData(STORAGE_KEYS.BOOKMARKS, [
      { postId: 'post_1', userId: 'user_alex', savedAt: '2026-09-28T10:00:00.000Z' },
      { postId: 'post_3', userId: 'user_alex', savedAt: '2026-09-26T08:00:00.000Z' },
      { postId: 'post_5', userId: 'user_alex', savedAt: '2026-09-21T14:00:00.000Z' }
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    saveData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.FOLLOWS)) {
    saveData(STORAGE_KEYS.FOLLOWS, [
      { followerId: 'user_alex', followingId: 'user_sophia' },
      { followerId: 'user_alex', followingId: 'user_elena' }
    ]);
  }
}

// Execute database seeding immediately on load
initializeBlogSphereDatabase();

// Expose safe database helper object
window.BlogSphereDB = {
  KEYS: STORAGE_KEYS,
  saveData,
  getData,
  removeData,
  updateData,
  generateId,
  resetToDefaults: () => {
    localStorage.clear();
    initializeBlogSphereDatabase();
  }
};
