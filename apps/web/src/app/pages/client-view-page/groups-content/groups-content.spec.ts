import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupsContent } from './groups-content';

describe('GroupsContent', () => {
  let component: GroupsContent;
  let fixture: ComponentFixture<GroupsContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupsContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupsContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
