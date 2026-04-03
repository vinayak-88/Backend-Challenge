function errorHandler(error, _req, res, _next) {
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({
      message: 'Invalid JSON payload.',
    });
    return;
  }

  if (error?.isHttpError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: 'Internal server error.',
  });
}

module.exports = {
  errorHandler,
};
