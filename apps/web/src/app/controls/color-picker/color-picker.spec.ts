import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorPicker } from './color-picker';

describe('ColorPicker', () => {
  let component: ColorPicker;
  let fixture: ComponentFixture<ColorPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPicker],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorPicker);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize canvas context and draw palette in ngAfterViewInit', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;

    const gradientMock = { addColorStop: jest.fn() };
    const ctxMock = {
      createLinearGradient: jest.fn(() => gradientMock),
      fillRect: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    const getContextSpy = jest
      .spyOn(canvas, 'getContext')
      .mockReturnValue(ctxMock);

    // fake ViewChild
    (component as any).colorCanvas = { nativeElement: canvas };

    component.ngAfterViewInit();

    expect(getContextSpy).toHaveBeenCalledWith('2d');
    expect(ctxMock.createLinearGradient).toHaveBeenCalled();
    expect(ctxMock.fillRect).toHaveBeenCalled();
  });

  it('should sync RGB and hex when @Input color changes via ngOnChanges without emitting', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    component.color = '#123456';

    component.ngOnChanges({
      color: {
        previousValue: '#ff0000',
        currentValue: '#123456',
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.red).toBe(0x12);
    expect(component.green).toBe(0x34);
    expect(component.blue).toBe(0x56);
    expect(component.hex).toBe('#123456');
    expect(component.color).toBe('#123456');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should pick color from canvas and update RGB via pickColorFromEvent', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;

    const ctxMock = {
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray([10, 20, 30, 255]),
      })),
    } as unknown as CanvasRenderingContext2D;

    (component as any).ctx = ctxMock;
    jest
      .spyOn(canvas, 'getBoundingClientRect')
      .mockReturnValue({ left: 0, top: 0, width: 10, height: 10 } as any);
    (component as any).colorCanvas = { nativeElement: canvas };

    const evt = new MouseEvent('mousedown', {
      clientX: 5,
      clientY: 5,
    });

    (component as any).pickColorFromEvent(evt);

    expect(ctxMock.getImageData).toHaveBeenCalled();
    expect(component.red).toBe(10);
    expect(component.green).toBe(20);
    expect(component.blue).toBe(30);
  });

  it('should start and stop dragging on canvas mouse events', () => {
    const pickSpy = jest
      .spyOn<any, any>(component as any, 'pickColorFromEvent')
      .mockImplementation(() => {});

    expect((component as any).isDragging).toBe(false);

    const mouseDown = new MouseEvent('mousedown');
    component.onCanvasMouseDown(mouseDown);
    expect((component as any).isDragging).toBe(true);
    expect(pickSpy).toHaveBeenCalledWith(mouseDown);

    const mouseMove = new MouseEvent('mousemove');
    component.onCanvasMouseMove(mouseMove);
    expect(pickSpy).toHaveBeenLastCalledWith(mouseMove);

    component.onCanvasMouseUp();
    expect((component as any).isDragging).toBe(false);

    component.onCanvasMouseDown(mouseDown);
    expect((component as any).isDragging).toBe(true);
    component.onCanvasMouseLeave();
    expect((component as any).isDragging).toBe(false);
  });

  // --- RGB Inputs ---
  it('should update red channel from RGB input, clamp value and emit hex color', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    component.red = 0;
    component.green = 0;
    component.blue = 0;

    const event = {
      target: { value: '300' },
    } as unknown as Event;

    component.onRgbInput('red', event);

    expect(component.red).toBe(255);
    expect(component.green).toBe(0);
    expect(component.blue).toBe(0);
    expect(component.hex).toBe('#ff0000');
    expect(component.color).toBe('#ff0000');
    expect(emitSpy).toHaveBeenCalledWith('#ff0000');
  });

  it('should update green and blue from RGB input and emit combined hex', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    component.red = 10;
    component.green = 20;
    component.blue = 30;

    const greenEvent = {
      target: { value: '100' },
    } as unknown as Event;
    const blueEvent = {
      target: { value: '200' },
    } as unknown as Event;

    component.onRgbInput('green', greenEvent);
    component.onRgbInput('blue', blueEvent);

    expect(component.red).toBe(10);
    expect(component.green).toBe(100);
    expect(component.blue).toBe(200);
    expect(component.hex).toBe('#0a64c8');
    expect(component.color).toBe('#0a64c8');
    expect(emitSpy).toHaveBeenLastCalledWith('#0a64c8');
  });

  it('should handle NaN and negative RGB input as 0 and emit', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    const nanEvent = {
      target: { value: 'abc' },
    } as unknown as Event;

    component.onRgbInput('blue', nanEvent);
    expect(component.blue).toBe(0);

    const negativeEvent = {
      target: { value: '-10' },
    } as unknown as Event;

    component.onRgbInput('green', negativeEvent);
    expect(component.green).toBe(0);

    expect(emitSpy).toHaveBeenCalledTimes(2);
  });

  it('should update RGB and hex on valid hex input and emit', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    const event = {
      target: { value: '#00ff7f' },
    } as unknown as Event;

    component.onHexInput(event);

    expect(component.red).toBe(0);
    expect(component.green).toBe(255);
    expect(component.blue).toBe(127);
    expect(component.hex).toBe('#00ff7f');
    expect(component.color).toBe('#00ff7f');
    expect(emitSpy).toHaveBeenCalledWith('#00ff7f');
  });

  it('should expand short hex (#rgb) to #rrggbb and emit', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    const event = {
      target: { value: '#f0a' },
    } as unknown as Event;

    component.onHexInput(event);

    expect(component.hex).toBe('#ff00aa');
    expect(component.red).toBe(0xff);
    expect(component.green).toBe(0x00);
    expect(component.blue).toBe(0xaa);
    expect(component.color).toBe('#ff00aa');
    expect(emitSpy).toHaveBeenCalledWith('#ff00aa');
  });

  it('should set hex only and not emit on invalid hex input', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    component.red = 10;
    component.green = 20;
    component.blue = 30;
    component.hex = '#0a141e';
    component.color = '#0a141e';

    const event = {
      target: { value: 'zzzzzz' },
    } as unknown as Event;

    component.onHexInput(event);

    expect(component.red).toBe(10);
    expect(component.green).toBe(20);
    expect(component.blue).toBe(30);
    expect(component.hex).toBe('zzzzzz');
    expect(component.color).toBe('#0a141e');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('rgbToHex and hexToRgb should convert consistently', () => {
    const hex = (component as any).rgbToHex(17, 34, 51);
    expect(hex).toBe('#112233');

    const rgb = (component as any).hexToRgb('#112233');
    expect(rgb).toEqual({ r: 17, g: 34, b: 51 });
  });
});
