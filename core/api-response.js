const errorJson = (error = null, message = 'An error occurred', status = 400) => ({
  status,
  success: false,
  message: `${message}${error ? ` ${error}` : ''}`,
});

const successJson = (data) => ({
  status: 200,
  success: true,
  data,
});

module.exports = { successJson, errorJson };
