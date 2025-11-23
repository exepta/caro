import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServersContent } from './servers-content';

describe('ServersContent', () => {
  let component: ServersContent;
  let fixture: ComponentFixture<ServersContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServersContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServersContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
