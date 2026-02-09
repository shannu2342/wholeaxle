plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("de.undercouch.download") version "5.6.0"
    id("com.facebook.react")
}

val enableProguardInReleaseBuilds = (findProperty("android.enableProguardInReleaseBuilds")?.toString()?.toBoolean() ?: false)
val FLIPPER_VERSION = "0.164.0"
val hermesEnabled = findProperty("hermesEnabled")?.toString()?.toBoolean() ?: false
val jscFlavor = "org.webkit:android-jsc:+"

android {
    ndkVersion = "25.1.8937393"

    buildToolsVersion = "34.0.0"
    compileSdk = 34

    namespace = "com.wholexale.app"
    defaultConfig {
        applicationId = "com.wholexale.app"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        testBuildType = "debug"
        multiDexEnabled = true

        // `react-native-camera` publishes product flavors (general/mlkit). Gradle requires
        // choosing a default when the app itself doesn't declare that flavor dimension.
        missingDimensionStrategy("react-native-camera", "general")

        // Build config fields for React Native
        buildConfigField("boolean", "IS_NEW_ARCHITECTURE_ENABLED", "false")
        buildConfigField("boolean", "IS_HERMES_ENABLED", hermesEnabled.toString())
    }
    signingConfigs {
        // Debug signing config is already provided by the React Native Gradle plugin
    }
    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("debug")
            // Allow installing debug builds alongside a real Play Store/release install.
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        // Standalone installable build (does NOT require Metro)
        // Use: cd android && gradlew assembleStaging
        create("staging") {
            initWith(getByName("release"))
            signingConfig = signingConfigs.getByName("debug")
            matchingFallbacks += listOf("release")
            isDebuggable = false

            // Avoid "App not installed" / package conflicts when a different-signed release
            // (e.g., Play Store build) with the same applicationId already exists on the device.
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
        }
        getByName("release") {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = enableProguardInReleaseBuilds
            proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
        }
    }
    packagingOptions {
        pickFirst("**/libc++_shared.so")
        pickFirst("**/libjsc.so")
    }

    // AGP 7.3.x Lint can mis-handle Kotlin 1.8 metadata from common RN deps (screens, lifecycle, etc.),
    // surfacing noisy "Module was compiled with an incompatible version of Kotlin" messages during
    // `lintVitalAnalyze*` even though the APK is otherwise buildable.
    // Disable release/staging lint-vital so CI/local release APK generation remains reliable.
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

// React Native Gradle Plugin configuration
// NOTE: Debug builds normally load JS from Metro; for standalone APK installs use the `staging` (or `release`) variant.
react {
    // Explicit entry file so Gradle bundling is stable across environments.
    entryFile.set(file("../../index.js"))
    bundleAssetName.set("index.android.bundle")
    // Ensure only the debug variant is treated as dev (no Metro required at runtime).
    debuggableVariants.set(listOf("debug"))
}

// React Native CLI autolinking (generates `com.facebook.react.PackageList` and wires native deps)
apply(from = file("../../node_modules/react-native/node_modules/@react-native-community/cli-platform-android/native_modules.gradle"))
val applyNativeModulesAppBuildGradle =
    project.extra["applyNativeModulesAppBuildGradle"] as groovy.lang.Closure<*>
applyNativeModulesAppBuildGradle.call(project)

// Ensure react-native-vector-icons fonts are bundled for release/staging APKs.
apply(from = file("../../node_modules/react-native-vector-icons/fonts.gradle"))

dependencies {
    // The version of react-native is set by the React Native Gradle Plugin
    implementation("com.facebook.react:react-android")

    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.0.0")
    implementation("androidx.multidex:multidex:2.0.1")

    add("debugImplementation", "com.facebook.flipper:flipper:${FLIPPER_VERSION}")
    add("debugImplementation", "com.facebook.flipper:flipper-network-plugin:${FLIPPER_VERSION}") {
        exclude(group = "com.squareup.okhttp3", module = "okhttp")
    }
    add("debugImplementation", "com.facebook.flipper:flipper-fresco-plugin:${FLIPPER_VERSION}")

    if (hermesEnabled) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation(jscFlavor)
    }
}

// --- Dependency version pinning ---
// Some transitive dependencies may pull alpha AndroidX artifacts that require newer AGP/compileSdk.
// Keep the project buildable on AGP 7.3.1 + compileSdk 34.
configurations.configureEach {
    resolutionStrategy.force(
        "androidx.browser:browser:1.8.0",
        "androidx.webkit:webkit:1.10.0",
        "androidx.activity:activity:1.7.2",
        "androidx.activity:activity-ktx:1.7.2",
    )

    // Keep AndroidX Lifecycle artifacts on a stable version compatible with AGP 7.3.x/D8.
    resolutionStrategy.eachDependency {
        if (requested.group == "androidx.lifecycle") {
            // `lifecycle-extensions` is a legacy artifact; latest is 2.2.0 (there is no 2.6.x/2.8.x).
            if (requested.name == "lifecycle-extensions") {
                useVersion("2.2.0")
            } else {
                useVersion("2.6.2")
            }
        }
    }
}

val REACT_NATIVE_VERSION = if (File("../node_modules/react-native/package.json").exists()) "react-native" else "0.0.0"
project.ext.set("REACT_NATIVE_VERSION", REACT_NATIVE_VERSION)

// Run this once to be able to run the application with BUCK
// puts all compile dependencies into folder libs for BUCK to use
tasks.register<Copy>("copyDownloadableDepsToLibs") {
    from(configurations.getByName("implementation"))
    into("libs")
}
