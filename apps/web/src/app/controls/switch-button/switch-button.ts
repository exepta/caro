import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-switch-button',
  imports: [],
  templateUrl: './switch-button.html',
  styleUrl: './switch-button.scss',
})
export class SwitchButton {

  @Input() value = false;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<boolean>();

  onToggle() {
    if (this.disabled) return;
    this.value = !this.value;
    this.valueChange.emit(this.value);
  }
}
