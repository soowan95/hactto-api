import { DomainPersonalPrediction } from '../../domain/aggregates/personal-perdiction.entity';

export class InfraPersonalPredictionMapper {
  static toPersistence(entity: DomainPersonalPrediction) {
    return {
      visitorId: entity.visitorId,
      episode: entity.episode,
      pp1WnNo: entity.numbers[0],
      pp2WnNo: entity.numbers[1],
      pp3WnNo: entity.numbers[2],
      pp4WnNo: entity.numbers[3],
      pp5WnNo: entity.numbers[4],
      pp6WnNo: entity.numbers[5],
    };
  }
}
