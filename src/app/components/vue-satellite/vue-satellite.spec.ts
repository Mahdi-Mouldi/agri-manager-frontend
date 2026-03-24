import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VueSatellite } from './vue-satellite';

describe('VueSatellite', () => {
  let component: VueSatellite;
  let fixture: ComponentFixture<VueSatellite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VueSatellite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VueSatellite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
