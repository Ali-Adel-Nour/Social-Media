const mongoose = require('mongoose')
const argon2 = require('argon2')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 254,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  roles: {
    type: [{
      type: String,
      enum: ['user', 'moderator', 'admin']
    }],
    default: ['user'],
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_blocked: { // Changed to snake_case for consistency
    type: Boolean,
    default: false,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  verification_token: {
    type: String,
    select: false,
  },
  last_login: {
    type: Date,
  },
  login_attempts: {
    type: Number,
    default: 0,
    select: false,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});


userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try{
    this.password = await argon2.hash(this.password);
  } catch (error) {
    next(error);
  }
  }

});

userSchema.methods.comparePassword = async function(candidatepassword) {
  try{
    return await argon2.verify(this.password, candidatepassword);

  }catch (error) {
    throw error
  }
}

userSchema.index({ username: 'text' });


const User = mongoose.model('User', userSchema)


module.exports = User