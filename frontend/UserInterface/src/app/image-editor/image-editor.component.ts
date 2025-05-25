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

interface ClickPoint {
  /** display coords for drawing on canvas */
  dx: number;
  dy: number;
  /** natural-image coords for server */
  x: number;
  y: number;
}

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [ CommonModule, HttpClientModule, FormsModule ],
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

  @ViewChild('imageEl',{ static:false })
  private imageEl!: ElementRef<HTMLImageElement>;
  @ViewChild('overlayCanvas',{ static:false })
  private overlayCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    // Canvas init happens in onImageLoad()
  }

  /** Handle file selection */
  onFileSelected(ev: Event) {
    const inp = ev.target as HTMLInputElement;
    if (!inp.files?.length) return;
    const file = inp.files[0];
    const rdr  = new FileReader();
    rdr.onload = () => {
      this.originalImage    = rdr.result as string;
      this.workingImage     = this.originalImage;
      this.measureMode      = false;
      this.points           = [];
      this.measuredDistance = null;
      // will size canvas in onImageLoad()
    };
    rdr.readAsDataURL(file);
  }

  /** Called when the working image loads */
  onImageLoad() {
    const img    = this.imageEl.nativeElement;
    const canvas = this.overlayCanvas.nativeElement;
    const rect   = img.getBoundingClientRect();

    // Size and lock the canvas to match the displayed image
    canvas.width  = rect.width;
    canvas.height = rect.height;
    canvas.style.width  = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.clearOverlay();
  }

  /** Click handler on the canvas */
  onCanvasClick(ev: MouseEvent) {
    if (!this.measureMode || !this.workingImage) return;

    // offsetX/Y are exact canvas coords
    const dx = ev.offsetX;
    const dy = ev.offsetY;

    // scale to natural image resolution
    const img = this.imageEl.nativeElement;
    const scaleX = img.naturalWidth  / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const x = Math.round(dx * scaleX);
    const y = Math.round(dy * scaleY);

    this.points.push({ dx, dy, x, y });
    if (this.points.length > 2) {
      this.points.shift();
      this.measuredDistance = null;
    }

    this.redrawOverlay();

    if (this.points.length === 2) {
      const raw = this.workingImage.split(',')[1];
      this.http.post(
        'http://localhost:8080/api/process/measure/distance',
        { base64Image: raw, points: this.points.map(p=>({x:p.x,y:p.y})) },
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
  }

  /** Apply filters or toggle measure mode */
  applyFilter(filter:
    'grayscale'|'noise'|'histogram'|'kmeans'|
    'otsu'     |'canny'|'watershed'|'measure-distance'
  ) {
    if (!this.workingImage) return;

    if (filter === 'measure-distance') {
      this.measureMode      = true;
      this.points           = [];
      this.measuredDistance = null;
      if (this.ctx) this.clearOverlay();
      return;
    }

    const rawBase64 = this.workingImage.split(',')[1];
    let endpoint: string;
    switch (filter) {
      case 'grayscale': endpoint = 'http://localhost:8080/api/process/grayscale';   break;
      case 'noise':     endpoint = 'http://localhost:8080/api/process/noise';       break;
      case 'histogram': endpoint = 'http://localhost:8080/api/process/histogram';   break;
      case 'kmeans':    endpoint = 'http://localhost:8080/api/process/kmeans';      break;
      case 'otsu':      endpoint = 'http://localhost:8080/api/process/otsu';        break;
      case 'canny':     endpoint = 'http://localhost:8080/api/process/canny';       break;
      case 'watershed': endpoint = 'http://localhost:8080/api/process/watershed';   break;
      default: return;
    }

    const payload: any = { base64Image: rawBase64 };
    if (filter === 'kmeans') payload.k = this.kValue;

    this.http.post(endpoint, payload, { responseType:'text' })
      .subscribe({
        next: resp => {
          this.workingImage = 'data:image/png;base64,' + resp;
          if (this.ctx) this.clearOverlay();
        },
        error: err => console.error(err)
      });
  }

  /** Reset to the original image */
  resetWorkingImage() {
    this.workingImage     = this.originalImage;
    this.measureMode      = false;
    this.points           = [];
    this.measuredDistance = null;
    if (this.ctx) this.clearOverlay();
  }

  /** Clear the overlay canvas */
  private clearOverlay() {
    const c = this.overlayCanvas.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
  }

  /** Draw red dots and a yellow connecting line */
  private redrawOverlay() {
    this.clearOverlay();
    // endpoints
    this.ctx.fillStyle = 'red';
    this.points.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.dx, p.dy, 6, 0, Math.PI*2);
      this.ctx.fill();
    });
    // connector
    if (this.points.length === 2) {
      const [a,b] = this.points;
      this.ctx.strokeStyle = 'yellow';
      this.ctx.lineWidth   = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(a.dx, a.dy);
      this.ctx.lineTo(b.dx, b.dy);
      this.ctx.stroke();
    }
  }
}
