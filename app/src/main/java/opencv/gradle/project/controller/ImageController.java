package opencv.gradle.project.controller;

import opencv.gradle.project.dto.ImageRequest;
import opencv.gradle.project.service.ImageProcessingService;
import org.opencv.core.Mat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/process")
public class ImageController {

    private final ImageProcessingService imageService;

    @Autowired
    public ImageController(ImageProcessingService imageService) {
        this.imageService = imageService;
    }

    @PostMapping("/grayscale")
    public ResponseEntity<String> grayscale(@RequestBody ImageRequest request) {
        Mat input = imageService.fromBase64(request.getBase64Image());
        Mat gray = imageService.grayScaleImage(input);
        String result = imageService.toBase64(gray);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/noise")
    public ResponseEntity<String> noiseReduction(@RequestBody ImageRequest request) {
        Mat input = imageService.fromBase64(request.getBase64Image());
        Mat denoised = imageService.noiseReductionImage(input);
        String result = imageService.toBase64(denoised);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/histogram")
    public ResponseEntity<String> histogramEqualization(@RequestBody ImageRequest request) {
        Mat input = imageService.fromBase64(request.getBase64Image());
        Mat histEq = imageService.histogramEqualizationImage(input);
        String result = imageService.toBase64(histEq);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/otsu")
    public ResponseEntity<String> otsu(@RequestBody ImageRequest request) {
        Mat input = imageService.fromBase64(request.getBase64Image());
        Mat otsu = imageService.otsuThresholdSegmentation(input);
        String result = imageService.toBase64(otsu);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/kmeans")
    public ResponseEntity<String> kmeans(@RequestBody ImageRequest request) {
        Mat input = imageService.fromBase64(request.getBase64Image());
        int k = (request.getK() != null) ? request.getK() : 2; // default k=2
        Mat kmeans = imageService.kMeansColorSegmentation(input, k);
        String result = imageService.toBase64(kmeans);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/watershed")
    public ResponseEntity<String> watershed(@RequestBody ImageRequest request) {
        Mat input = imageService.fromBase64(request.getBase64Image());
        Mat ws = imageService.applyWatershedSegmentation(input);
        String result = imageService.toBase64(ws);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/canny")
    public ResponseEntity<String> canny(@RequestBody ImageRequest request) {
        Mat input = imageService.fromBase64(request.getBase64Image());
        double t1 = (request.getThreshold1() != null) ? request.getThreshold1() : 50.0;
        double t2 = (request.getThreshold2() != null) ? request.getThreshold2() : 100.0;
        Mat edges = imageService.cannyEdgeDetection(input, t1, t2);
        String result = imageService.toBase64(edges);
        return ResponseEntity.ok(result);
    }
}
