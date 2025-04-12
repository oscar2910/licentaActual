import { Routes } from '@angular/router';
import { GrayscaleComponent } from './grayscale/grayscale.component';
import { NoiseComponent } from './noise/noise.component';
import { ImageEditorComponent } from './image-editor/image-editor.component';
import { KmeansComponent } from './kmeans/kmeans.component';
// you can import other components here as well

export const appRoutes: Routes = [
  { path: 'grayscale', component: GrayscaleComponent },
  { path: 'noise', component: NoiseComponent },
  { path: 'editor', component: ImageEditorComponent },
  { path: 'kmeans', component: KmeansComponent },
  { path: '**', redirectTo: '' }
];
