const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  fullName: String,
  phone: String,
  line1: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  pincode: String,
  isDefault: { type: Boolean, default: false },
});

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
