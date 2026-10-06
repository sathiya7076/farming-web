const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    farmName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    bio: { type: String, maxlength: 1000 },
    farmSize: String,
    experienceYears: { type: Number, min: 0 },
    specialties: [String],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Farmer', farmerSchema);
