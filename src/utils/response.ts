export const successResponse = <T>(data: T, message = 'Success') => ({
  success: true,
  message,
  data,
});

export const errorResponse = (
  message = 'An error occurred',
  statusCode = 500
) => ({
  success: false,
  message,
  statusCode,
});
