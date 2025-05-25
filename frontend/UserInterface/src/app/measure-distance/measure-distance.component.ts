import {
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface ClickPoint {
  /** displayed coords for drawing */
  dx: number;
  dy: number;
  /** natural‐image coords for server */
  x: number;
  y: number;
}

interface MeasureRequest {
  base64Image: string;
  points: { x: number; y: number }[];
}

@Component({
  selector: 'app-measure-distance',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './measure-distance.component.html',
  styleUrls: ['./measure-distance.component.css']
})
export class MeasureDistanceComponent {
  selectedImage: string | null = null;
  rawBase64: string | null = null;
  points: ClickPoint[] = [];
  distance: number | null = null;

  // NOTE: static:false so these refs resolve after *ngIf
  @ViewChild('overlayCanvas', { static: false })
  private overlayCanvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('imageEl', { static: false })
  private imageEl!: ElementRef<HTMLImageElement>;

  private ctx!: CanvasRenderingContext2D;

  constructor(private http: HttpClient) {}

  /** User picks a file → read as Data-URL */
  onFileSelected(ev: Event) {
    const inp = ev.target as HTMLInputElement;
    if (!inp.files?.length) return;
    const file = inp.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImage = reader.result as string;
      this.rawBase64 = this.selectedImage.split(',')[1];
      this.points = [];
      this.distance = null;
      // canvas will be sized in onImageLoad()
    };
    reader.readAsDataURL(file);
  }

  /** When the <img> emits load, size & init the canvas context */
  onImageLoad() {
    const img = this.imageEl.nativeElement;
    const canvas = this.overlayCanvas.nativeElement;

    // match CSS-rendered size
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;

    // get 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.clearOverlay();
  }

  /** Register a click, compute both displayed & natural coords, redraw */
  onImageClick(ev: MouseEvent) {
    if (!this.selectedImage) return;

    // always use imageEl's bounding rect
    const img = this.imageEl.nativeElement;
    const rect = img.getBoundingClientRect();

    // displayed coords
    const dx = ev.clientX - rect.left;
    const dy = ev.clientY - rect.top;

    // scale to natural resolution
    const scaleX = img.naturalWidth  / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = Math.round(dx * scaleX);
    const y = Math.round(dy * scaleY);

    // keep only last two
    this.points.push({ dx, dy, x, y });
    if (this.points.length > 2) {
      this.points.shift();
      this.distance = null;
    }

    this.redrawOverlay();
  }

  /** Clear markers + line */
  clearMarkers() {
    this.points = [];
    this.distance = null;
    this.clearOverlay();
  }

  /** Fire off to back-end if desired */
  computeDistance() {
    if (!this.rawBase64 || this.points.length !== 2) return;

    const payload: MeasureRequest = {
      base64Image: this.rawBase64!,
      points: this.points.map(p => ({ x: p.x, y: p.y }))
    };

    this.http
      .post('http://localhost:8080/api/process/measure/distance', payload, {
        responseType: 'text'
      })
      .subscribe({
        next: distStr => (this.distance = parseFloat(distStr)),
        error: err => console.error('Distance error', err)
      });
  }

  /** Helper to clear the canvas */
  private clearOverlay() {
    const c = this.overlayCanvas.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
  }

  /** Draw red endpoints + yellow line */
  private redrawOverlay() {
    this.clearOverlay();
    this.ctx.fillStyle   = 'red';
    this.ctx.strokeStyle = 'yellow';
    this.ctx.lineWidth   = 2;

    // draw circles
    this.points.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.dx, p.dy, 5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // draw line if two points
    if (this.points.length === 2) {
      const [p1, p2] = this.points;
      this.ctx.beginPath();
      this.ctx.moveTo(p1.dx, p1.dy);
      this.ctx.lineTo(p2.dx, p2.dy);
      this.ctx.stroke();
    }
  }
}
