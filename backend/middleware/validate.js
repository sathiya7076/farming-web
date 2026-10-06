// Validates req.body with a zod schema.
// - On failure: 400 with { success:false, message, errors:[{ field, message }] }
//   (this is the exact shape Register.jsx reads to show red text under each field)
// - On success: req.body is REPLACED with the parsed data, so trim() / toLowerCase()
//   from the schema really apply, and unknown fields (e.g. "confirm", "isAdmin") are stripped.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.') || 'form',
      message: i.message,
    }));
    return res.status(400).json({
      success: false,
      message: errors[0]?.message || 'Validation failed',
      errors,
    });
  }
  req.body = result.data;
  next();
};

module.exports = validate;