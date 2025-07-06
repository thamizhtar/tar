import Constants from 'expo-constants';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  endpoint: string;
}

export const r2Config: R2Config = {
  accountId: Constants.expoConfig?.extra?.R2_ACCOUNT_ID || process.env.EXPO_PUBLIC_R2_ACCOUNT_ID || '',
  accessKeyId: Constants.expoConfig?.extra?.R2_ACCESS_KEY_ID || process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID || '',
  secretAccessKey: Constants.expoConfig?.extra?.R2_SECRET_ACCESS_KEY || process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY || '',
  bucketName: Constants.expoConfig?.extra?.R2_BUCKET_NAME || process.env.EXPO_PUBLIC_R2_BUCKET_NAME || '',
  region: Constants.expoConfig?.extra?.R2_REGION || process.env.EXPO_PUBLIC_R2_REGION || 'auto',
  endpoint: Constants.expoConfig?.extra?.R2_ENDPOINT || process.env.EXPO_PUBLIC_R2_ENDPOINT || '',
};

// Validate configuration
export const validateR2Config = (): boolean => {
  const required = ['accountId', 'accessKeyId', 'secretAccessKey', 'bucketName', 'endpoint'];
  return required.every(key => r2Config[key as keyof R2Config]);
};

// Get public URL for uploaded files
export const getPublicUrl = (key: string): string => {
  return `${r2Config.endpoint}/${key}`;
};

// Generate unique file key
export const generateFileKey = (originalName: string, prefix: string = 'media'): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || '';
  return `${prefix}/${timestamp}-${randomId}.${extension}`;
};
