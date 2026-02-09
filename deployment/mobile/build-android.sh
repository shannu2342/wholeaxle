#!/bin/bash
# Android APK Build Script
# Wholexale.com B2B Marketplace - Production Build

set -e

# Configuration
APP_NAME="Wholexale"
PACKAGE_NAME="com.wholexale.app"
BUILD_TYPE="${1:-release}"  # release or debug
VERSION_CODE=$(date +%s)
VERSION_NAME="1.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
BUILD_OUTPUT="$ANDROID_DIR/app/build/outputs/apk/$BUILD_TYPE"
TEMP_DIR="/tmp/wholexale-build"
ASSETS_DIR="$PROJECT_ROOT/app-store-deployment"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Java is installed
    if ! command -v java &> /dev/null; then
        error "Java is not installed. Please install Java 11 or higher."
    fi
    
    # Check Java version
    java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    info "Java version: $java_version"
    
    # Check if Android SDK is set
    if [[ -z "$ANDROID_HOME" ]]; then
        warning "ANDROID_HOME not set. Please set ANDROID_HOME to your Android SDK path."
        # Try to find it in common locations
        if [[ -d "/opt/android-sdk" ]]; then
            export ANDROID_HOME="/opt/android-sdk"
            info "Using Android SDK from: $ANDROID_HOME"
        elif [[ -d "$HOME/Android/Sdk" ]]; then
            export ANDROID_HOME="$HOME/Android/Sdk"
            info "Using Android SDK from: $ANDROID_HOME"
        else
            error "Android SDK not found. Please install Android SDK and set ANDROID_HOME."
        fi
    fi
    
    # Check if Gradle is available
    if ! command -v gradle &> /dev/null; then
        if [[ -f "$ANDROID_DIR/gradlew" ]]; then
            info "Using Gradle wrapper"
            GRADLE_CMD="./gradlew"
        else
            error "Gradle not found. Please install Gradle or use the Gradle wrapper."
        fi
    else
        GRADLE_CMD="gradle"
    fi
    
    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed."
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    log "Prerequisites check completed"
}

# Setup build environment
setup_build_environment() {
    log "Setting up build environment..."
    
    # Clean previous builds
    rm -rf "$BUILD_OUTPUT"
    mkdir -p "$BUILD_OUTPUT"
    
    # Clean temp directory
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Install Node.js dependencies
    log "Installing Node.js dependencies..."
    cd "$PROJECT_ROOT"
    npm ci --production
    
    # Install Android dependencies
    log "Installing Android dependencies..."
    cd "$ANDROID_DIR"
    
    if [[ -f "gradlew" ]]; then
        chmod +x gradlew
        ./gradlew clean
    else
        gradle clean
    fi
    
    log "Build environment setup completed"
}

# Configure signing for release builds
configure_signing() {
    if [[ "$BUILD_TYPE" == "release" ]]; then
        log "Configuring release signing..."
        
        # Check if keystore exists
        KEYSTORE_PATH="$ANDROID_DIR/app/wholexale.keystore"
        if [[ ! -f "$KEYSTORE_PATH" ]]; then
            error "Release keystore not found at $KEYSTORE_PATH"
        fi
        
        # Verify keystore properties
        if [[ -z "$KEYSTORE_PASSWORD" ]]; then
            error "KEYSTORE_PASSWORD environment variable not set"
        fi
        
        if [[ -z "$KEY_ALIAS" ]]; then
            export KEY_ALIAS="wholexale-key"
        fi
        
        if [[ -z "$KEY_PASSWORD" ]]; then
            error "KEY_PASSWORD environment variable not set"
        fi
        
        info "Using keystore: $KEYSTORE_PATH"
        info "Key alias: $KEY_ALIAS"
    fi
}

# Build the React Native bundle
build_js_bundle() {
    log "Building React Native JavaScript bundle..."
    
    cd "$PROJECT_ROOT"
    
    # Create bundle directory
    mkdir -p "$ANDROID_DIR/app/src/main/assets"
    
    # Build bundle
    if command -v npx &> /dev/null; then
        npx react-native bundle \
            --platform android \
            --dev false \
            --entry-file index.js \
            --bundle-output "$ANDROID_DIR/app/src/main/assets/index.android.bundle" \
            --assets-dest "$ANDROID_DIR/app/src/main/res" \
            --verbose
    else
        error "npx not found. Please ensure Node.js is properly installed."
    fi
    
    log "JavaScript bundle built successfully"
}

# Build APK
build_apk() {
    log "Building $BUILD_TYPE APK..."
    
    cd "$ANDROID_DIR"
    
    # Set environment variables for signing
    export KEYSTORE_FILE="wholexale.keystore"
    export KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD"
    export KEY_ALIAS="${KEY_ALIAS:-wholexale-key}"
    export KEY_PASSWORD="$KEY_PASSWORD"
    
    # Build APK
    if [[ "$BUILD_TYPE" == "release" ]]; then
        if [[ -f "gradlew" ]]; then
            ./gradlew assembleRelease
        else
            gradle assembleRelease
        fi
    else
        if [[ -f "gradlew" ]]; then
            ./gradlew assembleDebug
        else
            gradle assembleDebug
        fi
    fi
    
    log "APK build completed"
}

# Optimize APK
optimize_apk() {
    log "Optimizing APK..."
    
    cd "$BUILD_OUTPUT"
    
    # Find APK file
    apk_file=$(find . -name "*.apk" | head -1)
    
    if [[ -z "$apk_file" ]]; then
        error "No APK file found in $BUILD_OUTPUT"
    fi
    
    info "Found APK: $apk_file"
    
    # Zipalign APK (if tools available)
    if command -v zipalign &> /dev/null; then
        aligned_apk="${apk_file%.apk}-aligned.apk"
        zipalign -v 4 "$apk_file" "$aligned_apk"
        mv "$aligned_apk" "$apk_file"
        info "APK zipaligned successfully"
    else
        warning "zipalign not found, skipping optimization"
    fi
    
    # Sign APK if not already signed
    if [[ "$BUILD_TYPE" == "release" ]]; then
        if command -v apksigner &> /dev/null; then
            apksigner sign --ks "$ANDROID_DIR/app/wholexale.keystore" \
                          --ks-key-alias "$KEY_ALIAS" \
                          --ks-pass "pass:$KEYSTORE_PASSWORD" \
                          --key-pass "pass:$KEY_PASSWORD" \
                          --out "${apk_file%.apk}-signed.apk" \
                          "$apk_file"
            mv "${apk_file%.apk}-signed.apk" "$apk_file"
            info "APK signed successfully"
        else
            warning "apksigner not found, APK might already be signed"
        fi
    fi
    
    log "APK optimization completed"
}

# Verify APK
verify_apk() {
    log "Verifying APK..."
    
    cd "$BUILD_OUTPUT"
    
    # Find APK file
    apk_file=$(find . -name "*.apk" | head -1)
    
    # Check APK integrity
    if command -v aapt &> /dev/null; then
        aapt dump badging "$apk_file" > apk_info.txt
        info "APK info:"
        cat apk_info.txt
    fi
    
    # Verify signature (if tools available)
    if [[ "$BUILD_TYPE" == "release" ]] && command -v apksigner &> /dev/null; then
        apksigner verify "$apk_file"
        info "APK signature verified"
    fi
    
    # Get APK size
    apk_size=$(du -h "$apk_file" | cut -f1)
    info "APK size: $apk_size"
    
    log "APK verification completed"
}

# Generate build report
generate_build_report() {
    log "Generating build report..."
    
    cd "$BUILD_OUTPUT"
    
    # Find APK file
    apk_file=$(find . -name "*.apk" | head -1)
    
    # Create build report
    cat > build-report.txt << EOF
Wholexale Android Build Report
==============================
Build Date: $(date)
Build Type: $BUILD_TYPE
Version Code: $VERSION_CODE
Version Name: $VERSION_NAME
Package Name: $PACKAGE_NAME

APK Information:
File: $(basename "$apk_file")
Size: $(du -h "$apk_file" | cut -f1)
Location: $apk_file

Build Environment:
OS: $(uname -s) $(uname -r)
Java: $(java -version 2>&1 | head -1)
Node.js: $(node --version)
npm: $(npm --version)
Android SDK: ${ANDROID_HOME:-Not set}

Build completed successfully at $(date)
EOF
    
    info "Build report generated: $BUILD_OUTPUT/build-report.txt"
    
    # Copy report to assets
    cp build-report.txt "$ASSETS_DIR/android-build-report.txt"
    
    log "Build report generation completed"
}

# Upload to Google Play Console (if configured)
upload_to_play_console() {
    if [[ "$BUILD_TYPE" == "release" ]] && [[ -n "$GOOGLE_PLAY_SERVICE_ACCOUNT" ]]; then
        log "Uploading to Google Play Console..."
        
        # This would typically use the Google Play Developer API
        # For now, we'll just copy the APK to a upload directory
        
        upload_dir="$TEMP_DIR/google-play-upload"
        mkdir -p "$upload_dir"
        
        cd "$BUILD_OUTPUT"
        apk_file=$(find . -name "*.apk" | head -1)
        cp "$apk_file" "$upload_dir/wholexale-$VERSION_NAME.apk"
        
        info "APK ready for upload at: $upload_dir/wholexale-$VERSION_NAME.apk"
        info "Use Google Play Console to upload the APK manually"
        
        log "Upload preparation completed"
    fi
}

# Main build function
main() {
    log "Starting Android APK build for Wholexale"
    log "Build type: $BUILD_TYPE"
    log "Version: $VERSION_NAME ($VERSION_CODE)"
    
    check_prerequisites
    setup_build_environment
    configure_signing
    build_js_bundle
    build_apk
    optimize_apk
    verify_apk
    generate_build_report
    upload_to_play_console
    
    log "Android APK build completed successfully!"
    
    # Show results
    cd "$BUILD_OUTPUT"
    info "Build output directory: $BUILD_OUTPUT"
    find . -name "*.apk" -exec ls -lh {} \;
}

# Handle cleanup on exit
cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}

trap cleanup EXIT

# Handle script arguments
case "${1:-release}" in
    "debug")
        BUILD_TYPE="debug"
        main
        ;;
    "release")
        BUILD_TYPE="release"
        main
        ;;
    "clean")
        log "Cleaning build artifacts..."
        cd "$ANDROID_DIR"
        if [[ -f "gradlew" ]]; then
            ./gradlew clean
        else
            gradle clean
        fi
        rm -rf "$BUILD_OUTPUT"
        log "Build artifacts cleaned"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [debug|release|clean|help]"
        echo ""
        echo "Commands:"
        echo "  debug   - Build debug APK (default: release)"
        echo "  release - Build release APK"
        echo "  clean   - Clean build artifacts"
        echo "  help    - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  ANDROID_HOME - Android SDK path"
        echo "  KEYSTORE_PASSWORD - Keystore password for release builds"
        echo "  KEY_PASSWORD - Key password for release builds"
        echo "  KEY_ALIAS - Key alias (default: wholexale-key)"
        echo "  GOOGLE_PLAY_SERVICE_ACCOUNT - Google Play service account JSON"
        ;;
    *)
        error "Unknown command: $1. Use 'help' for usage information."
        ;;
esac
