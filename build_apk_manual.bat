@echo off
echo ========================================
echo Manual APK Build for Wholexale App
echo ========================================
echo.

echo Step 1: Checking build environment...
node --version
npm --version

echo.
echo Step 2: Attempting to install EAS CLI...
npm install -g @expo/eas-cli --registry https://registry.npmjs.org/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  EAS CLI installation failed due to registry issues.
    echo    You can try one of these alternatives:
    echo.
    echo    Option 1: Use Expo Web Build Service
    echo    - Visit: https://expo.dev/accounts/your-username/projects/wholexale-app/builds
    echo    - Login with your Expo account
    echo    - Create new build for Android
    echo.
    echo    Option 2: Fix npm registry and retry
    echo    - npm config set registry https://registry.npmjs.org/
    echo    - npm cache clean --force
    echo    - npm install -g @expo/eas-cli
    echo.
    echo    Option 3: Use manual build process
    echo    - Install Android Studio
    echo    - Setup Android SDK
    echo    - Run: eas build --platform android --local
    echo.
    goto :end
)

echo.
echo Step 3: Login to Expo...
eas login

echo.
echo Step 4: Build APK...
eas build --platform android --profile preview

echo.
echo Build completed! Check the output for download links.
:end
echo.
echo ========================================
echo Build process finished.
echo ========================================
pause