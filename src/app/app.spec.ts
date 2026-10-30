import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { ConnectivityService } from './services/connectivity/connectivity.service';

let pagesCreated = 0;

@Component({ template: '<p class="test-page">page</p>' })
class TestPage {
  constructor() {
    pagesCreated++;
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the layout', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('replaces the page while the API is unreachable, then recreates it (so it reloads its data)', async () => {
    pagesCreated = 0;
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: '**', component: TestPage }]);
    const fixture = TestBed.createComponent(App);
    const page = () => (fixture.nativeElement as HTMLElement).querySelector('.test-page');
    const errorScreen = () => (fixture.nativeElement as HTMLElement).querySelector('app-connection-error');
    await router.navigateByUrl('/');
    await fixture.whenStable();
    expect(page()).toBeTruthy();

    const connectivity = TestBed.inject(ConnectivityService);
    connectivity.status.set('server');
    await fixture.whenStable();
    expect(page()).toBeNull();
    expect(errorScreen()).toBeTruthy();

    connectivity.status.set('ok');
    await fixture.whenStable();
    expect(errorScreen()).toBeNull();
    expect(page()).toBeTruthy();
    expect(pagesCreated).toBe(2);
  });
});
