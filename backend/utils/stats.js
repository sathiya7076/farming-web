// Builds a gap-filled monthly series for the last `n` months.
// sumExpr: 1 for counting documents, or a field like '$totalAmount' for sums.
const monthKeys = (n) => {
  const now = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${m.getFullYear()}-${m.getMonth() + 1}`,
      label: m.toLocaleString('en', { month: 'short' }) + ' ' + String(m.getFullYear()).slice(2),
      start: m,
    });
  }
  return out;
};

exports.series = async (Model, match, dateField, sumExpr = 1, n = 6) => {
  const keys = monthKeys(n);
  const rows = await Model.aggregate([
    { $match: { ...match, [dateField]: { $gte: keys[0].start } } },
    { $group: { _id: { y: { $year: `$${dateField}` }, m: { $month: `$${dateField}` } }, value: { $sum: sumExpr } } },
  ]);
  const map = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.value]));
  return keys.map((k) => ({ label: k.label, value: Math.round((map.get(k.key) || 0) * 100) / 100 }));
};
