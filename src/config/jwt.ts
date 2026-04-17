// JWT configuration settings for token generation and validation.
export const jwtConfig = {
  secret: process.env.JWT_SECRET as string,
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
};