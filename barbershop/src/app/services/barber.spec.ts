import { TestBed } from '@angular/core/testing';

import { Barber } from './barber';

describe('Barber', () => {
  let service: Barber;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Barber);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
