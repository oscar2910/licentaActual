import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-otsu',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './otsu.component.html',
  styleUrls: ['./otsu.component.css']
})
export class OtsuComponent {
  // raw Base64 (no data: prefix)
  selectedBase64: string | null = null;

  // final “data:” URL for display
  processedImage: string | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // strip off the "data:image/…;base64," prefix
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
