// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './app/shell/shell.component';
import { appRoutes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

bootstrapApplication(ShellComponent, {
  providers: [
    provideRouter(appRoutes),
    importProvidersFrom(HttpClientModule)
  ]
}).catch(err => console.error(err));