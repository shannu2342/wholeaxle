// Plugins block: Define build plugins using version catalog aliases for better maintainability
// Centralizes version management and ensures consistency across modules
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.wholexale.app"
    compileSdk = 35  // Updated to latest SDK for better compatibility and features

    defaultConfig {
        applicationId = "com.wholexale.app"
        minSdk = 24  // Increased minSdk for better security and performance (Android 7.0+)
        targetSdk = 35  // Updated to match compileSdk
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Add build config fields for runtime access to version info
        buildConfigField("String", "BUILD_TIME", "\"${System.currentTimeMillis()}\"")
    }

    buildTypes {
        debug {
            // Enable build config for debug builds
            buildConfigField("boolean", "DEBUG_MODE", "true")
        }
        release {
            isMinifyEnabled = true  // Enable minification for better performance and smaller APK
            isShrinkResources = true  // Shrink resources to reduce APK size
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Add signing config (requires keystore setup)
            // signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17  // Updated to Java 17 for better performance
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"  // Match Java version
    }

    // Add lint options for better code quality
    lint {
        abortOnError = false  // Don't fail build on lint errors, but report them
        checkReleaseBuilds = true  // Check lint on release builds
    }

    // Enable build optimization features
    buildFeatures {
        buildConfig = true  // Enable build config generation
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    // Add additional dependencies for better functionality (if needed)
    // implementation(libs.androidx.lifecycle.viewmodel.ktx)
}