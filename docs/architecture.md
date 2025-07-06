# TAR POS - Application Architecture

## Overview

TAR POS is a modern Point of Sale (POS) system built with React Native and Expo, designed to provide real-time inventory management, sales tracking, and business analytics. The application follows a component-based architecture with real-time data synchronization and cloud storage capabilities.

## Technology Stack

### Core Framework
- **React Native**: Cross-platform mobile development framework
- **Expo**: Development platform and toolchain (v53.0.17)
- **TypeScript**: Full type safety throughout the application
- **Metro**: JavaScript bundler for React Native

### Database & Backend
- **InstantDB**: Real-time collaborative database with declarative queries
- **Cloudflare R2**: Object storage for media files (images, documents)
- **AsyncStorage**: Local storage for app preferences and offline data

### UI & Styling
- **NativeWind**: Tailwind CSS for React Native styling
- **Expo Vector Icons**: Icon library (Feather, MaterialIcons, Ionicons)
- **React Native Safe Area Context**: Safe area handling
- **React Native Gesture Handler**: Touch and gesture handling

### Rich Content & Media
- **@10play/tentap-editor**: Rich text editor for product descriptions
- **Expo Image Picker**: Camera and gallery access for product images
- **React Native Draggable FlatList**: Drag-and-drop functionality

### Development & Testing
- **Jest**: Testing framework
- **React Native Testing Library**: Component testing utilities
- **ESLint**: Code linting and formatting
- **Babel**: JavaScript transpilation

## Application Architecture

### High-Level Structure

```
TAR POS Application
├── Presentation Layer (React Native Components)
├── Business Logic Layer (Custom Hooks & Services)
├── Data Layer (InstantDB + Local Storage)
└── External Services (Cloudflare R2, Media APIs)
```

### Core Architectural Patterns

1. **Component-Based Architecture**: Modular, reusable UI components
2. **Context-Based State Management**: React Context for global state
3. **Real-Time Data Synchronization**: InstantDB for live updates
4. **Service-Oriented Design**: Dedicated services for external integrations
5. **Error Boundary Pattern**: Comprehensive error handling and recovery

## Directory Structure

```
src/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # Main app component & navigation logic
├── components/            # Feature components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx    # Standardized button component
│   │   ├── Input.tsx     # Form input component
│   │   ├── Card.tsx      # Container component
│   │   ├── error-boundary.tsx # Error handling wrapper
│   │   └── ...
│   ├── dashboard.tsx     # Square POS-style dashboard
│   ├── products.tsx      # Product management interface
│   ├── collections.tsx   # Collection management
│   ├── sales.tsx         # Sales tracking
│   ├── reports.tsx       # Business analytics
│   ├── prod-form.tsx     # Shopify-style product forms
│   ├── inventory.tsx     # Stock management
│   ├── nav.tsx           # Bottom navigation
│   └── menu.tsx          # Full-screen menu
├── lib/                  # Core utilities and services
│   ├── instant.ts        # InstantDB configuration
│   ├── r2-service.ts     # Cloudflare R2 integration
│   ├── store-context.tsx # Multi-store management
│   ├── logger.ts         # Logging and error tracking
│   ├── migrate-products.ts # Data migration utilities
│   └── cleanup-legacy.ts # Legacy data cleanup
└── global.css           # Global styles
```

## Core Components & Data Flow

### Main Application Component (`src/app/index.tsx`)

The main application component serves as the central orchestrator for the entire application:

**Key Responsibilities:**
- **Navigation Management**: Handles screen transitions and navigation state
- **Global State Coordination**: Manages application-wide state through React Context
- **Error Boundary Integration**: Wraps components with error handling
- **Migration Management**: Runs data migrations on app startup
- **Layout Management**: Controls header, bottom navigation, and screen visibility

**State Management:**
```typescript
type Screen = 'dashboard' | 'sales' | 'reports' | 'products' | 'collections' | 'options' | 'menu';
type BottomTab = 'workspace' | 'ai' | 'tasks' | 'people';

// Core application state
const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('workspace');
const [showBottomTabs, setShowBottomTabs] = useState(true);
const [isGridView, setIsGridView] = useState(false);
const [showManagement, setShowManagement] = useState(false);
```

### Store Context (`src/lib/store-context.tsx`)

Multi-store management system that provides:

**Features:**
- **Store Selection**: Switch between multiple business locations
- **Persistent Storage**: Remembers current store selection via AsyncStorage
- **Real-time Sync**: Automatically syncs store data across devices
- **CRUD Operations**: Create, read, update, delete store configurations

**Data Flow:**
```
User Action → Store Context → InstantDB → Real-time Updates → UI Refresh
```

### Navigation System

**Custom Navigation Architecture:**
- **Screen-based Navigation**: Custom implementation instead of React Navigation
- **Bottom Tab Navigation**: Workspace, AI, Tasks, People tabs
- **Conditional Rendering**: Different layouts for different screen types
- **State-driven UI**: Navigation state controls component visibility

**Navigation Flow:**
```
User Interaction → handleNavigate() → State Update → Component Re-render → Screen Transition
```

## Data Architecture

### InstantDB Integration

**Schema Design:**
The application uses a comprehensive schema defined in `instant.schema.ts`:

```typescript
// Core entities
- store: Business location information
- products: Inventory items with variants and pricing
- collections: Product groupings and categories
- brands: Product brand information
- categories: Hierarchical product categorization
- vendors: Supplier information
- tags: Product tagging system
- types: Product type classification
- $users: User authentication and profiles
- $files: Media file management
```

**Query Patterns:**
```typescript
// Real-time queries with store filtering
const { data } = db.useQuery(
  currentStore?.id ? {
    products: {
      $: { where: { storeId: currentStore.id } }
    }
  } : { products: {} }
);
```

**Transaction Management:**
```typescript
// Atomic operations for data consistency
await db.transact([
  db.tx.products[productId].update(productData),
  db.tx.inventory[inventoryId].update(stockData)
]);
```

### Cloudflare R2 Service (`src/lib/r2-service.ts`)

**Media Management Service:**
- **File Upload**: Handles image and document uploads to Cloudflare R2
- **File Deletion**: Removes unused media files
- **URL Generation**: Creates public and signed URLs for file access
- **Performance Monitoring**: Tracks upload performance and errors

**Upload Flow:**
```
User Selects Media → Image Picker → File Processing → R2 Upload → URL Generation → Database Update
```

**Key Features:**
- **Unique Key Generation**: Prevents file name conflicts
- **Multiple Format Support**: Images, documents, and other media types
- **Error Handling**: Comprehensive error tracking and recovery
- **Performance Optimization**: Async operations with progress tracking

## Screen Components

### Dashboard (`src/components/dashboard.tsx`)

**Square POS-inspired Dashboard:**
- **Real-time Metrics**: Sales, inventory, and performance data
- **Interactive Charts**: Visual representation of business data
- **Quick Actions**: Fast access to common operations
- **Store-filtered Data**: Shows metrics for currently selected store

**Data Sources:**
- Product inventory counts
- Sales transaction data (mock data for demo)
- Collection statistics
- Real-time value calculations

### Product Management (`src/components/products.tsx`)

**Shopify POS-inspired Interface:**
- **Grid/List Views**: Toggle between display modes
- **Search & Filter**: Real-time product search
- **Bulk Operations**: Multi-select for batch actions
- **Inventory Integration**: Stock level management
- **Image Management**: Product photo handling

**Product Form (`src/components/prod-form.tsx`):**
- **Rich Text Editor**: Detailed product descriptions
- **Variant Management**: Size, color, and other variations
- **Pricing Controls**: Cost, price, and margin calculations
- **Media Gallery**: Multiple product images
- **Inventory Tracking**: Stock levels and availability

### Collections Management (`src/components/collections.tsx`)

**Product Grouping System:**
- **Hierarchical Organization**: Nested collection structure
- **Product Assignment**: Drag-and-drop product organization
- **Bulk Operations**: Mass product management
- **Search Integration**: Find products within collections

## Services & Utilities

### Migration System

**Data Migration Framework:**
- **Schema Evolution**: Handles database schema changes
- **Backward Compatibility**: Maintains support for legacy data
- **Verification System**: Ensures migration integrity
- **Rollback Capability**: Safe migration with recovery options

**Migration Components:**
- `migrate-products.ts`: Product schema migrations
- `cleanup-legacy.ts`: Legacy data cleanup
- `verify-migration.ts`: Migration status verification

### Logging & Error Tracking

**Comprehensive Logging System:**
- **Structured Logging**: Consistent log format across the application
- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Track operation timing and performance
- **Debug Information**: Detailed debugging for development

**Log Levels:**
- **Info**: General application flow
- **Debug**: Detailed debugging information
- **Error**: Error conditions and exceptions
- **Performance**: Timing and performance metrics

## UI Component Architecture

### Design System

**Reusable UI Components (`src/components/ui/`):**
- **Button**: Standardized button with variants (primary, secondary, danger)
- **Input**: Form input with validation and error states
- **Card**: Container component with consistent styling
- **MetricCard**: Dashboard metric display component
- **QuantitySelector**: Inventory quantity adjustment controls
- **R2Image**: Optimized image component with R2 integration

**Design Principles:**
- **Consistency**: Uniform styling across all components
- **Accessibility**: Screen reader support and touch targets
- **Responsiveness**: Adaptive layouts for different screen sizes
- **Performance**: Optimized rendering and memory usage

### Error Handling

**Error Boundary System:**
- **Component-level**: Individual component error isolation
- **Screen-level**: Full screen error recovery
- **Global**: Application-wide error handling
- **User-friendly**: Graceful degradation with helpful messages

**Error Recovery:**
- **Automatic Retry**: Retry failed operations
- **Fallback UI**: Alternative interfaces when errors occur
- **Error Reporting**: Detailed error logs for debugging
- **User Guidance**: Clear instructions for error resolution

## Security & Data Protection

### Data Security

**InstantDB Security:**
- **Real-time Permissions**: Row-level security rules
- **Authentication**: Magic link authentication system
- **Data Validation**: Schema-enforced data integrity
- **Secure Connections**: Encrypted data transmission

**Local Data Protection:**
- **AsyncStorage Encryption**: Sensitive data encryption
- **Secure Key Storage**: Protected credential management
- **Data Sanitization**: Input validation and sanitization
- **Privacy Controls**: User data privacy settings

### Media Security

**Cloudflare R2 Security:**
- **Signed URLs**: Time-limited access to private files
- **Access Controls**: Granular file access permissions
- **Upload Validation**: File type and size restrictions
- **Secure Deletion**: Permanent file removal capabilities

## Performance Optimization

### Data Loading

**Efficient Data Fetching:**
- **Real-time Queries**: Only fetch necessary data
- **Store Filtering**: Limit data to current store context
- **Lazy Loading**: Load data as needed
- **Caching Strategy**: Intelligent data caching

**Image Optimization:**
- **Progressive Loading**: Load images incrementally
- **Size Optimization**: Appropriate image sizes for context
- **Caching**: Local image caching for performance
- **Fallback Images**: Default images for missing content

### Memory Management

**Resource Optimization:**
- **Component Unmounting**: Proper cleanup of resources
- **Memory Leak Prevention**: Careful event listener management
- **Efficient Re-renders**: Optimized React rendering
- **Background Processing**: Non-blocking operations

## Development Workflow

### Code Quality

**Development Standards:**
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency enforcement
- **Testing**: Jest and React Native Testing Library
- **Code Reviews**: Peer review process for quality assurance

**Build Process:**
- **Metro Bundler**: Optimized JavaScript bundling
- **Babel Transpilation**: Modern JavaScript features
- **Asset Optimization**: Image and resource optimization
- **Environment Configuration**: Development and production builds

### Testing Strategy

**Testing Levels:**
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Full user workflow testing
- **Performance Tests**: Load and performance validation

## Deployment Architecture

### Platform Support

**Target Platforms:**
- **Android**: Primary platform with full feature support
- **Web**: Progressive web app capabilities
- **iOS**: Future platform support planned

**Build Configuration:**
- **Expo Application Services (EAS)**: Cloud build and deployment
- **Environment Variables**: Secure configuration management
- **Version Management**: Semantic versioning and release management
- **Over-the-Air Updates**: Instant app updates without app store

### Infrastructure

**Cloud Services:**
- **InstantDB**: Managed database hosting
- **Cloudflare R2**: Global CDN and object storage
- **Expo Services**: Development and deployment platform
- **Analytics**: Application performance monitoring

## Future Considerations

### Scalability

**Horizontal Scaling:**
- **Multi-tenant Architecture**: Support for multiple businesses
- **Data Partitioning**: Efficient data organization
- **Load Balancing**: Distribute traffic across services
- **Caching Layers**: Redis or similar for performance

### Feature Expansion

**Planned Enhancements:**
- **Payment Processing**: Integrated payment solutions
- **Advanced Analytics**: Business intelligence features
- **Multi-language Support**: Internationalization
- **Offline Capabilities**: Enhanced offline functionality
- **API Integration**: Third-party service integrations

### Technology Evolution

**Framework Updates:**
- **React Native Upgrades**: Stay current with framework updates
- **Expo SDK Updates**: Leverage new platform capabilities
- **Database Evolution**: InstantDB feature adoption
- **Performance Improvements**: Continuous optimization

---

*This architecture document serves as a living guide for the TAR POS application. It should be updated as the application evolves and new features are added.*