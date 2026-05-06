/* ============================================================
   models/User.js — User Schema with bcrypt + DID Generation
   ============================================================ */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  username:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  did:        { type: String, unique: true },
  blockHash:  { type: String },
  blockIndex: { type: Number },
}, { timestamps: true });

/* ---- Hash password + generate DID before save ---- */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.did) {
    const unique = `${this.email}${Date.now()}${Math.random()}`;
    const hash   = crypto.createHash('sha256').update(unique).digest('hex');
    this.did     = `did:blockid:${hash.substring(0, 32)}`;
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
