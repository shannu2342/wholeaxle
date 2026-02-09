
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths

fun main() {
    val androidSdkPath = System.getenv("ANDROID_HOME")
    println("ANDROID_HOME: '$androidSdkPath'")
    val androidSdkRoot = System.getenv("ANDROID_SDK_ROOT")
    println("ANDROID_SDK_ROOT: '$androidSdkRoot'")

    // Try to replicate what SdkLocator.kt does at line 184
    val possibleSdkPaths = listOfNotNull(androidSdkPath, androidSdkRoot, "C:\\Android")

    for (sdkPath in possibleSdkPaths) {
        println("\nTesting SDK path: '$sdkPath'")
        try {
            val file = File(sdkPath)
            if (file.exists() && file.isDirectory) {
                println("  Directory exists")

                // Check if it looks like an Android SDK directory
                val platformTools = File(file, "platform-tools")
                val adb = File(platformTools, "adb.exe")
                val buildTools = File(file, "build-tools")
                val platforms = File(file, "platforms")

                println("  platform-tools exists: ${platformTools.exists()}")
                println("  adb exists: ${adb.exists()}")
                println("  build-tools exists: ${buildTools.exists()}")
                println("  platforms exists: ${platforms.exists()}")

                if (platformTools.exists() && adb.exists() && buildTools.exists() && platforms.exists()) {
                    println("  Looks like a valid Android SDK directory")

                    // Try to list contents
                    try {
                        file.listFiles()?.forEach { child ->
                            print("  - ${child.name}")
                            if (child.isDirectory) print(" (dir)")
                            println()
                        }
                    } catch (e: Exception) {
                        println("  Error listing contents: ${e.message}")
                    }
                } else {
                    println("  Doesn't look like a valid Android SDK directory")
                }
            } else {
                println("  Directory does not exist or is not a directory")
            }
        } catch (e: Exception) {
            println("  Error accessing path: ${e.message}")
            e.printStackTrace()
        }
    }

    // Check if there are any permission issues or other problems
    try {
        val tempFile = File(System.getProperty("java.io.tmpdir"), "test-android-sdk-check.tmp")
        tempFile.createNewFile()
        tempFile.writeText("Test")
        println("\nTemp file created successfully: ${tempFile.absolutePath}")
        tempFile.delete()
    } catch (e: Exception) {
        println("\nError creating temp file: ${e.message}")
        e.printStackTrace()
    }

    try {
        val testPath = Paths.get("C:", "Android")
        if (Files.exists(testPath) && Files.isDirectory(testPath)) {
            println("\nNIO Path check passed")
        }
    } catch (e: Exception) {
        println("\nNIO Path check failed: ${e.message}")
        e.printStackTrace()
    }
}
