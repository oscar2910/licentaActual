import { Component }       from '@angular/core';
import { CommonModule }    from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DownloadComponent }    from '../download/download.component';

@Component({
  selector: 'app-watershed',
  standalone: true,
  imports: [CommonModule, HttpClientModule , DownloadComponent],
  templateUrl: './watershed.component.html',
  styleUrls:  ['./watershed.component.css']
})
export class WatershedComponent {
  selectedBase64: string | null = null;
  processedImage: string | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(evt: Event) {
    const input = (evt.target as HTMLInputElement);
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.selectedBase64 = dataUrl.split(',')[1];
      this.processedImage = null;
    };
    reader.readAsDataURL(file);
  }

  processWatershed() {
    if (!this.selectedBase64) return;
    this.http.post(
      'http://localhost:8080/api/process/watershed',
      { base64Image: this.selectedBase64 },
      { responseType: 'text' }
    ).subscribe({
      next: base64 => this.processedImage = `data:image/png;base64,${base64}`,
      error:   err    => console.error('Watershed error', err)
    });
  }
}
