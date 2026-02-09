
import java.io.File;
import java.io.IOException;

public class SdkPathTest2 {
    public static void main(String[] args) {
        // Try to find which directory/file is causing the issue
        String[] possiblePaths = {
            "C:\\Android",
            "C:\\Android\\platform-tools",
            "C:\\Android\\platform-tools\\adb.exe",
            "C:\\Android\\build-tools",
            "C:\\Android\\build-tools\\34.0.0",
            "C:\\Android\\platforms",
            "C:\\Android\\platforms\\android-34",
            "C:\\Android\\tools",
            "C:\\Android\\tools\\bin"
        };
        
        for (String path : possiblePaths) {
            System.out.println("\nTesting path: " + path);
            File file = new File(path);
            
            try {
                System.out.println("Exists: " + file.exists());
                if (file.exists()) {
                    System.out.println("Is directory: " + file.isDirectory());
                    System.out.println("Is file: " + file.isFile());
                    System.out.println("Can read: " + file.canRead());
                    System.out.println("Can write: " + file.canWrite());
                    if (file.isDirectory()) {
                        String[] children = file.list();
                        if (children != null) {
                            System.out.println("Number of children: " + children.length);
                        } else {
                            System.out.println("Cannot list directory contents");
                        }
                    }
                }
            } catch (Exception e) {
                System.out.println("Error accessing path: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Check if there are any files/directories with invalid characters
        File androidDir = new File("C:\\Android");
        if (androidDir.exists() && androidDir.isDirectory()) {
            System.out.println("\nContents of C:\\Android:");
            File[] files = androidDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    System.out.println("\n" + f.getName());
                    try {
                        System.out.println("  Path: " + f.getCanonicalPath());
                    } catch (IOException e) {
                        System.out.println("  Error getting canonical path: " + e.getMessage());
                    }
                }
            }
        }
    }
}
