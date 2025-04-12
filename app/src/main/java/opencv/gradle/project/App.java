package opencv.gradle.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.opencv.core.Core;

@SpringBootApplication
public class App {

    static {
        // Load the native OpenCV library
        System.loadLibrary(Core.NATIVE_LIBRARY_NAME);
    }

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
