import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemImageDisplayComponent } from './item-image-display.component';

describe('ItemImageDisplayComponent', () => {
  let component: ItemImageDisplayComponent;
  let fixture: ComponentFixture<ItemImageDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemImageDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemImageDisplayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
