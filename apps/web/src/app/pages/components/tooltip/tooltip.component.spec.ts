import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tooltip } from './tooltip.component';

describe('Tooltip', () => {
  let component: Tooltip;
  let fixture: ComponentFixture<Tooltip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tooltip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tooltip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
