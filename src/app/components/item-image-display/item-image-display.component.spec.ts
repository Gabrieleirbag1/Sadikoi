import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemImageDisplayComponent } from './item-image-display.component';

describe('ItemImageDisplayComponent', () => {
  let component: ItemImageDisplayComponent;
  let fixture: ComponentFixture<ItemImageDisplayComponent>;

  const tooltip = () => document.body.querySelector('.item-touch-tooltip');
  const tap = (pointerType: string) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    fixture.nativeElement.querySelector('img').dispatchEvent(event);
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemImageDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemImageDisplayComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemName', 'golden_cup');
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the item name on a touch tap, without opening what the icon sits in', () => {
    const event = tap('touch');
    expect(tooltip()?.textContent).toBe('golden_cup');
    expect(event.defaultPrevented).toBe(true);
  });

  it('hides it on a second tap, and when the icon goes away', () => {
    tap('touch');
    tap('touch');
    expect(tooltip()).toBeNull();

    tap('touch');
    fixture.destroy();
    expect(tooltip()).toBeNull();
  });

  it('leaves mouse clicks alone (the title shows on hover)', () => {
    const event = tap('mouse');
    expect(tooltip()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });
});
