// src/app/noise/noise.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-noise',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './noise.component.html',
  styleUrls: ['./noise.component.css']
})
export class NoiseComponent {
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

  private readFileAsBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Index = dataUrl.indexOf(',') + 1;
      this.selectedBase64 = dataUrl.substring(base64Index);
    };
    reader.readAsDataURL(file);
  }

  processNoise(): void {
    if (!this.selectedBase64) {
      console.warn('No image selected!');
      return;
    }
    const payload = { base64Image: this.selectedBase64 };
    this.http.post('http://localhost:8080/api/process/noise', payload, { responseType: 'text' })
      .subscribe({
        next: (base64Result: string) => {
          this.processedImage = 'data:image/png;base64,' + base64Result;
        },
        error: (err) => console.error('Error processing noise reduction:', err)
      });
  }
}
