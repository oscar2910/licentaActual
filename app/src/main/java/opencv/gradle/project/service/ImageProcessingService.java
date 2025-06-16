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


    public Mat fromBase64(String base64) {
        byte[] decoded = Base64.getDecoder().decode(base64);
        Mat matOfByte = new MatOfByte(decoded);
        Mat mat = Imgcodecs.imdecode(matOfByte, Imgcodecs.IMREAD_COLOR);
        return mat;
    }


    public String toBase64(Mat mat) {
        MatOfByte buffer = new MatOfByte();
        Imgcodecs.imencode(".png", mat, buffer);
        byte[] encoded = Base64.getEncoder().encode(buffer.toArray());
        return new String(encoded);
    }


    public Mat grayScaleImage(Mat input) {
        if (input.empty()) {
            return input;
        }
        Mat gray = new Mat();
        Imgproc.cvtColor(input, gray, Imgproc.COLOR_BGR2GRAY);
        return gray;
    }


    public Mat noiseReductionImage(Mat input) {
        if (input.empty()) {
            return input;
        }
        Mat denoised = new Mat();
        Imgproc.medianBlur(input, denoised, 3);
        return denoised;
    }


    public Mat histogramEqualizationImage(Mat input) {
        if (input.empty()) {
            return input;
        }

        Mat result = new Mat();
        if (input.channels() == 3) {
            Mat ycrcb = new Mat();
            Imgproc.cvtColor(input, ycrcb, Imgproc.COLOR_BGR2YCrCb);
            java.util.List<Mat> channels = new java.util.ArrayList<>();
            Core.split(ycrcb, channels);
            Imgproc.createCLAHE(3.0, new Size(8, 8)).apply(channels.get(0), channels.get(0));
            Core.merge(channels, ycrcb);
            Imgproc.cvtColor(ycrcb, result, Imgproc.COLOR_YCrCb2BGR);
        } else {
            Imgproc.createCLAHE(3.0, new Size(8, 8)).apply(input, result);
        }
        return result;
    }

 
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
        if (input.empty()) return input;
    
        if (input.channels() == 4) {
            Mat tmp = new Mat();
            Imgproc.cvtColor(input, tmp, Imgproc.COLOR_BGRA2BGR);
            input = tmp;
        }
    
        int numPixels = (int) input.total();
        Mat samples   = input.reshape(1, numPixels);
        Mat samples32f = new Mat();
        samples.convertTo(samples32f, CvType.CV_32F);
    
        if (k <= 0) k = 2;
        Mat labels  = new Mat();
        Mat centers = new Mat();
        Core.kmeans(
          samples32f,
          k,
          labels,
          new TermCriteria(TermCriteria.EPS+TermCriteria.MAX_ITER, 100, 0.2),
          10,
          Core.KMEANS_RANDOM_CENTERS,
          centers
        );
    
        Mat result = new Mat(input.size(), input.type());
        int width = input.cols();
        int featureCount = centers.cols();
    
        for (int i = 0; i < numPixels; i++) {
            int clusterIdx = (int) labels.get(i, 0)[0];
            double[] centerVec = new double[featureCount];
            for (int j = 0; j < featureCount; j++) {
                centerVec[j] = centers.get(clusterIdx, j)[0];
            }
            int y = i / width, x = i % width;
            result.put(y, x, centerVec);
        }
        return result;
    }
    

    public Mat applyWatershedSegmentation(Mat input) {
        if (input.empty()) {
            return input;
        }

        Mat sourceColor = new Mat();
        if (input.channels() == 1) {
            Imgproc.cvtColor(input, sourceColor, Imgproc.COLOR_GRAY2BGR);
        } else {
            sourceColor = input.clone();
        }

        Mat gray = new Mat();
        Imgproc.cvtColor(sourceColor, gray, Imgproc.COLOR_BGR2GRAY);
        Imgproc.medianBlur(gray, gray, 5);

        Mat binary = new Mat();
        Imgproc.threshold(gray, binary, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);

        Mat kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, new Size(3, 3));
        Mat opening = new Mat();
        Imgproc.morphologyEx(binary, opening, Imgproc.MORPH_OPEN, kernel, new Point(-1, -1), 2);

        Mat sureBg = new Mat();
        Imgproc.dilate(opening, sureBg, kernel, new Point(-1, -1), 3);

        Mat distTransform = new Mat();
        Imgproc.distanceTransform(opening, distTransform, Imgproc.DIST_L2, 5);
        Core.normalize(distTransform, distTransform, 0, 1.0, Core.NORM_MINMAX);

        Mat sureFg = new Mat();
        Imgproc.threshold(distTransform, sureFg, 0.5, 1.0, Imgproc.THRESH_BINARY);
        sureFg.convertTo(sureFg, CvType.CV_8U);

        Mat unknown = new Mat();
        Core.subtract(sureBg, sureFg, unknown);

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

        Imgproc.watershed(sourceColor, markers);

        for (int i = 0; i < markers.rows(); i++) {
            for (int j = 0; j < markers.cols(); j++) {
                if ((int) markers.get(i, j)[0] == -1) {
                    sourceColor.put(i, j, new double[]{0, 0, 255});
                }
            }
        }

        return sourceColor;
    }


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
