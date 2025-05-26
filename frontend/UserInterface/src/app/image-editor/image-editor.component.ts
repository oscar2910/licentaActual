import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import {
  HttpClient,
  HttpClientModule
} from '@angular/common/http';
import { FormsModule }     from '@angular/forms';
import { DownloadComponent }    from '../download/download.component';

interface ClickPoint {
  dx: number; 
  dy: number;
  x: number;  
  y: number;
}

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [ CommonModule, HttpClientModule, FormsModule, DownloadComponent ],
  templateUrl: './image-editor.component.html',
  styleUrls:  ['./image-editor.component.css']
})
export class ImageEditorComponent implements AfterViewInit {
  originalImage:    string | null = null;
  workingImage:     string | null = null;
  kValue:           number = 2;

  measureMode:      boolean = false;
  points:           ClickPoint[] = [];
  measuredDistance: number | null = null;

  @ViewChild('imageEl',      { static: false })
  imageEl!: ElementRef<HTMLImageElement>;
  @ViewChild('overlayCanvas',{ static: false })
  overlayCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {

  }

  onFileSelected(ev: Event): void {
    const inp = ev.target as HTMLInputElement;
    if (!inp.files?.length) return;
    const file = inp.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.originalImage    = reader.result as string;
      this.workingImage     = this.originalImage;
      this.measureMode      = false;
      this.points           = [];
      this.measuredDistance = null;
    };
    reader.readAsDataURL(file);
  }


  onImageLoad(): void {
    const img    = this.imageEl.nativeElement;
    const canvas = this.overlayCanvas.nativeElement;
    canvas.width  = img.clientWidth;
    canvas.height = img.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.clearOverlay();
  }

  onImageClick(ev: MouseEvent): void {
    if (!this.workingImage || !this.measureMode) return;

    const img  = this.imageEl.nativeElement;
    const rect = img.getBoundingClientRect();
    const dx   = ev.clientX - rect.left;
    const dy   = ev.clientY - rect.top;

    const scaleX = img.naturalWidth  / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = Math.round(dx * scaleX);
    const y = Math.round(dy * scaleY);

    this.points.push({ dx, dy, x, y });
    if (this.points.length > 2) {
      this.points.shift();
      this.measuredDistance = null;
    }

    this.redrawOverlay();
  }

  clearMarkers(): void {
    this.points = [];
    this.measuredDistance = null;
    this.clearOverlay();
  }

  computeDistance(): void {
    if (!this.workingImage || this.points.length !== 2) return;
    const raw = this.workingImage.split(',')[1];
    this.http.post(
      'http://localhost:8080/api/process/measure/distance',
      { base64Image: raw, points: this.points.map(p => ({ x: p.x, y: p.y })) },
      { responseType: 'text' }
    ).subscribe({
      next: distStr => {
        this.measuredDistance = parseFloat(distStr);
        this.measureMode      = false;
      },
      error: _ => {
        this.measureMode = false;
      }
    });
  }

  applyFilter(filter:
    'grayscale'|'noise'|'histogram'|'kmeans'|
    'otsu'     |'canny'|'watershed'|'measure-distance'
  ): void {
    if (!this.workingImage) return;

    if (filter === 'measure-distance') {
      this.measureMode      = true;
      this.points           = [];
      this.measuredDistance = null;
      this.clearOverlay();
      return;
    }

    const rawBase64 = this.workingImage.split(',')[1];
    let endpoint: string;
    switch (filter) {
      case 'grayscale': endpoint = 'http://localhost:8080/api/process/grayscale'; break;
      case 'noise':     endpoint = 'http://localhost:8080/api/process/noise';     break;
      case 'histogram': endpoint = 'http://localhost:8080/api/process/histogram'; break;
      case 'kmeans':    endpoint = 'http://localhost:8080/api/process/kmeans';    break;
      case 'otsu':      endpoint = 'http://localhost:8080/api/process/otsu';      break;
      case 'canny':     endpoint = 'http://localhost:8080/api/process/canny';     break;
      case 'watershed': endpoint = 'http://localhost:8080/api/process/watershed'; break;
      default: return;
    }

    const payload: any = { base64Image: rawBase64 };
    if (filter === 'kmeans') payload.k = this.kValue;

    this.http.post(endpoint, payload, { responseType:'text' })
      .subscribe({
        next: resp => {
          this.workingImage = 'data:image/png;base64,' + resp;
          this.clearOverlay();
        },
        error: err => console.error(`Error:`, err)
      });
  }

  resetWorkingImage(): void {
    this.workingImage     = this.originalImage;
    this.measureMode      = false;
    this.points           = [];
    this.measuredDistance = null;
    this.clearOverlay();
  }

  private clearOverlay(): void {
    const c = this.overlayCanvas.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
  }

  private redrawOverlay(): void {
    this.clearOverlay();
    this.ctx.fillStyle = 'red';
    this.points.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.dx, p.dy, 5, 0, Math.PI * 2);
      this.ctx.fill();
    });
    if (this.points.length === 2) {
      const [a,b] = this.points;
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth   = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(a.dx, a.dy);
      this.ctx.lineTo(b.dx, b.dy);
      this.ctx.stroke();
    }
  }
}
