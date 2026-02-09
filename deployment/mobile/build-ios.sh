#!/bin/bash
# iOS App Build Script
# Wholexale.com B2B Marketplace - Production Build

set -e

# Configuration
APP_NAME="Wholexale"
BUNDLE_ID="com.wholexale.app"
BUILD_TYPE="${1:-release}"  # release or debug
VERSION_NUMBER="1.0.0"
BUILD_NUMBER=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
ASSETS_DIR="$PROJECT_ROOT/app-store-deployment"
EXPORT_OPTIONS_PLIST="$IOS_DIR/ExportOptions.plist"

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
    
    # Check if we're on macOS
    if [[ "$(uname -s)" != "Darwin" ]]; then
        error "iOS builds must be performed on macOS"
    fi
    
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        error "Xcode command line tools not found. Please install Xcode."
    fi
    
    # Check Xcode version
    xcode_version=$(xcodebuild -version | head -1 | awk '{print $2}')
    info "Xcode version: $xcode_version"
    
    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed."
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
    fi
    
    # Check for signing certificates
    if [[ "$BUILD_TYPE" == "release" ]]; then
        if [[ -z "$DEVELOPER_ID" ]]; then
            error "DEVELOPER_ID environment variable not set for release build"
        fi
        
        if [[ -z "$TEAM_ID" ]]; then
            error "TEAM_ID environment variable not set for release build"
        fi
    fi
    
    log "Prerequisites check completed"
}

# Setup build environment
setup_build_environment() {
    log "Setting up build environment..."
    
    # Install Node.js dependencies
    log "Installing Node.js dependencies..."
    cd "$PROJECT_ROOT"
    npm ci --production
    
    # Install iOS dependencies
    log "Installing iOS dependencies..."
    cd "$IOS_DIR"
    
    if [[ -f "Podfile" ]]; then
        pod install
    else
        warning "No Podfile found in iOS directory"
    fi
    
    # Clean previous builds
    xcodebuild clean -workspace "$APP_NAME.xcworkspace" -scheme "$APP_NAME" || true
    
    log "Build environment setup completed"
}

# Configure signing
configure_signing() {
    if [[ "$BUILD_TYPE" == "release" ]]; then
        log "Configuring release signing..."
        
        # Check for provisioning profile
        if [[ -z "$PROVISIONING_PROFILE" ]]; then
            error "PROVISIONING_PROFILE environment variable not set"
        fi
        
        # Check for certificate
        if [[ -z "$CERTIFICATE_PASSWORD" ]]; then
            error "CERTIFICATE_PASSWORD environment variable not set"
        fi
        
        # Create export options plist
        create_export_options_plist
        
        info "Using provisioning profile: $PROVISIONING_PROFILE"
        info "Team ID: $TEAM_ID"
    fi
}

# Create ExportOptions.plist
create_export_options_plist() {
    log "Creating ExportOptions.plist..."
    
    cat > "$EXPORT_OPTIONS_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>uploadBitcode</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <true/>
    <key>destination</key>
    <string>export</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>$BUNDLE_ID</key>
        <string>$PROVISIONING_PROFILE</string>
    </dict>
</dict>
</plist>
EOF
    
    info "ExportOptions.plist created"
}

# Build JavaScript bundle
build_js_bundle() {
    log "Building JavaScript bundle for iOS..."
    
    cd "$PROJECT_ROOT"
    
    # Build bundle for iOS
    npx react-native bundle \
        --platform ios \
        --dev false \
        --entry-file index.js \
        --bundle-output "$IOS_DIR/$APP_NAME/main.jsbundle" \
        --assets-dest "$IOS_DIR/$APP_NAME/Images.xcassets" \
        --verbose
    
    log "JavaScript bundle built successfully"
}

# Build iOS app
build_ios_app() {
    log "Building iOS $BUILD_TYPE app..."
    
    cd "$IOS_DIR"
    
    # Set version info
    export VERSION_NUMBER="$VERSION_NUMBER"
    export BUILD_NUMBER="$BUILD_NUMBER"
    
    if [[ "$BUILD_TYPE" == "release" ]]; then
        # Build for App Store
        xcodebuild archive \
            -workspace "$APP_NAME.xcworkspace" \
            -scheme "$APP_NAME" \
            -configuration Release \
            -archivePath "$APP_NAME.xcarchive" \
            -destination generic/platform=iOS \
            CODE_SIGN_IDENTITY="$DEVELOPER_ID" \
            CODE_SIGNING_REQUIRED=YES \
            CODE_SIGNING_ALLOWED=YES
    else
        # Build for development
        xcodebuild archive \
            -workspace "$APP_NAME.xcworkspace" \
            -scheme "$APP_NAME" \
            -configuration Debug \
            -archivePath "$APP_NAME.xcarchive" \
            -destination generic/platform=iOS \
            CODE_SIGN_IDENTITY="iPhone Developer" \
            CODE_SIGNING_REQUIRED=YES \
            CODE_SIGNING_ALLOWED=YES
    fi
    
    log "iOS app build completed"
}

# Export IPA
export_ipa() {
    if [[ "$BUILD_TYPE" == "release" ]]; then
        log "Exporting IPA for App Store..."
        
        cd "$IOS_DIR"
        
        # Export IPA
        xcodebuild -exportArchive \
            -archivePath "$APP_NAME.xcarchive" \
            -exportPath ./export \
            -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
            -allowProvisioningUpdates
        
        # Find and copy IPA file
        ipa_file=$(find ./export -name "*.ipa" | head -1)
        if [[ -n "$ipa_file" ]]; then
            cp "$ipa_file" "$ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa"
            info "IPA created: $ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa"
        else
            error "No IPA file found in export directory"
        fi
    else
        log "Building debug IPA for testing..."
        
        cd "$IOS_DIR"
        
        # For debug builds, just create an archive
        xcodebuild -exportArchive \
            -archivePath "$APP_NAME.xcarchive" \
            -exportPath ./export \
            -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
            -allowProvisioningUpdates
        
        # Find and copy IPA file
        ipa_file=$(find ./export -name "*.ipa" | head -1)
        if [[ -n "$ipa_file" ]]; then
            cp "$ipa_file" "$ASSETS_DIR/wholexale-debug-$BUILD_NUMBER.ipa"
            info "Debug IPA created: $ASSETS_DIR/wholexale-debug-$BUILD_NUMBER.ipa"
        fi
    fi
}

# Generate build report
generate_build_report() {
    log "Generating build report..."
    
    # Create build report
    cat > "$ASSETS_DIR/ios-build-report.txt" << EOF
Wholexale iOS Build Report
==========================
Build Date: $(date)
Build Type: $BUILD_TYPE
Version Number: $VERSION_NUMBER
Build Number: $BUILD_NUMBER
Bundle ID: $BUNDLE_ID

Build Environment:
macOS: $(sw_vers -productVersion)
Xcode: $(xcodebuild -version | head -1 | awk '{print $2}')
Node.js: $(node --version)
npm: $(npm --version)

Build completed successfully at $(date)
EOF
    
    info "Build report generated: $ASSETS_DIR/ios-build-report.txt"
    
    log "Build report generation completed"
}

# Upload to App Store Connect (if configured)
upload_to_appstore() {
    if [[ "$BUILD_TYPE" == "release" ]] && [[ -n "$APP_STORE_PASSWORD" ]]; then
        log "Uploading to App Store Connect..."
        
        # This would use altool for uploading
        # altool --upload-app -f "$ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa" -t ios -u "$APP_STORE_USERNAME" -p "$APP_STORE_PASSWORD"
        
        info "IPA ready for App Store submission"
        info "Upload command: altool --upload-app -f $ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa -t ios -u YOUR_USERNAME -p YOUR_PASSWORD"
        
        log "App Store Connect upload preparation completed"
    fi
}

# Verify build
verify_build() {
    log "Verifying build..."
    
    cd "$IOS_DIR"
    
    # Check if archive was created
    if [[ ! -d "$APP_NAME.xcarchive" ]]; then
        error "Archive not found at $IOS_DIR/$APP_NAME.xcarchive"
    fi
    
    # Get archive info
    xcodebuild -showBuildSettings -archivePath "$APP_NAME.xcarchive" > archive-info.txt
    info "Archive information saved to archive-info.txt"
    
    # Check IPA if it exists
    if [[ -f "$ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa" ]]; then
        ipa_size=$(du -h "$ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa" | cut -f1)
        info "IPA size: $ipa_size"
    fi
    
    log "Build verification completed"
}

# Main build function
main() {
    log "Starting iOS app build for Wholexale"
    log "Build type: $BUILD_TYPE"
    log "Version: $VERSION_NUMBER ($BUILD_NUMBER)"
    log "Bundle ID: $BUNDLE_ID"
    
    check_prerequisites
    setup_build_environment
    configure_signing
    build_js_bundle
    build_ios_app
    export_ipa
    verify_build
    generate_build_report
    upload_to_appstore
    
    log "iOS app build completed successfully!"
    
    # Show results
    if [[ -f "$ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa" ]]; then
        info "IPA location: $ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa"
        ls -lh "$ASSETS_DIR/wholexale-$VERSION_NUMBER.ipa"
    fi
}

# Handle cleanup on exit
cleanup() {
    # Clean temporary files
    cd "$IOS_DIR"
    rm -f "$EXPORT_OPTIONS_PLIST" || true
    rm -rf ./export || true
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
        cd "$IOS_DIR"
        xcodebuild clean -workspace "$APP_NAME.xcworkspace" -scheme "$APP_NAME"
        rm -rf "$APP_NAME.xcarchive"
        rm -rf ./export
        rm -f "$EXPORT_OPTIONS_PLIST"
        log "Build artifacts cleaned"
        ;;
    "archive")
        BUILD_TYPE="release"
        check_prerequisites
        setup_build_environment
        build_js_bundle
        build_ios_app
        log "Archive created successfully at $IOS_DIR/$APP_NAME.xcarchive"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [debug|release|clean|archive|help]"
        echo ""
        echo "Commands:"
        echo "  debug   - Build debug IPA (default: release)"
        echo "  release - Build release IPA for App Store"
        echo "  clean   - Clean build artifacts"
        echo "  archive - Create archive without exporting"
        echo "  help    - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  DEVELOPER_ID - Developer ID for signing"
        echo "  TEAM_ID - Apple Team ID"
        echo "  PROVISIONING_PROFILE - Provisioning profile name"
        echo "  CERTIFICATE_PASSWORD - Certificate password"
        echo "  APP_STORE_PASSWORD - App Store Connect password"
        ;;
    *)
        error "Unknown command: $1. Use 'help' for usage information."
        ;;
esac
