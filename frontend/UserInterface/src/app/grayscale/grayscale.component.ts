import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-grayscale',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './grayscale.component.html',
  styleUrls: ['./grayscale.component.css']
})
export class GrayscaleComponent {
  selectedBase64: string | null = null; // Store the uploaded image as raw base64 (without the data URL prefix)
  processedImage: string | null = null;

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
    this.readFileAsBase64(file);
  }

  /**
   * Reads a file and extracts the raw base64 string.
   */
  readFileAsBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // The data URL looks like: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
      // Extract the portion after the comma to get raw base64.
      const base64Index = dataUrl.indexOf(',') + 1;
      this.selectedBase64 = dataUrl.substring(base64Index);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Sends the image to the backend for grayscale processing.
   */
  processGrayscale(): void {
    if (!this.selectedBase64) {
      console.warn('No image selected!');
      return;
    }
    const payload = { base64Image: this.selectedBase64 };
    this.http.post('http://localhost:8080/api/process/grayscale', payload, { responseType: 'text' })
      .subscribe({
        next: (base64Result: string) => {
          // Prepend the data URL prefix (assuming PNG) for display
          this.processedImage = 'data:image/png;base64,' + base64Result;
        },
        error: (err) => console.error('Error processing grayscale:', err)
      });
  }
}
