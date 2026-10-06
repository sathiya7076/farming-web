exports.populateOrder = (q) =>
  q
    .populate({ path: 'client', select: 'user', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'farmer', select: 'farmName location user', populate: { path: 'user', select: 'name email phone' } });
