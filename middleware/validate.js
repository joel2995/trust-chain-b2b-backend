// middleware/validate.js
// Lightweight validation helpers you can expand with Joi/zod later.

export const requireFields = (fields = []) => (req, res, next) => {
  const missing = [];
  for (const f of fields) {
    if (req.body[f] === undefined || req.body[f] === null || req.body[f] === "") missing.push(f);
  }
  if (missing.length) return res.status(400).json({ msg: "Missing required fields", missing });
  next();
};
