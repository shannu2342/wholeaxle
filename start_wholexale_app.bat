@echo off
echo ================================================
echo    Wholexale App - Android Emulator Launcher
echo ================================================
echo.

echo Checking Android emulator status...
adb devices

echo.
echo Starting React Native development server...
echo This may take a few moments...
echo.

npx react-native start --reset-cache

echo.
echo ================================================
echo App is ready! Check your Android emulator.
echo ================================================
echo.
echo Demo Instructions:
echo 1. Use any email/password to login
echo 2. Choose Buyer or Seller mode
echo 3. Explore all the features!
echo.
pause