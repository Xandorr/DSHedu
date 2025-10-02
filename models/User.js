const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // 소셜 로그인 사용자는 비밀번호가 필요 없음
      return !this.googleId && !this.kakaoId && !this.naverId;
    }
  },
  googleId: {
    type: String,
    sparse: true
  },
  kakaoId: {
    type: String,
    sparse: true
  },
  naverId: {
    type: String,
    sparse: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  role: {
    type: String,
    enum: ['parent', 'student', 'admin'],
    default: 'parent'
  },
  phone: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  birthDate: {
    type: Date
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['ko', 'en'],
      default: 'ko'
    }
  },
  // 커뮤니티 등급 시스템
  communityLevel: {
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    experience: {
      type: Number,
      default: 0,
      min: 0
    },
    title: {
      type: String,
      default: '브론즈'
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // 활동 통계
  activityStats: {
    postsCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    likesReceived: {
      type: Number,
      default: 0
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 등급 시스템 메서드들
userSchema.methods.addExperience = async function(points, reason) {
  this.communityLevel.experience += points;
  this.activityStats.lastActiveAt = new Date();
  
  // 등급 업 체크
  const newLevel = this.calculateLevel();
  if (newLevel > this.communityLevel.level) {
    this.communityLevel.level = newLevel;
    this.communityLevel.title = this.getLevelTitle(newLevel);
    
    // 등급업 배지 추가
    this.communityLevel.badges.push({
      name: `${this.communityLevel.title} 달성`,
      description: `레벨 ${newLevel} 달성`,
      earnedAt: new Date()
    });
    
    console.log(`🎉 ${this.name}님이 레벨 ${newLevel}(${this.communityLevel.title}) 달성!`);
  }
  
  await this.save();
  return { levelUp: newLevel > this.communityLevel.level, newLevel, newTitle: this.communityLevel.title };
};

userSchema.methods.calculateLevel = function() {
  const exp = this.communityLevel.experience;
  // 5단계 등급 시스템: 브론즈, 실버, 골드, 플래티넘, 다이아몬드
  if (exp < 200) return 1;      // 브론즈: 0-199XP
  if (exp < 500) return 2;      // 실버: 200-499XP
  if (exp < 1000) return 3;     // 골드: 500-999XP
  if (exp < 2000) return 4;     // 플래티넘: 1000-1999XP
  return 5;                     // 다이아몬드: 2000XP 이상
};

userSchema.methods.getLevelTitle = function(level) {
  const titles = {
    1: '브론즈',
    2: '실버',
    3: '골드',
    4: '플래티넘',
    5: '다이아몬드'
  };
  return titles[level] || '브론즈';
};

userSchema.methods.getLevelProgress = function() {
  const currentLevel = this.communityLevel.level;
  const currentExp = this.communityLevel.experience;
  
  // 현재 레벨의 최소/최대 경험치 계산 (5단계)
  const levelRanges = {
    1: { min: 0, max: 200 },      // 브론즈: 0-199XP
    2: { min: 200, max: 500 },    // 실버: 200-499XP
    3: { min: 500, max: 1000 },   // 골드: 500-999XP
    4: { min: 1000, max: 2000 },  // 플래티넘: 1000-1999XP
    5: { min: 2000, max: Infinity } // 다이아몬드: 2000XP 이상
  };
  
  const range = levelRanges[currentLevel];
  const progress = Math.min(100, ((currentExp - range.min) / (range.max - range.min)) * 100);
  
  return {
    currentLevel,
    currentExp,
    nextLevelExp: range.max === Infinity ? null : range.max,
    progress: Math.round(progress)
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User; 