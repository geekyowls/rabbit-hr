export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
