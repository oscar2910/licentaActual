import { Component } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { HttpClient,
         HttpClientModule } from '@angular/common/http';
import { FormsModule }     from '@angular/forms';

/** Just define Point for clicks */
interface Point { x: number; y: number; }

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [ CommonModule, HttpClientModule, FormsModule ],
  templateUrl: './image-editor.component.html',
  styleUrls:  ['./image-editor.component.css']
})
export class ImageEditorComponent {
  originalImage:   string | null = null;
  workingImage:    string | null = null;
  kValue:          number = 2;

  /** click‐mode state: only collect when true */
  measureMode:     boolean = false;
  points:          Point[] = [];
  measuredDistance: number | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const inp = event.target as HTMLInputElement;
    if (!inp.files?.length) return;
    const file = inp.files[0];
    const rdr  = new FileReader();
    rdr.onload = () => {
      this.originalImage     = rdr.result as string;
      this.workingImage      = this.originalImage;
      this.measureMode       = false;
      this.points            = [];
      this.measuredDistance  = null;
    };
    rdr.readAsDataURL(file);
  }

  onImageClick(ev: MouseEvent) {
    if (!this.workingImage || !this.measureMode) {
      // ignore clicks unless in measure mode
      return;
    }

    const img = ev.target as HTMLImageElement;
    const r   = img.getBoundingClientRect();
    const sx  = img.naturalWidth  / r.width;
    const sy  = img.naturalHeight / r.height;
    const x   = Math.round((ev.clientX - r.left) * sx);
    const y   = Math.round((ev.clientY - r.top ) * sy);

    if (this.points.length < 2) {
      this.points.push({ x, y });
    }

    // as soon as we have two, fire the request
    if (this.points.length === 2) {
      const rawBase64 = this.workingImage.split(',')[1];
      const payload = {
        base64Image: rawBase64,
        points: this.points
      };
      this.http
        .post('http://localhost:8080/api/process/measure/distance',
              payload,
              { responseType: 'text' })
        .subscribe({
          next: resp => {
            this.measuredDistance = parseFloat(resp);
            this.measureMode = false;  // turn off measure mode
          },
          error: err => {
            console.error('Measure error', err);
            this.measureMode = false;
          }
        });
    }
  }

  resetWorkingImage(): void {
    this.workingImage     = this.originalImage;
    this.measureMode      = false;
    this.points           = [];
    this.measuredDistance = null;
  }

  applyFilter(filter:
    'grayscale'|'noise'|'histogram'|'kmeans'|
    'otsu'     |'canny'|'watershed'|'measure-distance'
  ): void {
    if (!this.workingImage) {
      console.warn('No image loaded!');
      return;
    }

    // 1) special case: enter measure mode
    if (filter === 'measure-distance') {
      this.measureMode      = true;
      this.points           = [];
      this.measuredDistance = null;
      return;
    }

    // 2) otherwise, existing logic unchanged
    const rawBase64 = this.workingImage.split(',')[1];
    let endpoint: string;
    switch (filter) {
      case 'grayscale': endpoint = 'http://localhost:8080/api/process/grayscale';      break;
      case 'noise':     endpoint = 'http://localhost:8080/api/process/noise';          break;
      case 'histogram': endpoint = 'http://localhost:8080/api/process/histogram';      break;
      case 'kmeans':    endpoint = 'http://localhost:8080/api/process/kmeans';         break;
      case 'otsu':      endpoint = 'http://localhost:8080/api/process/otsu';           break;
      case 'canny':     endpoint = 'http://localhost:8080/api/process/canny';          break;
      case 'watershed': endpoint = 'http://localhost:8080/api/process/watershed';      break;
      default:
        console.error('Unknown filter:', filter);
        return;
    }

    const payload: any = { base64Image: rawBase64 };
    if (filter === 'kmeans') {
      payload.k = this.kValue;
    }
    this.http
      .post(endpoint, payload, { responseType:'text' })
      .subscribe({
        next: (resp: string) => {
          this.workingImage = 'data:image/png;base64,' + resp;
        },
        error: err => console.error(`Error applying ${filter}:`, err)
      });
  }
}
