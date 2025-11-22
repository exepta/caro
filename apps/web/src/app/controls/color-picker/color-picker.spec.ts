import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { ColorPicker } from './color-picker';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ColorPicker', () => {
  let component: ColorPicker;
  let canvas: HTMLCanvasElement;
  let ctx: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPicker],
      providers: [
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ColorPicker);
    component = fixture.componentInstance;

    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 50;

    ctx = {
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      fillRect: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray([10, 20, 30, 255]),
      }),
      fillStyle: '' as any,
    };

    (canvas as any).getContext = jest.fn(() => ctx);
    (canvas as any).getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    (component as any).colorCanvas = new ElementRef<HTMLCanvasElement>(canvas);
  });

  it('ngAfterViewInit should get context and draw palette', () => {
    component.ngAfterViewInit();

    expect((canvas as any).getContext).toHaveBeenCalledWith('2d');
    expect(ctx.createLinearGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('ngOnChanges should apply color without emitting event', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    component.color = '#00ff00';

    component.ngOnChanges({
      color: {
        previousValue: '#ff0000',
        currentValue: '#00ff00',
        firstChange: false,
        isFirstChange: () => false,
      } as any,
    });

    expect(component.hex).toBe('#00ff00');
    expect(component.red).toBe(0);
    expect(component.green).toBe(255);
    expect(component.blue).toBe(0);
    expect(emitted.length).toBe(0);
  });

  it('onCanvasMouseDown should start dragging and pick color', () => {
    component.ngAfterViewInit();

    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    const event = { clientX: 10, clientY: 20 } as MouseEvent;

    component.onCanvasMouseDown(event);

    expect((component as any).isDragging).toBe(true);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(component.red).toBe(10);
    expect(component.green).toBe(20);
    expect(component.blue).toBe(30);
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBe(component.color);
  });

  it('onCanvasMouseMove should only pick color while dragging', () => {
    component.ngAfterViewInit();

    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    const event = { clientX: 5, clientY: 5 } as MouseEvent;

    (component as any).isDragging = false;
    component.onCanvasMouseMove(event);
    expect(ctx.getImageData).not.toHaveBeenCalled();

    (component as any).isDragging = true;
    component.onCanvasMouseMove(event);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(emitted.length).toBe(1);
  });

  it('onCanvasMouseUp and onCanvasMouseLeave should stop dragging', () => {
    (component as any).isDragging = true;

    component.onCanvasMouseUp();
    expect((component as any).isDragging).toBe(false);

    (component as any).isDragging = true;
    component.onCanvasMouseLeave();
    expect((component as any).isDragging).toBe(false);
  });

  it('onRgbInput should clamp and set RGB for each channel and emit', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    component.onRgbInput('red', { target: { value: '300' } } as any);
    expect(component.red).toBe(255);

    component.onRgbInput('green', { target: { value: '-5' } } as any);
    expect(component.green).toBe(0);

    component.onRgbInput('blue', { target: { value: '128' } } as any);
    expect(component.blue).toBe(128);

    expect(emitted.length).toBe(3);
    expect(component.hex).toBe(component.color);
  });

  it('onRgbInput should treat NaN as 0', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    component.onRgbInput('red', { target: { value: 'abc' } } as any);
    expect(component.red).toBe(0);
    expect(emitted.length).toBe(1);
  });

  it('onHexInput should apply hex and emit when valid', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    component.onHexInput({ target: { value: '#00ff00' } } as any);

    expect(component.hex).toBe('#00ff00');
    expect(component.red).toBe(0);
    expect(component.green).toBe(255);
    expect(component.blue).toBe(0);
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBe('#00ff00');
  });

  it('applyHex should normalize short hex (#0f0 -> #00ff00) and emit', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    (component as any).applyHex('#0f0', true);

    expect(component.hex).toBe('#00ff00');
    expect(component.red).toBe(0);
    expect(component.green).toBe(255);
    expect(component.blue).toBe(0);
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBe('#00ff00');
  });

  it('applyHex should handle hex without leading # and emit', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    (component as any).applyHex('0000ff', true);

    expect(component.hex).toBe('#0000ff');
    expect(component.red).toBe(0);
    expect(component.green).toBe(0);
    expect(component.blue).toBe(255);
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBe('#0000ff');
  });

  it('applyHex should not emit and keep hex when invalid value is given', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    (component as any).applyHex('zzzzzz', true);

    expect(component.hex).toBe('zzzzzz');
    expect(emitted.length).toBe(0);
  });

  it('rgbToHex and hexToRgb should be consistent', () => {
    const emitted: string[] = [];
    component.colorChange.subscribe((c) => emitted.push(c));

    // setRgb -> updateHexFromRgb -> rgbToHex
    (component as any).setRgb(12, 34, 56, true);
    const hex = component.hex;

    // applyHex -> hexToRgb
    (component as any).applyHex(hex, true);

    expect(component.red).toBe(12);
    expect(component.green).toBe(34);
    expect(component.blue).toBe(56);
    expect(hex).toBe('#0c2238');
    expect(emitted.length).toBeGreaterThanOrEqual(2);
  });
});
