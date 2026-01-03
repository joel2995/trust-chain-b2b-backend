export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map(d => d.message),
      });
    }

    next();
  };
};
