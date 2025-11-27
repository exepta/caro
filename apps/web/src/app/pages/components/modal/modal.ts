import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  onBackdropClick(): void {
    this.setOpen(false);
    this.closed.emit();
  }

  setOpen(value: boolean): void {
    this.open = value;
    this.openChange.emit(value);
  }
}
