import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchButton } from './switch-button';

describe('SwitchButton', () => {
  let component: SwitchButton;
  let fixture: ComponentFixture<SwitchButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchButton],

    }).compileComponents();

    fixture = TestBed.createComponent(SwitchButton);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have false as default value', () => {
    expect(component.value).toBe(false);
  });

  it('should toggle value and emit when not disabled', () => {
    const emitSpy = jest.spyOn(component.valueChange, 'emit');

    component.disabled = false;
    component.value = false;

    component.onToggle();

    expect(component.value).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('should not toggle or emit when disabled', () => {
    const emitSpy = jest.spyOn(component.valueChange, 'emit');

    component.disabled = true;
    component.value = false;

    component.onToggle();

    expect(component.value).toBe(false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should respect value set via @Input', () => {
    component.value = true;

    fixture.detectChanges();

    expect(component.value).toBe(true);
  });
});
