import { Routes } from '@angular/router';
import { GrayscaleComponent } from './grayscale/grayscale.component';
import { NoiseComponent } from './noise/noise.component';
import { ImageEditorComponent } from './image-editor/image-editor.component';
import { KmeansComponent } from './kmeans/kmeans.component';
import { OtsuComponent} from './otsu/otsu.component';
import { CannyComponent } from './canny/canny.component';
import { WatershedComponent} from './watershed/watershed.component';
import { HistogramComponent} from './histogram/histogram.component';
import { MeasureDistanceComponent } from './measure-distance/measure-distance.component';
// you can import other components here as well

export const appRoutes: Routes = [
  { path: 'grayscale', component: GrayscaleComponent },
  { path: 'noise', component: NoiseComponent },
  {path: 'histogram', component: HistogramComponent},
  { path: 'kmeans', component: KmeansComponent },
  { path: 'otsu', component: OtsuComponent },
  {path: 'canny', component: CannyComponent},
  { path: 'watershed', component: WatershedComponent },
  { path: 'measure', component: MeasureDistanceComponent },
  { path: 'editor', component: ImageEditorComponent },
  { path: '**', redirectTo: '' }
];
