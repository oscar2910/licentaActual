package opencv.gradle.project.dto;

public class ImageRequest {
    private String base64Image;
    private Integer k;          // for K-means
    private Double threshold1;  // for Canny
    private Double threshold2;  // for Canny

    // getters and setters

    public String getBase64Image() {
        return base64Image;
    }

    public void setBase64Image(String base64Image) {
        this.base64Image = base64Image;
    }

    public Integer getK() {
        return k;
    }

    public void setK(Integer k) {
        this.k = k;
    }

    public Double getThreshold1() {
        return threshold1;
    }

    public void setThreshold1(Double threshold1) {
        this.threshold1 = threshold1;
    }

    public Double getThreshold2() {
        return threshold2;
    }

    public void setThreshold2(Double threshold2) {
        this.threshold2 = threshold2;
    }
}
