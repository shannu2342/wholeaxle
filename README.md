# Wholexale - React Native App

A React Native mobile application that replicates the UI and functionality of the Wholexale.com B2B marketplace website.

## Features

### 🏠 **Home Screen**
- Custom header with logo, search bar, wishlist, cart, and profile icons
- Banner carousel with automatic scrolling
- Popular categories section with horizontal scrolling
- Product listings with filters (Shape Type, Weave Type, Set Type)
- Brand exploration section
- Hot new arrivals section
- FAQ accordion
- Footer with contact information and app download buttons

### 📱 **App Screens**
- **Home**: Main dashboard with all sections
- **Products**: Product listing with filtering and search
- **Categories**: Category browsing with subcategories
- **Wishlist**: Saved products management
- **Cart**: Shopping cart with quantity management and checkout
- **Profile**: User account and settings
- **Product Detail**: Detailed product view with size, color, and quantity selection

### 🎨 **UI/UX Features**
- Mobile-responsive design
- Bottom tab navigation
- Pull-to-refresh functionality
- Smooth animations and transitions
- Modern card-based layouts
- Consistent color scheme (#0390F3 primary blue)
- Professional typography and spacing

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and build tools
- **React Navigation** - Navigation and routing
- **React Native Vector Icons** - Icon library
- **React Native Swiper Flatlist** - Carousel functionality

## Project Structure

```
├── App.js                     # Main app entry point with navigation
├── package.json               # Dependencies and scripts
├── app.json                   # Expo configuration
├── babel.config.js            # Babel configuration
├── src/
│   ├── screens/               # All app screens
│   │   ├── HomeScreen.js      # Main dashboard
│   │   ├── ProductsScreen.js  # Product listing
│   │   ├── CategoriesScreen.js# Category browsing
│   │   ├── WishlistScreen.js  # Saved products
│   │   ├── CartScreen.js      # Shopping cart
│   │   ├── ProfileScreen.js   # User profile
│   │   └── ProductDetailScreen.js # Product details
│   ├── components/            # Reusable components
│   ├── data/                  # Mock data
│   └── constants/             # App constants
└── assets/                    # Images and icons
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Steps

1. **Clone and Navigate**
   ```bash
   cd wholexale-react-native
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on Device**
   - **Android**: Scan QR code with Expo Go app or press 'a' in terminal
   - **iOS**: Scan QR code with Camera app or press 'i' in terminal
   - **Emulator**: Press 'j' for Android emulator or 'i' for iOS simulator

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser (for testing)
- `npm eject` - Eject from Expo to native code

## Key Components

### Navigation
- Bottom tab navigation with 6 main screens
- Stack navigation for detailed views
- Smooth transitions between screens

### UI Components
- **Header**: Custom search bar with real-time suggestions
- **Product Cards**: Image, pricing, wishlist, and brand information
- **Filter System**: Tab-based filtering with multiple options
- **Carousel**: Auto-scrolling banner and product sliders
- **Modal Views**: Detailed product information

### Data Management
- Mock data for products, categories, and user information
- Local state management with React hooks
- Wishlist and cart functionality

## Customization

### Colors
The app uses a consistent color scheme:
- Primary: `#0390F3` (Blue)
- Background: `#f5f5f5` (Light Gray)
- Cards: `#ffffff` (White)
- Text: `#333333` (Dark Gray)
- Success: `#28a745` (Green)
- Danger: `#ff4757` (Red)

### Adding Assets
1. Place images in the `assets/` folder
2. Update import paths in components
3. Recommended sizes:
   - Logo: 120x40px
   - Product images: 400x400px
   - Banner images: 375x200px

## Deployment

### Building for Production

1. **Android APK**
   ```bash
   expo build:android
   ```

2. **iOS IPA**
   ```bash
   expo build:ios
   ```

3. **Expo Application Services (EAS)**
   ```bash
   npm install -g @expo/eas-cli
   eas build --platform android
   eas build --platform ios
   ```

## Development Notes

### Performance Optimizations
- FlatList for large datasets
- Image caching and lazy loading
- Efficient re-renders with React.memo
- Optimized bundle size

### Cross-Platform Compatibility
- Responsive design for various screen sizes
- Platform-specific styling where needed
- Consistent behavior across iOS and Android

### Testing
- Manual testing on physical devices
- Expo Go app for quick testing
- iOS Simulator and Android Emulator support

## Future Enhancements

- [ ] Backend API integration
- [ ] User authentication
- [ ] Payment gateway integration
- [ ] Push notifications
- [ ] Offline support
- [ ] Advanced search and filters
- [ ] User reviews and ratings
- [ ] Chat support
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions and support:
- Email: support@wholexale.com
- Documentation: [Project Wiki]
- Issues: [GitHub Issues]

---

**Built with ❤️ using React Native and Expo**