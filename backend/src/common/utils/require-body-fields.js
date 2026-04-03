const { createHttpError } = require('../http-error');

function requireBodyFields(body, fields) {
  for (const field of fields) {
    if (body?.[field] === undefined || body?.[field] === null || body?.[field] === '') {
      throw createHttpError(400, `${field} is required.`);
    }
  }
}

module.exports = {
  requireBodyFields,
};
