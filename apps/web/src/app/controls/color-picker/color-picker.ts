import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.scss',
})
export class ColorPicker implements AfterViewInit, OnChanges {
  @ViewChild('colorCanvas', { static: true })
  colorCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() color: string = '#ff0000';
  @Output() colorChange = new EventEmitter<string>();

  red = 255;
  green = 0;
  blue = 0;
  hex = '#ff0000';

  private ctx: CanvasRenderingContext2D | null = null;
  private isDragging = false;

  // Cursor-Overlay-Position
  cursorX = 0;
  cursorY = 0;
  cursorVisible = false;

  ngAfterViewInit(): void {
    this.ctx = this.colorCanvas.nativeElement.getContext('2d');
    if (!this.ctx) return;

    this.drawPaletteBase();

    this.applyHex(this.color, false);
    this.updateCursorFromCurrentColor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['color'] && !changes['color'].firstChange) {
      this.applyHex(this.color, false);
      this.updateCursorFromCurrentColor();
    }
  }

  // ========================
  // Canvas / Palette
  // ========================

  private drawPaletteBase() {
    if (!this.ctx) return;

    const canvas = this.colorCanvas.nativeElement;
    const width = canvas.width;
    const height = canvas.height;

    const hueGradient = this.ctx.createLinearGradient(0, 0, width, 0);
    hueGradient.addColorStop(0, 'rgb(255, 0, 0)');
    hueGradient.addColorStop(0.17, 'rgb(255, 255, 0)');
    hueGradient.addColorStop(0.33, 'rgb(0, 255, 0)');
    hueGradient.addColorStop(0.5, 'rgb(0, 255, 255)');
    hueGradient.addColorStop(0.67, 'rgb(0, 0, 255)');
    hueGradient.addColorStop(0.83, 'rgb(255, 0, 255)');
    hueGradient.addColorStop(1, 'rgb(255, 0, 0)');
    this.ctx.fillStyle = hueGradient;
    this.ctx.fillRect(0, 0, width, height);

    const whiteGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    whiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    whiteGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = whiteGradient;
    this.ctx.fillRect(0, 0, width, height);

    const blackGradient = this.ctx.createLinearGradient(0, 0, 0, height);
    blackGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    blackGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    this.ctx.fillStyle = blackGradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  protected onCanvasMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.pickColorFromEvent(event);
  }

  protected onCanvasMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.pickColorFromEvent(event);
  }

  protected onCanvasMouseUp() {
    this.isDragging = false;
  }

  protected onCanvasMouseLeave() {
    this.isDragging = false;
  }

  private pickColorFromEvent(event: MouseEvent) {
    if (!this.ctx) return;
    const canvas = this.colorCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const x = Math.min(
      Math.max(event.clientX - rect.left, 0),
      canvas.width - 1,
    );
    const y = Math.min(
      Math.max(event.clientY - rect.top, 0),
      canvas.height - 1,
    );

    const pixel = this.ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;

    this.setRgb(r, g, b, true);

    this.cursorX = x;
    this.cursorY = y;
    this.cursorVisible = true;
  }

  private updateCursorFromCurrentColor() {
    if (!this.ctx) return;

    const canvas = this.colorCanvas.nativeElement;
    const width = canvas.width;
    const height = canvas.height;

    const image = this.ctx.getImageData(0, 0, width, height).data;
    const targetR = this.red;
    const targetG = this.green;
    const targetB = this.blue;

    let bestX = 0;
    let bestY = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = rowOffset + x * 4;
        const r = image[idx];
        const g = image[idx + 1];
        const b = image[idx + 2];

        const dr = r - targetR;
        const dg = g - targetG;
        const db = b - targetB;
        const dist = dr * dr + dg * dg + db * db;

        if (dist < bestDist) {
          bestDist = dist;
          bestX = x;
          bestY = y;
          if (dist === 0) {
            break;
          }
        }
      }
      if (bestDist === 0) break;
    }

    this.cursorX = bestX;
    this.cursorY = bestY;
    this.cursorVisible = true;
  }

  // ========================
  // RGB / HEX Inputs
  // ========================

  onRgbInput(channel: 'red' | 'green' | 'blue', e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;

    let num = Number(target.value);
    if (Number.isNaN(num)) num = 0;
    num = Math.min(255, Math.max(0, num));

    if (channel === 'red') this.red = num;
    if (channel === 'green') this.green = num;
    if (channel === 'blue') this.blue = num;

    this.updateHexFromRgb(true);
    this.updateCursorFromCurrentColor();
  }

  onHexInput(e: Event) {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    this.applyHex(target.value);
    this.updateCursorFromCurrentColor();
  }

  private setRgb(r: number, g: number, b: number, emit: boolean) {
    this.red = r;
    this.green = g;
    this.blue = b;
    this.updateHexFromRgb(emit);
  }

  private updateHexFromRgb(emit: boolean) {
    this.hex = this.rgbToHex(this.red, this.green, this.blue);
    this.color = this.hex;
    if (emit) {
      this.colorChange.emit(this.color);
    }
  }

  private applyHex(value: string, emit: boolean = true) {
    let hex = value.trim().toLowerCase();
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }

    // #rgb → #rrggbb
    if (hex.length === 4) {
      const r = hex[1];
      const g = hex[2];
      const b = hex[3];
      hex = `#${r}${r}${g}${g}${b}${b}`;
    }

    const rgb = this.hexToRgb(hex);
    if (!rgb) {
      this.hex = value;
      return;
    }

    this.red = rgb.r;
    this.green = rgb.g;
    this.blue = rgb.b;
    this.hex = hex;
    this.color = hex;

    if (emit) {
      this.colorChange.emit(this.color);
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const match = /^#?([a-f0-9]{6})$/i.exec(hex);
    if (!match) return null;
    const intVal = parseInt(match[1], 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return { r, g, b };
  }
}
