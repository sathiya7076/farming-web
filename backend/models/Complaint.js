const mongoose = require('mongoose');

// `user` is optional so the public Contact Us form can also create a ticket.
const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    subject: { type: String, required: true, maxlength: 150 },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['Open', 'In Review', 'Resolved'], default: 'Open' },
    adminResponse: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
