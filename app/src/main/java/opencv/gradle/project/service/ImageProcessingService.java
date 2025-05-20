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
    
        // Drop alpha if present
        if (input.channels() == 4) {
            Mat tmp = new Mat();
            Imgproc.cvtColor(input, tmp, Imgproc.COLOR_BGRA2BGR);
            input = tmp;
        }
    
        System.out.println("kMeans: input.channels=" + input.channels());
        
        // Reshape into [totalPixels x channels] matrix
        Mat samples = input.reshape(1, (int) input.total());
        Mat samples32f = new Mat();
        samples.convertTo(samples32f, CvType.CV_32F);
    
        System.out.println(
          "kMeans: samples32f.dims=" + samples32f.dims() +
          ", rows=" + samples32f.rows() +
          ", cols=" + samples32f.cols()
        );
        // Now cols == input.channels()
    
        if (k <= 0) k = 2;
        System.out.println("kMeans: running with K=" + k);
    
        Mat labels = new Mat(), centers = new Mat();
        TermCriteria criteria = new TermCriteria(TermCriteria.EPS+TermCriteria.MAX_ITER, 100, 0.2);
    
        Core.kmeans(samples32f, k, labels, criteria, 10, Core.KMEANS_RANDOM_CENTERS, centers);
    
        Mat result = new Mat(input.size(), input.type());
        int width = input.cols();
        for (int i = 0; i < samples32f.rows(); i++) {
            int idx = (int) labels.get(i, 0)[0];
            double[] center = centers.get(idx, 0);
            result.put(i / width, i % width, center);
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
