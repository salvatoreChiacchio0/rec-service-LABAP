import { ApiProperty } from '@nestjs/swagger';

export class RelationshipsStatsDto {
  @ApiProperty({
    description: 'Total number of OWNS relationships',
    example: 200,
  })
  owns: number;

  @ApiProperty({
    description: 'Total number of DESIRES relationships',
    example: 180,
  })
  desires: number;

  @ApiProperty({
    description: 'Total number of RATES relationships',
    example: 30,
  })
  rates: number;

  @ApiProperty({
    description: 'Total number of SWAPPED_WITH relationships',
    example: 45,
  })
  swapped: number;

  @ApiProperty({
    description: 'Total number of all relationships',
    example: 455,
  })
  total: number;
}

export class GraphStatisticsDto {
  @ApiProperty({
    description: 'Total number of User nodes in the graph',
    example: 150,
  })
  users: number;

  @ApiProperty({
    description: 'Total number of Skill nodes in the graph',
    example: 50,
  })
  skills: number;

  @ApiProperty({
    description: 'Statistics about relationships in the graph',
    type: RelationshipsStatsDto,
  })
  relationships: RelationshipsStatsDto;
}

