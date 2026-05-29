import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GifPickerComponent } from './gif-picker.component';

describe('GifPickerComponent', () => {
  let component: GifPickerComponent;
  let fixture: ComponentFixture<GifPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GifPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GifPickerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
