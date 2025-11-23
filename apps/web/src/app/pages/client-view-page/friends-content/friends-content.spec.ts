import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendsContent } from './friends-content';

describe('FriendsContent', () => {
  let component: FriendsContent;
  let fixture: ComponentFixture<FriendsContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendsContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendsContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
