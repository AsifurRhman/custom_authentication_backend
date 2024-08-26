import catchAsync from "../utils/catchAsync.js";

const validateRequest = (validationSchema) => {
  return catchAsync(async (req, res, next) => {
    await validationSchema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    });
    next();
  });
};
export default validateRequest;
