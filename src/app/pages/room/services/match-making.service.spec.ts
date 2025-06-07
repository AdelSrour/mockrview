import { TestBed } from '@angular/core/testing';

import { MatchMakingService } from './match-making.service';

describe('MatchMakingService', () => {
  let service: MatchMakingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchMakingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
