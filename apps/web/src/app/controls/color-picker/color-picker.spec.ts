// src/app/pages/components/color-picker/color-picker.spec.ts
import { ElementRef } from '@angular/core';
import { ColorPicker } from './color-picker';

describe('ColorPicker', () => {
  let component: ColorPicker;
  let canvas: HTMLCanvasElement;
  let ctxMock: any;
  let imageData: Uint8ClampedArray;

  function createCanvasAndContext(width = 4, height = 4) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    imageData = new Uint8ClampedArray(width * height * 4);

    ctxMock = {
      fillStyle: '',
      fillRect: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      getImageData: jest.fn((x: number, y: number, w: number, h: number) => {
        // Einzelpixel (für pickColorFromEvent)
        if (w === 1 && h === 1) {
          const idx = (y * width + x) * 4;
          const data = new Uint8ClampedArray(4);
          data[0] = imageData[idx];
          data[1] = imageData[idx + 1];
          data[2] = imageData[idx + 2];
          data[3] = 255;
          return { data };
        }
        // kompletter Canvas (für updateCursorFromCurrentColor)
        return { data: imageData };
      }),
    };

    jest.spyOn(canvas, 'getContext').mockReturnValue(ctxMock as any);
  }

  beforeEach(() => {
    component = new ColorPicker();
    createCanvasAndContext();
    component.colorCanvas = new ElementRef<HTMLCanvasElement>(canvas);
  });

  // ---------- Lifecycle ----------

  it('ngAfterViewInit should initialize ctx, draw palette and apply initial color', () => {
    const applyHexSpy = jest.spyOn<any, any>(component as any, 'applyHex');
    const updateCursorSpy = jest.spyOn<any, any>(
      component as any,
      'updateCursorFromCurrentColor',
    );

    component.ngAfterViewInit();

    expect((component as any).ctx).toBe(ctxMock);
    expect(ctxMock.createLinearGradient).toHaveBeenCalled(); // drawPaletteBase
    expect(applyHexSpy).toHaveBeenCalledWith(component.color, false);
    expect(updateCursorSpy).toHaveBeenCalled();
  });

  it('ngAfterViewInit should return early if ctx is null', () => {
    // getContext liefert null
    (canvas.getContext as jest.Mock).mockReturnValueOnce(null);

    // neuer Picker ohne ctx
    const picker = new ColorPicker();
    picker.colorCanvas = new ElementRef<HTMLCanvasElement>(canvas);

    // sollte einfach nichts werfen
    picker.ngAfterViewInit();
  });

  it('ngOnChanges should react to external color changes (not firstChange)', () => {
    component.ngAfterViewInit(); // ctx initialisieren

    const applyHexSpy = jest.spyOn<any, any>(component as any, 'applyHex');
    const updateCursorSpy = jest.spyOn<any, any>(
      component as any,
      'updateCursorFromCurrentColor',
    );

    component.ngOnChanges({
      color: {
        currentValue: '#00ff00',
        previousValue: '#ff0000',
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(applyHexSpy).toHaveBeenCalledWith('#00ff00', false);
    expect(updateCursorSpy).toHaveBeenCalled();
  });

  it('ngOnChanges should ignore firstChange', () => {
    const applyHexSpy = jest.spyOn<any, any>(component as any, 'applyHex');

    component.ngOnChanges({
      color: {
        currentValue: '#00ff00',
        previousValue: '#ff0000',
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(applyHexSpy).not.toHaveBeenCalled();
  });

  // ---------- Canvas Events ----------

  it('onCanvasMouseDown should start dragging and pick color', () => {
    component.ngAfterViewInit();

    // Setze einen Pixel im imageData
    const x = 1;
    const y = 2;
    const idx = (y * canvas.width + x) * 4;
    imageData[idx] = 10;
    imageData[idx + 1] = 20;
    imageData[idx + 2] = 30;

    const rect = {
      left: 100,
      top: 50,
      width: canvas.width,
      height: canvas.height,
    };
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(rect as any);

    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    const event = {
      clientX: rect.left + x,
      clientY: rect.top + y,
    } as MouseEvent;

    (component as any).onCanvasMouseDown(event);

    expect((component as any).isDragging).toBe(true);
    expect(component.red).toBe(10);
    expect(component.green).toBe(20);
    expect(component.blue).toBe(30);
    expect(component.cursorX).toBe(x);
    expect(component.cursorY).toBe(y);
    expect(component.cursorVisible).toBe(true);
    expect(emitSpy).toHaveBeenCalled(); // setRgb -> updateHexFromRgb -> emit=true
  });

  it('onCanvasMouseMove should pick color only while dragging', () => {
    component.ngAfterViewInit();

    const pickSpy = jest.spyOn<any, any>(
      component as any,
      'pickColorFromEvent',
    );

    const event = {} as MouseEvent;

    // nicht dragging -> kein Aufruf
    (component as any).isDragging = false;
    (component as any).onCanvasMouseMove(event);
    expect(pickSpy).not.toHaveBeenCalled();

    // dragging -> Aufruf
    (component as any).isDragging = true;
    (component as any).onCanvasMouseMove(event);
    expect(pickSpy).toHaveBeenCalledWith(event);
  });

  it('onCanvasMouseUp and onCanvasMouseLeave should stop dragging', () => {
    (component as any).isDragging = true;

    (component as any).onCanvasMouseUp();
    expect((component as any).isDragging).toBe(false);

    (component as any).isDragging = true;
    (component as any).onCanvasMouseLeave();
    expect((component as any).isDragging).toBe(false);
  });

  // ---------- Cursor-Berechnung ----------

  it('updateCursorFromCurrentColor should find best matching pixel', () => {
    component.ngAfterViewInit();

    // Canvas 4x4, Pixel (2,1) soll exakt matchen
    const width = canvas.width;
    const x = 2;
    const y = 1;
    const idx = (y * width + x) * 4;
    imageData.fill(0);
    imageData[idx] = 100;
    imageData[idx + 1] = 150;
    imageData[idx + 2] = 200;

    component.red = 100;
    component.green = 150;
    component.blue = 200;

    (component as any).updateCursorFromCurrentColor();

    expect(component.cursorX).toBe(x);
    expect(component.cursorY).toBe(y);
    expect(component.cursorVisible).toBe(true);
  });

  it('pickColorFromEvent should clamp x/y inside canvas', () => {
    component.ngAfterViewInit();

    imageData.fill(0);
    imageData[0] = 50;
    imageData[1] = 60;
    imageData[2] = 70;

    const rect = {
      left: 100,
      top: 50,
      width: canvas.width,
      height: canvas.height,
    };
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(rect as any);

    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    // bewusst außerhalb des Canvas klicken -> wird auf Max begrenzt
    const event = {
      clientX: rect.left + canvas.width + 10,
      clientY: rect.top + canvas.height + 10,
    } as MouseEvent;

    (component as any).pickColorFromEvent(event);

    expect(component.cursorX).toBe(canvas.width - 1);
    expect(component.cursorY).toBe(canvas.height - 1);
    expect(emitSpy).toHaveBeenCalled();
  });

  // ---------- RGB / HEX Inputs ----------

  it('onRgbInput should clamp values and update hex + cursor', () => {
    component.ngAfterViewInit();
    const updateCursorSpy = jest.spyOn<any, any>(
      component as any,
      'updateCursorFromCurrentColor',
    );
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    const input = document.createElement('input');
    input.value = '300'; // wird auf 255 geklemmt

    const event = { target: input } as unknown as Event;

    component.onRgbInput('red', event);

    expect(component.red).toBe(255);
    expect(component.hex).toBe('#ff0000');
    expect(component.color).toBe('#ff0000');
    expect(updateCursorSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('#ff0000');
  });

  it('onRgbInput should treat NaN as 0', () => {
    component.ngAfterViewInit();

    const input = document.createElement('input');
    input.value = 'abc'; // NaN

    const event = { target: input } as unknown as Event;

    component.onRgbInput('green', event);

    expect(component.green).toBe(0);
  });

  it('onHexInput should apply hex and update cursor', () => {
    component.ngAfterViewInit();
    const applyHexSpy = jest.spyOn<any, any>(component as any, 'applyHex');
    const updateCursorSpy = jest.spyOn<any, any>(
      component as any,
      'updateCursorFromCurrentColor',
    );

    const input = document.createElement('input');
    input.value = '#00ff00';

    const event = { target: input } as unknown as Event;

    component.onHexInput(event);

    expect(applyHexSpy).toHaveBeenCalledWith('#00ff00');
    expect(updateCursorSpy).toHaveBeenCalled();
  });

  // ---------- applyHex / rgbToHex / hexToRgb ----------

  it('applyHex should normalize short hex (#0f0) and emit by default', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    (component as any).applyHex('#0f0');

    expect(component.hex).toBe('#00ff00');
    expect(component.color).toBe('#00ff00');
    expect(component.red).toBe(0);
    expect(component.green).toBe(255);
    expect(component.blue).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith('#00ff00');
  });

  it('applyHex should not emit when emit=false', () => {
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    (component as any).applyHex('#0000ff', false);

    expect(component.hex).toBe('#0000ff');
    expect(component.color).toBe('#0000ff');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('applyHex should keep invalid value and not change rgb', () => {
    component.red = 10;
    component.green = 20;
    component.blue = 30;
    const emitSpy = jest.spyOn(component.colorChange, 'emit');

    (component as any).applyHex('xyz'); // ungültig

    expect(component.hex).toBe('xyz');
    expect(component.red).toBe(10);
    expect(component.green).toBe(20);
    expect(component.blue).toBe(30);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('rgbToHex should convert correctly', () => {
    const hex = (component as any).rgbToHex(255, 128, 0);
    expect(hex).toBe('#ff8000');
  });

  it('hexToRgb should parse valid hex and return null for invalid', () => {
    const rgb = (component as any).hexToRgb('#ff8000');
    expect(rgb).toEqual({ r: 255, g: 128, b: 0 });

    const invalid = (component as any).hexToRgb('invalid');
    expect(invalid).toBeNull();
  });
});
