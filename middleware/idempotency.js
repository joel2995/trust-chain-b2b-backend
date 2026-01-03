export const idempotency = (req, res, next) => {
  const key = req.headers["idempotency-key"];

  if (key) {
    req.idempotencyKey = key;
  }

  next();
};
