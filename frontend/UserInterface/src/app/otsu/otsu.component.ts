import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DownloadComponent }    from '../download/download.component';


@Component({
  selector: 'app-otsu',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DownloadComponent],
  templateUrl: './otsu.component.html',
  styleUrls: ['./otsu.component.css']
})
export class OtsuComponent {
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
      this.selectedBase64 = dataUrl.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  processOtsu(): void {
    if (!this.selectedBase64) {
      console.warn('No image chosen!');
      return;
    }

    const payload = { base64Image: this.selectedBase64 };
    this.http
      .post('http://localhost:8080/api/process/otsu', payload, { responseType: 'text' })
      .subscribe({
        next: (base64Result: string) => {
          this.processedImage = 'data:image/png;base64,' + base64Result;
        },
        error: err => console.error('Error in Otsu call:', err)
      });
  }
}
