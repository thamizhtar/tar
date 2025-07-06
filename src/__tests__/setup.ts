// Jest setup file for React Native testing
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_INSTANT_APP_ID: 'test-app-id',
      EXPO_PUBLIC_R2_ACCOUNT_ID: 'test-account-id',
      EXPO_PUBLIC_R2_ACCESS_KEY_ID: 'test-access-key',
      EXPO_PUBLIC_R2_SECRET_ACCESS_KEY: 'test-secret-key',
      EXPO_PUBLIC_R2_BUCKET_NAME: 'test-bucket',
      EXPO_PUBLIC_R2_REGION: 'auto',
      EXPO_PUBLIC_R2_ENDPOINT: 'https://test.r2.cloudflarestorage.com'
    }
  }
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images'
  },
  ImagePickerResult: {}
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn()
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock InstantDB
jest.mock('@instantdb/react-native', () => ({
  init: jest.fn(() => ({
    useQuery: jest.fn(() => ({ 
      isLoading: false, 
      error: null, 
      data: {} 
    })),
    transact: jest.fn(),
    tx: {}
  })),
  id: jest.fn(() => 'test-id')
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => Promise.resolve('https://test-signed-url.com'))
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign'
}));

// Mock rich text editor
jest.mock('@10play/tentap-editor', () => ({
  RichText: 'RichText',
  Toolbar: 'Toolbar',
  useEditorBridge: () => ({
    setContent: jest.fn(),
    getHTML: jest.fn(() => ''),
    focus: jest.fn(),
    blur: jest.fn()
  })
}));

// Silence console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
