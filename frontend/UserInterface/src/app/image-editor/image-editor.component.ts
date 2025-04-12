// src/app/image-editor/image-editor.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css']
})
export class ImageEditorComponent {
  originalImage: string | null = null;  // The first uploaded image (Data URL)
  workingImage: string | null = null;   // The image we modify with filters
  kValue: number = 2;                   // For K-Means segmentation (default value)

  constructor(private http: HttpClient) {}

  /**
   * Triggered when the user selects a file.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    this.readFileAsDataURL(file);
  }

  /**
   * Reads the selected file as a data URL.
   * Sets the original and working images.
   */
  private readFileAsDataURL(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.originalImage = dataUrl;
      // The working copy starts as the same image.
      this.workingImage = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Resets the working image back to the original image.
   */
  resetWorkingImage(): void {
    this.workingImage = this.originalImage;
  }

  /**
   * Applies a filter to the current working image.
   * For "kmeans", the payload includes the additional k-value.
   * @param filter - One of: 'grayscale', 'noise', or 'kmeans'
   */
  applyFilter(filter: 'grayscale' | 'noise' | 'kmeans'): void {
    if (!this.workingImage) {
      console.warn('No image loaded!');
      return;
    }

    // Extract raw base64 (remove "data:image/...;base64," prefix)
    const rawBase64 = this.workingImage.split(',')[1];
    let endpoint: string;

    switch (filter) {
      case 'grayscale':
        endpoint = 'http://localhost:8080/api/process/grayscale';
        break;
      case 'noise':
        endpoint = 'http://localhost:8080/api/process/noise';
        break;
      case 'kmeans':
        endpoint = 'http://localhost:8080/api/process/kmeans';
        break;
      default:
        console.error('Unknown filter:', filter);
        return;
    }

    // Build the payload. For kmeans, include kValue.
    const payload = filter === 'kmeans'
      ? { base64Image: rawBase64, k: this.kValue }
      : { base64Image: rawBase64 };

    this.http.post(endpoint, payload, { responseType: 'text' })
      .subscribe({
        next: (processedBase64: string) => {
          // Update the working image (assume output is PNG; adjust if needed)
          this.workingImage = 'data:image/png;base64,' + processedBase64;
        },
        error: err => console.error(`Error applying ${filter}:`, err)
      });
  }
}
