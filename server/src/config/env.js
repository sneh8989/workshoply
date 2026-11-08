import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    // Provide a sensible fallback in development to prevent abrupt crashes while warning the developer
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`CRITICAL: Missing required environment variable: ${envVar}`);
    } else {
      console.warn(`[WARN] Missing ${envVar}. Using fallback development key.`);
    }
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workshoply',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'workshoply_access_secret_super_secure_key_12345_dev',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'workshoply_refresh_secret_super_secure_key_67890_dev',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_workshoplyDevKey',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'workshoplyDevSecretKey123456789',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'workshoplyWebhookSecret123456789',
  ALLOW_TEST_PAYMENT_SIMULATOR: process.env.NODE_ENV === 'production' ? false : process.env.ALLOW_TEST_PAYMENT_SIMULATOR === 'true',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};
