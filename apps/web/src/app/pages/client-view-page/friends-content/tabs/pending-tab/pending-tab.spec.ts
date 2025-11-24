import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingTab } from './pending-tab';

describe('PendingTab', () => {
  let component: PendingTab;
  let fixture: ComponentFixture<PendingTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
