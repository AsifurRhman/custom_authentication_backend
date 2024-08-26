const sendError = (res, statusCode, errorData) => {
  res.status(statusCode).send({
    success: false,
    ...errorData,
  });
};

export default sendError;
