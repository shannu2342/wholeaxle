// Top-level build file where you can add configuration options common to all sub-projects/modules.

val buildToolsVersion by extra("34.0.0")
val minSdkVersion by extra(23)
val compileSdkVersion by extra(34)
val targetSdkVersion by extra(34)
val kotlinVersion by extra("1.9.23")
val ndkVersion by extra("25.1.8937393")

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.23")
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}