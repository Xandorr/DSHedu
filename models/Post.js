const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String // 이미지 파일 경로들
  }],
  youtubeUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['general', 'info', 'notice', 'qna'],
    default: 'general'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 설정
postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });

// 가상 필드: 댓글 수
postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

// 유튜브 URL에서 비디오 ID 추출 메서드
postSchema.methods.getYoutubeVideoId = function() {
  if (!this.youtubeUrl) return null;
  
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = this.youtubeUrl.match(regex);
  return match ? match[1] : null;
};

// 게시글 요약 메서드 (첫 100자)
postSchema.methods.getExcerpt = function(length = 100) {
  return this.content.length > length 
    ? this.content.substring(0, length) + '...'
    : this.content;
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post; 