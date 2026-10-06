const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, USER_STATUS } = require('../utils/constants');
// IMPORTANT: USER_STATUS must contain 'active', 'pending', 'blocked', 'rejected'
// e.g. exports.USER_STATUS = ['active', 'pending', 'blocked', 'rejected'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true },
    status: { type: String, enum: USER_STATUS, default: 'active' },
    phone: { type: String, trim: true },
    avatar: { url: String, publicId: String },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: true },
  },
  { timestamps: true }
);

// async hook WITHOUT next(): works in every Mongoose version (next() is removed in newer ones)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.passwordChangedAt;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);