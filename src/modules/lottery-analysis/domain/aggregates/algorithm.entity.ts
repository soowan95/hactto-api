import { AggregateRoot } from '@nestjs/cqrs';
import { AlgorithmFetchedEvent } from '../events/algorithm-fetched.event';

export class DomainAlgorithm extends AggregateRoot {
  constructor(
    public readonly type: string,
    public complexity: number,
  ) {
    super();
  }

  upserted() {
    this.apply(new AlgorithmFetchedEvent(this.type));
  }

  complexityUpdated() {
    this.apply(new AlgorithmFetchedEvent(this.type));
  }
}
