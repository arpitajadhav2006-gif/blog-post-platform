from datetime import datetime
from database import db
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, default='')
    avatar_url = db.Column(db.String(500), default='')
    role = db.Column(db.String(10), default='user')  # 'user' | 'admin'
    is_active = db.Column(db.Boolean, default=True)
    is_banned = db.Column(db.Boolean, default=False)
    reputation_score = db.Column(db.Integer, default=0)
    social_links = db.Column(db.Text, default='{}')  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    bookmarks = db.relationship('Bookmark', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    reports = db.relationship('Report', backref='reporter', lazy='dynamic', cascade='all, delete-orphan')
    following = db.relationship('Follow', foreign_keys='Follow.follower_id', backref='follower', lazy='dynamic', cascade='all, delete-orphan')
    followers = db.relationship('Follow', foreign_keys='Follow.followed_id', backref='followed', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    @property
    def post_count(self):
        from models.post import Post
        return Post.query.filter_by(author_id=self.id, status='published').count()

    @property
    def follower_count(self):
        return self.followers.count()

    @property
    def following_count(self):
        return self.following.count()

    @property
    def total_views(self):
        from models.post import Post
        result = db.session.query(db.func.sum(Post.views)).filter_by(author_id=self.id).scalar()
        return result or 0

    @property
    def total_likes(self):
        from models.engagement import Like
        from models.post import Post
        result = db.session.query(db.func.count(Like.id)).join(Post).filter(Post.author_id == self.id).scalar()
        return result or 0

    @property
    def author_badge(self):
        score = self.reputation_score
        if score >= 1000:
            return '⭐ Top Author'
        elif score >= 300:
            return '🔥 Trending Creator'
        elif score >= 50:
            return '🏆 Rising Writer'
        return '✍️ Writer'

    def update_reputation(self):
        from models.post import Post
        from models.engagement import Like, Comment, Bookmark
        views = self.total_views
        likes = self.total_likes
        posts_q = Post.query.filter_by(author_id=self.id, status='published').all()
        comments_cnt = sum(Comment.query.filter_by(post_id=p.id).count() for p in posts_q)
        bookmarks_cnt = sum(Bookmark.query.filter_by(post_id=p.id).count() for p in posts_q)
        self.reputation_score = int(views * 0.1 + likes * 2 + comments_cnt * 3 + bookmarks_cnt * 2 + len(posts_q) * 5)

    def to_dict(self, include_private=False):
        import json
        try:
            social = json.loads(self.social_links) if self.social_links else {}
        except Exception:
            social = {}
        data = {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'reputation_score': self.reputation_score,
            'author_badge': self.author_badge,
            'post_count': self.post_count,
            'follower_count': self.follower_count,
            'following_count': self.following_count,
            'total_views': self.total_views,
            'total_likes': self.total_likes,
            'social_links': social,
            'is_banned': self.is_banned,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_private:
            data['email'] = self.email
            data['is_active'] = self.is_active
        return data


class Follow(db.Model):
    __tablename__ = 'follows'
    __table_args__ = (db.UniqueConstraint('follower_id', 'followed_id'),)

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    followed_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
