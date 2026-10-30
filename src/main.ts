import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { LoggerService } from './app/services/logger/logger.service';
import { openInAppBeforeStart } from './app/utils/open-in-app';

// Android browser (link opened from Discord, Snapchat...): hand the page to the app first.
openInAppBeforeStart()
  .then(() => bootstrapApplication(App, appConfig))
  // Dependency injection isn't available when the app fails to start: the logger is created by hand.
  .catch((err) => new LoggerService().error('App bootstrap failed:', err));
