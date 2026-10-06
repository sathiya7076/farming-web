const path = require('path');
const validate = require('../middleware/validate');

const loadController = (file) => {
  try {
    return require(path.join(__dirname, '..', 'controllers', file));
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' && e.message.includes(file)) {
      console.warn(`[routes] controllers/${file}.js not found - its routes will return 501`);
      return {};
    }
    throw e;
  }
};

// names can be one name or a list of possible names; the first one that exists is used.
const handler = (ctrl, names, label) => {
  const list = [].concat(names);
  for (const n of list) if (typeof ctrl[n] === 'function') return ctrl[n];
  console.warn(`[routes] ${label}: none of [${list.join(', ')}] found. Exports are: ${Object.keys(ctrl).join(', ') || '(none)'}`);
  return (_req, res) =>
    res.status(501).json({ success: false, message: `Not implemented: ${label}.${list[0]}` });
};

// Validate req.body with a zod schema exported by the controller.
// If the schema is missing (or not zod) this does nothing, so it never crashes the server.
const v = (schema) =>
  schema && typeof schema.safeParse === 'function' ? validate(schema) : (_req, _res, next) => next();

// Sets both req.params.id and req.params.productId so the controller works with either name.
const alias = (req, _res, next) => {
  if (req.params.id && !req.params.productId) req.params.productId = req.params.id;
  if (req.params.productId && !req.params.id) req.params.id = req.params.productId;
  next();
};

// Uses your existing middleware/upload.js (multer) for multipart product images, if present.
const imageUpload = (field = 'images', max = 6) => {
  let m = null;
  try { m = require(path.join(__dirname, '..', 'middleware', 'upload')); } catch { /* not found */ }
  const mw = m && (
    typeof m.array === 'function' ? m.array(field, max)
      : m.uploadImages || m.productImages || (m.upload && m.upload.array && m.upload.array(field, max))
      || (typeof m === 'function' ? m : null)
  );
  if (!mw) {
    console.warn('[routes] middleware/upload.js not found - multipart product images will not be parsed');
    return (_req, _res, next) => next();
  }
  return mw;
};

module.exports = { loadController, handler, imageUpload, v, alias };