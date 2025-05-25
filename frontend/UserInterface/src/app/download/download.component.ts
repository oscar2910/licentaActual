import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.css']
})
export class DownloadComponent {
  @Input() image: string | null = null;

  download(): void {
    if (!this.image) return;
    const link = document.createElement('a');
    link.href = this.image;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
