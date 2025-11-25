import { Component, Input, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgClass } from '@angular/common';

type TooltipMode = 'hover' | 'click' | 'all';
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
type TooltipVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [NgClass],
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent {
  @Input() text = '';
  @Input() mode: TooltipMode = 'hover';
  @Input() position: TooltipPosition = 'top';
  @Input() variant: TooltipVariant = 'default';

  visible = signal(false);

  onMouseEnter() {
    if (this.mode === 'hover' || this.mode === 'all') {
      this.visible.set(true);
    }
  }

  onMouseLeave() {
    if (this.mode === 'hover' || this.mode === 'all') {
      this.visible.set(false);
    }
  }

  onClick(event: MouseEvent) {
    if (this.mode === 'click' || this.mode === 'all') {
      event.stopPropagation();
      this.visible.update(v => !v);
    }
  }
}
