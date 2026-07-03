export const validateDto = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedBody = await schema.parseAsync(req.body);
      
      req.body = validatedBody;
      
      next();
    } catch (error) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        status: 'fail',
        errors: formattedErrors,
      });
    }
  };
};