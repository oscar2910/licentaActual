import { Component }              from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormsModule }            from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DownloadComponent }    from '../download/download.component';

@Component({
  selector: 'app-canny',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DownloadComponent],
  templateUrl: './canny.component.html',
  styleUrls:  ['./canny.component.css']
})
export class CannyComponent {
  selectedBase64: string | null = null;
  processedImage: string | null = null;
  threshold1: number = 50;
  threshold2: number = 100;

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

  applyCanny() {
    if (!this.selectedBase64) return;

    const payload = {
      base64Image: this.selectedBase64,
      threshold1:  this.threshold1,
      threshold2:  this.threshold2
    };

    this.http.post(
      'http://localhost:8080/api/process/canny',
      payload,
      { responseType: 'text' }
    ).subscribe({
      next: base64 => this.processedImage = `data:image/png;base64,${base64}`,
      error:   err    => console.error('Canny error', err)
    });
  }
}
