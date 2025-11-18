import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientViewPage } from './client-view-page';

describe('ClientViewPage', () => {
  let component: ClientViewPage;
  let fixture: ComponentFixture<ClientViewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientViewPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
