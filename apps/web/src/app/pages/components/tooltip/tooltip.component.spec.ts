// tooltip.component.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TooltipComponent } from './tooltip.component';

describe('TooltipComponent', () => {
  let fixture: ComponentFixture<TooltipComponent>;
  let component: TooltipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show/hide on hover in hover mode', () => {
    component.mode = 'hover';

    component.onMouseEnter();
    expect(component.visible()).toBe(true);

    component.onMouseLeave();
    expect(component.visible()).toBe(false);
  });

  it('should toggle visibility on click in click mode', () => {
    component.mode = 'click';

    const event = new MouseEvent('click');
    const stopSpy = jest.spyOn(event, 'stopPropagation');

    component.onClick(event);
    expect(stopSpy).toHaveBeenCalled();
    expect(component.visible()).toBe(true);

    component.onClick(event);
    expect(component.visible()).toBe(false);
  });

  it('should react to mode="all" on hover and click', () => {
    component.mode = 'all';

    component.onMouseEnter();
    expect(component.visible()).toBe(true);

    const event = new MouseEvent('click');
    component.onClick(event);
    expect(component.visible()).toBe(false);
  });
});
