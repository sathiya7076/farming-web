const Notification = require('../models/Notification');

// Notifications must never break the main request, so errors are only logged.
exports.notify = (user, title, message, type = 'system', link) =>
  Notification.create({ user, title, message, type, link }).catch((e) => console.error('notify failed:', e.message));

exports.notifyMany = (users, title, message, type = 'system', link) => {
  if (!users || !users.length) return Promise.resolve();
  return Notification.insertMany(users.map((user) => ({ user, title, message, type, link }))).catch((e) =>
    console.error('notifyMany failed:', e.message)
  );
};
