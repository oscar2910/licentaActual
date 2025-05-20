import { Routes } from '@angular/router';
import { GrayscaleComponent } from './grayscale/grayscale.component';
import { NoiseComponent } from './noise/noise.component';
import { ImageEditorComponent } from './image-editor/image-editor.component';
import { KmeansComponent } from './kmeans/kmeans.component';
import { OtsuComponent} from './otsu/otsu.component';
import { CannyComponent } from './canny/canny.component';
import { WatershedComponent} from './watershed/watershed.component';
// you can import other components here as well

export const appRoutes: Routes = [
  { path: 'grayscale', component: GrayscaleComponent },
  { path: 'noise', component: NoiseComponent },
  { path: 'kmeans', component: KmeansComponent },
  { path: 'otsu', component: OtsuComponent },
  {path: 'canny', component: CannyComponent},
  { path: 'watershed', component: WatershedComponent },
  { path: 'editor', component: ImageEditorComponent },
  { path: '**', redirectTo: '' }
];
