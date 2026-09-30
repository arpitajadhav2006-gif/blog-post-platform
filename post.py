from datetime import datetime
from database import db

# Association table for Post <-> Tag many-to-many
post_tags = db.Table('post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, default='')
    color = db.Column(db.String(20), default='#8b5cf6')
    icon = db.Column(db.String(10), default='📝')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    posts = db.relationship('Post', backref='category', lazy='dynamic')

    @property
    def post_count(self):
        return self.posts.filter_by(status='published').count()

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'color': self.color,
            'icon': self.icon,
            'post_count': self.post_count,
        }


class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'usage_count': self.usage_count,
        }


class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    slug = db.Column(db.String(350), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text, default='')
    featured_image = db.Column(db.String(500), default='')
    status = db.Column(db.String(20), default='draft')  # draft | published | archived
    reading_time = db.Column(db.String(20), default='1 min read')
    views = db.Column(db.Integer, default=0)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tags = db.relationship('Tag', secondary=post_tags, lazy='dynamic', backref=db.backref('posts', lazy='dynamic'))
    likes = db.relationship('Like', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    bookmarks = db.relationship('Bookmark', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    view_records = db.relationship('ViewRecord', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    reports = db.relationship('Report', backref='post', lazy='dynamic', cascade='all, delete-orphan')

    @property
    def like_count(self):
        return self.likes.count()

    @property
    def bookmark_count(self):
        return self.bookmarks.count()

    @property
    def comment_count(self):
        return self.comments.filter_by(parent_id=None).count()

    @property
    def trending_score(self):
        from datetime import timezone
        import math
        now = datetime.utcnow()
        age_hours = (now - self.created_at).total_seconds() / 3600 if self.created_at else 0
        if age_hours < 24:
            recency = 2.0
        elif age_hours < 168:  # 7 days
            recency = 1.5
        else:
            recency = 1.0
        raw = self.views * 1 + self.like_count * 3 + self.comment_count * 5 + self.bookmark_count * 2
        return raw * recency

    def to_dict(self, current_user_id=None):
        liked = False
        bookmarked = False
        if current_user_id:
            from models.engagement import Like, Bookmark
            liked = Like.query.filter_by(user_id=current_user_id, post_id=self.id).first() is not None
            bookmarked = Bookmark.query.filter_by(user_id=current_user_id, post_id=self.id).first() is not None
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt or (self.content[:200].strip() + '...' if len(self.content) > 200 else self.content),
            'featured_image': self.featured_image,
            'status': self.status,
            'reading_time': self.reading_time,
            'views': self.views,
            'like_count': self.like_count,
            'bookmark_count': self.bookmark_count,
            'comment_count': self.comment_count,
            'trending_score': self.trending_score,
            'author': self.author.to_dict() if self.author else None,
            'category': self.category.to_dict() if self.category else None,
            'tags': [t.to_dict() for t in self.tags],
            'liked': liked,
            'bookmarked': bookmarked,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_full_dict(self, current_user_id=None):
        d = self.to_dict(current_user_id)
        d['content'] = self.content
        return d
