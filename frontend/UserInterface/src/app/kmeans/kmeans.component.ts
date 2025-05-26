import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DownloadComponent }    from '../download/download.component';

@Component({
  selector: 'app-kmeans',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, DownloadComponent],
  templateUrl: './kmeans.component.html',
  styleUrls: ['./kmeans.component.css']
})
export class KmeansComponent {
  selectedBase64: string | null = null; // holds raw base64 (without the data prefix)
  processedImage: string | null = null;  // holds the processed result (data URL)
  k: number = 2; // default k value

  constructor(private http: HttpClient) {}

  /**
   * Triggered when the user selects an image.
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
   * Reads file using FileReader and extracts the raw base64 string.
   */
  private readFileAsBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Remove the prefix, e.g., "data:image/png;base64,"
      const base64Index = dataUrl.indexOf(',') + 1;
      this.selectedBase64 = dataUrl.substring(base64Index);
    };
    reader.readAsDataURL(file);
  }

  processKmeans(): void {
    if (!this.selectedBase64 || !this.k) {
      console.warn('Please select an image and provide a valid value for K.');
      return;
    }
    const payload = { base64Image: this.selectedBase64, k: this.k };
    this.http.post('http://localhost:8080/api/process/kmeans', payload, { responseType: 'text' })
      .subscribe({
        next: (base64Result: string) => {
          this.processedImage = 'data:image/png;base64,' + base64Result;
        },
        error: (err) => console.error('Error processing K-Means:', err)
      });
  }
}
