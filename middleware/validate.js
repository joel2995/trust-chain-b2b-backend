export const requireFields = (fields = []) => (req, res, next) => {
  const missing = fields.filter(
    (f) =>
      req.body[f] === undefined ||
      req.body[f] === null ||
      req.body[f] === ""
  );

  if (missing.length) {
    return res.status(400).json({
      msg: "Missing required fields",
      missing,
    });
  }

  next();
};
