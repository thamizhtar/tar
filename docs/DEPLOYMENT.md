# Deployment Guide

This guide covers how to deploy the TAR POS application to various environments.

## Prerequisites

### Development Environment
- Node.js 18+
- Android Studio (for Android builds)
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)

### Accounts Required
- Expo account
- Google Play Console account (for Android deployment)
- Cloudflare account (for R2 storage)
- InstantDB account

## Environment Configuration

### Environment Variables

Create environment-specific `.env` files:

#### `.env.development`
```env
# Instant DB
EXPO_PUBLIC_INSTANT_APP_ID=dev-app-id

# Cloudflare R2 Configuration
EXPO_PUBLIC_R2_ACCOUNT_ID=dev-account-id
EXPO_PUBLIC_R2_ACCESS_KEY_ID=dev-access-key
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=dev-secret-key
EXPO_PUBLIC_R2_BUCKET_NAME=dev-bucket
EXPO_PUBLIC_R2_REGION=auto
EXPO_PUBLIC_R2_ENDPOINT=https://dev.r2.cloudflarestorage.com

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=https://dev-api.example.com
```

#### `.env.staging`
```env
# Instant DB
EXPO_PUBLIC_INSTANT_APP_ID=staging-app-id

# Cloudflare R2 Configuration
EXPO_PUBLIC_R2_ACCOUNT_ID=staging-account-id
EXPO_PUBLIC_R2_ACCESS_KEY_ID=staging-access-key
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=staging-secret-key
EXPO_PUBLIC_R2_BUCKET_NAME=staging-bucket
EXPO_PUBLIC_R2_REGION=auto
EXPO_PUBLIC_R2_ENDPOINT=https://staging.r2.cloudflarestorage.com

# App Configuration
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_API_URL=https://staging-api.example.com
```

#### `.env.production`
```env
# Instant DB
EXPO_PUBLIC_INSTANT_APP_ID=prod-app-id

# Cloudflare R2 Configuration
EXPO_PUBLIC_R2_ACCOUNT_ID=prod-account-id
EXPO_PUBLIC_R2_ACCESS_KEY_ID=prod-access-key
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=prod-secret-key
EXPO_PUBLIC_R2_BUCKET_NAME=prod-bucket
EXPO_PUBLIC_R2_REGION=auto
EXPO_PUBLIC_R2_ENDPOINT=https://prod.r2.cloudflarestorage.com

# App Configuration
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://api.example.com
```

## EAS Build Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Build Process

### Development Build
```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run type-check

# Lint code
npm run lint

# Build for development
eas build --platform android --profile development
```

### Staging Build
```bash
# Set staging environment
cp .env.staging .env

# Build for staging
eas build --platform android --profile preview

# Test the build
# Download and install the APK on test devices
```

### Production Build
```bash
# Set production environment
cp .env.production .env

# Run full test suite
npm run test:coverage

# Ensure coverage meets requirements (>80%)
# Review test results

# Build for production
eas build --platform android --profile production
```

## Deployment Steps

### 1. Pre-deployment Checklist

- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No ESLint errors
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] R2 bucket configured and accessible
- [ ] App version incremented

### 2. Database Setup

#### InstantDB Configuration
1. Create InstantDB app for environment
2. Configure schema using `instant.schema.ts`
3. Set up permissions in `instant.perms.ts`
4. Update environment variables

#### Schema Migration
```bash
# Push schema to InstantDB
npx instant-cli push-schema

# Verify schema in InstantDB dashboard
```

### 3. Storage Setup

#### Cloudflare R2 Configuration
1. Create R2 bucket for environment
2. Configure CORS policy:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
3. Create API tokens with appropriate permissions
4. Update environment variables

### 4. Build and Deploy

#### Android Deployment

##### Internal Testing
```bash
# Build for internal testing
eas build --platform android --profile preview

# Submit to Google Play Internal Testing
eas submit --platform android --latest
```

##### Production Release
```bash
# Build production version
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest

# Monitor release in Google Play Console
```

## Monitoring and Maintenance

### Error Tracking

#### Sentry Integration (Optional)
```typescript
// Add to app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_APP_ENV,
});
```

#### Custom Error Tracking
The app includes built-in error tracking via the logger service:

```typescript
// Errors are automatically logged and can be exported
const logs = logger.exportLogs();
// Send logs to your monitoring service
```

### Performance Monitoring

#### Bundle Analysis
```bash
# Analyze bundle size
npx expo export --dump-assetmap

# Review asset map for optimization opportunities
```

#### Performance Metrics
- Monitor app startup time
- Track memory usage
- Monitor network requests
- Track user interactions

### Health Checks

#### Database Health
```typescript
// Check InstantDB connection
const healthCheck = async () => {
  try {
    const { data } = await db.queryOnce({ store: {} });
    return { status: 'healthy', stores: data?.store?.length || 0 };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
```

#### Storage Health
```typescript
// Check R2 connectivity
const storageHealthCheck = async () => {
  try {
    await r2Service.listObjects();
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
```

## Rollback Procedures

### Application Rollback
1. Identify the last known good version
2. Build and deploy the previous version
3. Monitor for issues
4. Communicate rollback to users if necessary

### Database Rollback
1. InstantDB handles schema versioning
2. For data issues, use InstantDB's time-travel features
3. Restore from backup if necessary

### Storage Rollback
1. R2 supports versioning
2. Restore previous versions of critical files
3. Update application configuration if needed

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use EAS Secrets for sensitive values
- Rotate API keys regularly

### API Security
- Use HTTPS for all API communications
- Implement proper authentication
- Validate all inputs
- Use signed URLs for R2 access

### App Security
- Enable code obfuscation for production builds
- Use certificate pinning for API calls
- Implement proper session management
- Regular security audits

## Troubleshooting

### Common Build Issues

#### Metro Bundle Issues
```bash
# Clear Metro cache
npx expo start --clear

# Reset node modules
rm -rf node_modules
npm install
```

#### EAS Build Failures
```bash
# Check build logs
eas build:list

# View specific build details
eas build:view [build-id]
```

#### Environment Variable Issues
- Ensure all required variables are set
- Check variable naming (must start with EXPO_PUBLIC_)
- Verify values are properly escaped

### Runtime Issues

#### Database Connection
- Check InstantDB app status
- Verify API keys and permissions
- Monitor network connectivity

#### Storage Issues
- Verify R2 bucket configuration
- Check CORS settings
- Validate API credentials

#### Performance Issues
- Monitor memory usage
- Check for memory leaks
- Optimize image loading
- Review component re-renders

## Maintenance Schedule

### Daily
- Monitor error logs
- Check application health
- Review user feedback

### Weekly
- Update dependencies
- Run security scans
- Review performance metrics
- Backup critical data

### Monthly
- Rotate API keys
- Update documentation
- Review and update monitoring
- Plan feature releases

### Quarterly
- Security audit
- Performance review
- Dependency audit
- Infrastructure review
