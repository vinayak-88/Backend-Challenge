function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isHttpError = true;
  return error;
}

module.exports = {
  createHttpError,
};
