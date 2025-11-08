import { ApiProperty } from '@nestjs/swagger';

export class SkillDto {
  @ApiProperty({
    description: 'Skill ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Skill label',
    example: 'JavaScript',
  })
  label: string;

  @ApiProperty({
    description: 'Skill description',
    example: 'Programming language for web development',
    required: false,
  })
  description?: string;
}

export class SkillOfferedDto {
  @ApiProperty({
    description: 'Skill offered ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Skill information',
    type: SkillDto,
  })
  skill: SkillDto;
}

export class SkillDesiredDto {
  @ApiProperty({
    description: 'Skill desired ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Skill information',
    type: SkillDto,
  })
  skill: SkillDto;
}

export class UserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'user_12345',
  })
  uid: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Profile picture',
    required: false,
  })
  profilePicture?: string;

  @ApiProperty({
    description: 'Skills desired by the user',
    type: [String],
    required: false,
  })
  skillDesired?: string[];

  @ApiProperty({
    description: 'Skills offered by the user',
    type: [String],
    required: false,
  })
  skillOffered?: string[];
}

export class UserRecommendationDto {
  @ApiProperty({
    description: 'Recommended user information',
    type: UserDto,
  })
  user: UserDto;

  @ApiProperty({
    description: 'Skills offered by the recommended user',
    type: [SkillOfferedDto],
  })
  skillsOffered: SkillOfferedDto[];

  @ApiProperty({
    description: 'Skills desired by the recommended user',
    type: [SkillDesiredDto],
  })
  skillsDesired: SkillDesiredDto[];

  @ApiProperty({
    description: 'Recommendation score (higher is better)',
    example: 123.45,
  })
  recommendationScore: number;

  @ApiProperty({
    description: 'Reason for the recommendation',
    example: 'Consigliato perché ha fatto swap con utenti con cui anche tu hai swappato',
  })
  reason: string;
}

