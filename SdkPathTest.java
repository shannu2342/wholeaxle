
import java.io.File;
import java.io.IOException;

public class SdkPathTest {
    public static void main(String[] args) {
        String androidSdkPath = System.getenv("ANDROID_HOME");
        System.out.println("ANDROID_HOME environment variable: '" + androidSdkPath + "'");
        
        androidSdkPath = System.getenv("ANDROID_SDK_ROOT");
        System.out.println("ANDROID_SDK_ROOT environment variable: '" + androidSdkPath + "'");
        
        // Try to validate the path like Android Gradle Plugin does
        try {
            File sdkDir = new File("C:\\Android");
            System.out.println("C:\\Android as File: " + sdkDir);
            System.out.println("C:\\Android exists: " + sdkDir.exists());
            System.out.println("C:\\Android is directory: " + sdkDir.isDirectory());
            
            File platformTools = new File(sdkDir, "platform-tools");
            System.out.println("platform-tools exists: " + platformTools.exists());
            
            File adb = new File(platformTools, "adb.exe");
            System.out.println("adb exists: " + adb.exists());
            System.out.println("adb is executable: " + adb.canExecute());
        } catch (Exception e) {
            System.out.println("Error validating SDK path: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Test with trailing space
        try {
            File sdkDir = new File("C: \\Android");
            System.out.println("\nC: \\Android as File: " + sdkDir);
            System.out.println("C: \\Android exists: " + sdkDir.exists());
        } catch (Exception e) {
            System.out.println("Error validating SDK path with trailing space: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
