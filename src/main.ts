import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LoggerService } from './app/services/logger/logger.service';

bootstrapApplication(App, appConfig)
  // Dependency injection isn't available when the app fails to start: the logger is created by hand.
  .catch((err) => new LoggerService().error('App bootstrap failed:', err));
