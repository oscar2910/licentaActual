package opencv.gradle.project.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Adjust the path pattern to match your endpoints
        // Here, "/api/**" covers "/api/process/grayscale"
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:4200") // Angular dev server
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
            .allowedHeaders("*") 
            .allowCredentials(true);
    }
}
