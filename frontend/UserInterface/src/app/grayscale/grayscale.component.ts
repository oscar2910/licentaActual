import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DownloadComponent }    from '../download/download.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-grayscale',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DownloadComponent, FormsModule],
  templateUrl: './grayscale.component.html',
  styleUrls: ['./grayscale.component.css']
})
export class GrayscaleComponent {
  selectedBase64: string | null = null; 
  processedImage: string | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    this.readFileAsBase64(file);
  }


  readFileAsBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Index = dataUrl.indexOf(',') + 1;
      this.selectedBase64 = dataUrl.substring(base64Index);
    };
    reader.readAsDataURL(file);
  }

  processGrayscale(): void {
    if (!this.selectedBase64) {
      console.warn('No image selected!');
      return;
    }
    const payload = { base64Image: this.selectedBase64 };
    this.http.post('http://localhost:8080/api/process/grayscale', payload, { responseType: 'text' })
      .subscribe({
        next: (base64Result: string) => {
          this.processedImage = 'data:image/png;base64,' + base64Result;
        },
        error: (err) => console.error('Error processing grayscale:', err)
      });
  }

   downloadImage(): void {
    if (!this.processedImage) {
      return;
    }
    const link = document.createElement('a');
    link.href = this.processedImage;
    link.download = `grayscale.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
