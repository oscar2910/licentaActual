package opencv.gradle.project.service;

import opencv.gradle.project.dto.ImageRequest;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
public class ImageProcessingService {

    /**
     * Takes a base64-encoded image (PNG/JPEG) and decodes it into an OpenCV Mat.
     */
    public Mat fromBase64(String base64) {
        byte[] decoded = Base64.getDecoder().decode(base64);

        // Convert byte[] to a Mat. We can wrap it in a MatOfByte and use imdecode.
        Mat matOfByte = new MatOfByte(decoded);
        Mat mat = Imgcodecs.imdecode(matOfByte, Imgcodecs.IMREAD_COLOR);
        return mat;
    }

    /**
     * Converts a Mat to a base64-encoded PNG by default.
     */
    public String toBase64(Mat mat) {
        // Convert Mat to MatOfByte in PNG format
        MatOfByte buffer = new MatOfByte();
        Imgcodecs.imencode(".png", mat, buffer);
        byte[] encoded = Base64.getEncoder().encode(buffer.toArray());
        return new String(encoded);
    }

    /**
     * Converts the image to grayscale.
     */
    public Mat grayScaleImage(Mat input) {
        if (input.empty()) {
            return input;
        }
        Mat gray = new Mat();
        Imgproc.cvtColor(input, gray, Imgproc.COLOR_BGR2GRAY);
        return gray;
    }

    /**
     * Applies median blur for noise reduction (kernel size=3).
     */
    public Mat noiseReductionImage(Mat input) {
        if (input.empty()) {
            return input;
        }
        Mat denoised = new Mat();
        Imgproc.medianBlur(input, denoised, 3);
        return denoised;
    }

    /**
     * Applies histogram equalization (using CLAHE).
     */
    public Mat histogramEqualizationImage(Mat input) {
        if (input.empty()) {
            return input;
        }

        Mat result = new Mat();

        // If color image, convert to YCrCb, apply CLAHE to the Y channel
        if (input.channels() == 3) {
            Mat ycrcb = new Mat();
            Imgproc.cvtColor(input, ycrcb, Imgproc.COLOR_BGR2YCrCb);

            java.util.List<Mat> channels = new java.util.ArrayList<>();
            Core.split(ycrcb, channels);

            // Apply CLAHE on the Luminance channel
            Imgproc.createCLAHE(3.0, new Size(8, 8)).apply(channels.get(0), channels.get(0));

            Core.merge(channels, ycrcb);
            Imgproc.cvtColor(ycrcb, result, Imgproc.COLOR_YCrCb2BGR);
        } else {
            // Grayscale
            Imgproc.createCLAHE(3.0, new Size(8, 8)).apply(input, result);
        }
        return result;
    }

    /**
     * Applies Otsu's thresholding segmentation.
     */
    public Mat otsuThresholdSegmentation(Mat input) {
        if (input.empty()) {
            return input;
        }
        Mat gray = new Mat();
        if (input.channels() == 3) {
            Imgproc.cvtColor(input, gray, Imgproc.COLOR_BGR2GRAY);
        } else {
            gray = input.clone();
        }
        Mat binary = new Mat();
        Imgproc.threshold(gray, binary, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
        return binary;
    }

    public Mat kMeansColorSegmentation(Mat input, int k) {
        if (input.empty()) {
            return input;
        }
    
        // If the image has 4 channels (e.g., BGRA), remove the alpha channel by converting to BGR.
        if (input.channels() == 4) {
            Mat temp = new Mat();
            Imgproc.cvtColor(input, temp, Imgproc.COLOR_BGRA2BGR);
            input = temp;
        }
    
        // Log the detected number of channels for debugging.
        int channels = input.channels();
        System.out.println("Detected channels: " + channels); // Expect 3 for color, 1 for grayscale.
    
        // IMPORTANT: Use reshape(1, total) so that each row becomes a pixel vector of length = (original.channels())
        Mat samples = input.reshape(1, (int) input.total());
        samples.convertTo(samples, CvType.CV_32F);
    
        Mat labels = new Mat();
        Mat centers = new Mat();
        TermCriteria criteria = new TermCriteria(TermCriteria.EPS + TermCriteria.MAX_ITER, 100, 0.2);
    
        // Run k-means clustering on the pixel data.
        Core.kmeans(samples, k, labels, criteria, 10, Core.KMEANS_RANDOM_CENTERS, centers);
    
        // Create an output image of the same size and type as the original input.
        Mat result = new Mat(input.size(), input.type());
    
        // For each pixel (each row in samples), retrieve its cluster index and use the corresponding center.
        // Since we used reshape(1, total), each row in samples is of length = input.channels()
        for (int i = 0; i < samples.rows(); i++) {
            int clusterIdx = (int) labels.get(i, 0)[0];
            // Centers should have number of columns equal to input.channels() (e.g., 3 for a color image).
            double[] center = centers.get(clusterIdx, 0);
            result.put(i / input.cols(), i % input.cols(), center);
        }
    
        return result;
    }
    


    /**
     * Applies Watershed segmentation. 
     */
    public Mat applyWatershedSegmentation(Mat input) {
        if (input.empty()) {
            return input;
        }

        Mat sourceColor = new Mat();
        if (input.channels() == 1) {
            // convert to BGR
            Imgproc.cvtColor(input, sourceColor, Imgproc.COLOR_GRAY2BGR);
        } else {
            sourceColor = input.clone();
        }

        // Convert to gray
        Mat gray = new Mat();
        Imgproc.cvtColor(sourceColor, gray, Imgproc.COLOR_BGR2GRAY);
        // median blur
        Imgproc.medianBlur(gray, gray, 5);

        // threshold using Otsu
        Mat binary = new Mat();
        Imgproc.threshold(gray, binary, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);

        // morphological opening
        Mat kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, new Size(3, 3));
        Mat opening = new Mat();
        Imgproc.morphologyEx(binary, opening, Imgproc.MORPH_OPEN, kernel, new Point(-1, -1), 2);

        // sure background
        Mat sureBg = new Mat();
        Imgproc.dilate(opening, sureBg, kernel, new Point(-1, -1), 3);

        // distance transform
        Mat distTransform = new Mat();
        Imgproc.distanceTransform(opening, distTransform, Imgproc.DIST_L2, 5);
        Core.normalize(distTransform, distTransform, 0, 1.0, Core.NORM_MINMAX);

        // sure foreground
        Mat sureFg = new Mat();
        Imgproc.threshold(distTransform, sureFg, 0.5, 1.0, Imgproc.THRESH_BINARY);

        sureFg.convertTo(sureFg, CvType.CV_8U);

        // unknown region
        Mat unknown = new Mat();
        Core.subtract(sureBg, sureFg, unknown);

        // label markers
        Mat markers = new Mat();
        Imgproc.connectedComponents(sureFg, markers);
        Core.add(markers, Scalar.all(1), markers);

        for (int i = 0; i < unknown.rows(); i++) {
            for (int j = 0; j < unknown.cols(); j++) {
                if (unknown.get(i, j)[0] == 255) {
                    markers.put(i, j, 0);
                }
            }
        }

        // watershed
        Imgproc.watershed(sourceColor, markers);

        // mark boundaries
        for (int i = 0; i < markers.rows(); i++) {
            for (int j = 0; j < markers.cols(); j++) {
                if ((int) markers.get(i, j)[0] == -1) {
                    sourceColor.put(i, j, new double[]{0, 0, 255}); // red boundary
                }
            }
        }

        return sourceColor;
    }

    /**
     * Canny Edge Detection
     */
    public Mat cannyEdgeDetection(Mat input, double threshold1, double threshold2) {
        if (input.empty()) {
            return input;
        }
        Mat gray = new Mat();
        if (input.channels() == 3) {
            Imgproc.cvtColor(input, gray, Imgproc.COLOR_BGR2GRAY);
        } else {
            gray = input.clone();
        }
        Mat edges = new Mat();
        Imgproc.Canny(gray, edges, threshold1, threshold2, 3, false);
        return edges;
    }
}
