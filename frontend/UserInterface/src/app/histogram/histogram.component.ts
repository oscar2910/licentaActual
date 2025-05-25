import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DownloadComponent }    from '../download/download.component';

@Component({
  selector: 'app-histogram',
  standalone: true,
  imports: [ CommonModule, HttpClientModule, FormsModule, DownloadComponent ],
  templateUrl: './histogram.component.html',
  styleUrls: [ './histogram.component.css' ]
})
export class HistogramComponent {
  selectedBase64: string | null = null;
  processedImage: string | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(',') + 1;
      this.selectedBase64 = dataUrl.substring(comma);
    };
    reader.readAsDataURL(file);
  }

  processHistogram(): void {
    if (!this.selectedBase64) {
      console.warn('No image selected');
      return;
    }

    const payload = { base64Image: this.selectedBase64 };
    this.http
      .post('http://localhost:8080/api/process/histogram', payload, { responseType: 'text' })
      .subscribe({
        next: (b64: string) => {
          this.processedImage = 'data:image/png;base64,' + b64;
        },
        error: err => console.error('Histogram error', err)
      });
    }
}
