import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { UserRecommendationDto } from './dto/user-recommendation.dto';
import { GraphStatisticsDto } from './dto/graph-stats.dto';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('swaps/:userUid')
  @ApiOperation({
    summary: 'Get swap recommendations for a user',
    description:
      'Returns a list of recommended users for swap based on level 2 graph traversal. ' +
      'The algorithm finds users who have swapped with users that the current user has also swapped with. ' +
      'Each recommendation includes user details, skills offered/desired, recommendation score, and reason.',
  })
  @ApiParam({
    name: 'userUid',
    description: 'Unique identifier of the user',
    example: 'user_12345',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of recommendations to return',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of recommended users',
    type: [UserRecommendationDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user UID or limit parameter',
  })
  async getSwapRecommendations(
    @Param('userUid') userUid: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<UserRecommendationDto[]> {
    if (!userUid || userUid.trim() === '') {
      throw new HttpException(
        'User UID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const limitValue = Math.max(1, Math.min(100, limit));

    return this.recommendationsService.getSwapRecommendations(
      userUid,
      limitValue,
    );
  }

  @Get('graph/stats')
  @ApiTags('graph')
  @ApiOperation({
    summary: 'Get Neo4j graph statistics',
    description:
      'Returns statistics about the Neo4j graph database including counts of nodes and relationships.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Graph statistics',
    type: GraphStatisticsDto,
  })
  async getGraphStatistics(): Promise<GraphStatisticsDto> {
    return this.recommendationsService.getGraphStatistics();
  }
}


