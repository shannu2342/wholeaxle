@echo off
echo Building Android APK for Wholexale App...
echo.

echo Step 1: Installing dependencies (this may take a few minutes)...
npm install --legacy-peer-deps

echo.
echo Step 2: Installing EAS CLI...
npm install -g @expo/eas-cli

echo.
echo Step 3: Login to Expo (you'll need to provide your credentials)...
eas login

echo.
echo Step 4: Configuring EAS build...
eas build:configure

echo.
echo Step 5: Building Android APK...
eas build --platform android --profile preview

echo.
echo Build process completed!
echo Check the output above for download links or visit https://expo.dev/builds