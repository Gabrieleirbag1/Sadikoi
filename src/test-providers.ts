import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

// Providers shared by every spec (see "providersFile" in angular.json).
const testProviders: (Provider | EnvironmentProviders)[] = [
  provideHttpClient(),
  provideHttpClientTesting(),
  // Catch-all route so navigations triggered by components don't throw.
  provideRouter([{ path: '**', children: [] }]),
  provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
];

export default testProviders;
