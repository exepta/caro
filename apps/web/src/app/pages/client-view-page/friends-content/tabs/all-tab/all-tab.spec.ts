import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTab } from './all-tab';

describe('AllTab', () => {
  let component: AllTab;
  let fixture: ComponentFixture<AllTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
