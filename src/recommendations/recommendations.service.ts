import { Injectable, Logger } from '@nestjs/common';
import { GraphRepository } from '../graph/graph.repository';
import {
  HttpClientService,
  SkillDesiredDto,
  SkillOfferedDto,
  UserDto,
} from '../http/http-client.service';

export interface UserRecommendation {
  user: {
    uid: string;
    username: string;
    email: string;
    profilePicture?: string;
    skillDesired?: string[];
    skillOffered?: string[];
    [key: string]: any;
  };
  skillsOffered: Array<{
    id: number;
    skill: {
      id: number;
      label: string;
      description?: string;
    };
  }>;
  skillsDesired: Array<{
    id: number;
    skill: {
      id: number;
      label: string;
      description?: string;
    };
  }>;
  recommendationScore: number;
  reason: string;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private graphSeeding = false;

  constructor(
    private readonly graphRepository: GraphRepository,
    private readonly httpClient: HttpClientService,
  ) {}

  async getSwapRecommendations(
    userUid: string,
    limit: number,
  ): Promise<UserRecommendation[]> {
    this.logger.log(
      `Getting level 2 swap recommendations for user ${userUid} with limit ${limit}`,
    );

    // Step 1: Graph traversal di livello 2
    let recommendationType: 'level2' | 'fallback' = 'level2';
    let graphResults =
      await this.graphRepository.getLevel2SwapRecommendations(userUid, limit);

    if (graphResults.length === 0) {
      this.logger.warn(
        `No level 2 recommendations found for user ${userUid}, trying fallback strategy`,
      );
      // Fallback chain
      graphResults = await this.graphRepository.getSwapRecommendationsWithFallback(
        userUid,
        limit,
      );
      recommendationType = 'fallback';
    }

    if (graphResults.length === 0) {
      const seeded = await this.seedGraphFromBackend();
      if (seeded) {
        this.logger.log(
          `Graph seeded from backend data. Recomputing recommendations for user ${userUid}`,
        );
        graphResults =
          await this.graphRepository.getSwapRecommendationsWithFallback(
            userUid,
            limit,
          );
        recommendationType = 'fallback';
      }
    }

    if (graphResults.length === 0) {
      this.logger.warn(
        `No recommendations available for user ${userUid} even after fallback and seeding`,
      );
      return [];
    }

    // Step 2: Arricchisci con dati utenti dal backend
    return this.enrichWithUserData(graphResults, recommendationType);
  }

  private async enrichWithUserData(
    graphResults: any[],
    recommendationType: 'level2' | 'fallback',
  ): Promise<UserRecommendation[]> {
    const userUids = graphResults.map((r) => r.recommendedUserUid);

    // Fetch users in parallel
    const usersMap = await this.httpClient.getUsersByUids(userUids);

    // Fetch skills for each user in parallel
    const enrichedResults = await Promise.all(
      graphResults.map(async (result) => {
        const user = usersMap.get(result.recommendedUserUid);

        if (!user) {
          this.logger.warn(
            `User ${result.recommendedUserUid} not found in backend`,
          );
          return null;
        }

        // Fetch skills offered and desired
        const [skillsOffered, skillsDesired] = await Promise.all([
          this.httpClient.getSkillsOfferedByUser(user.uid),
          this.httpClient.getSkillsDesiredByUser(user.uid),
        ]);

        const reason =
          recommendationType === 'level2'
            ? `Consigliato perché ha fatto swap con utenti con cui anche tu hai swappato`
            : `Consigliato in base alle skill disponibili e alla popolarità degli utenti`;

        return {
          user: {
            uid: user.uid,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            skillDesired: user.skillDesired,
            skillOffered: user.skillOffered,
          },
          skillsOffered: skillsOffered.map((so) => ({
            id: so.id,
            skill: {
              id: so.skill.id,
              label: so.skill.label,
              description: so.skill.description,
            },
          })),
          skillsDesired: skillsDesired.map((sd) => ({
            id: sd.id,
            skill: {
              id: sd.skill.id,
              label: sd.skill.label,
              description: sd.skill.description,
            },
          })),
          recommendationScore: result.score,
          reason,
        };
      }),
    );

    // Filter out null results
    return enrichedResults.filter((result) => result !== null) as UserRecommendation[];
  }

  private async seedGraphFromBackend(): Promise<boolean> {
    if (this.graphSeeding) {
      this.logger.warn('Graph seeding already in progress, skipping concurrent attempt');
      return false;
    }

    this.graphSeeding = true;

    try {
      const users = await this.httpClient.getAllUsers();

      if (!users.length) {
        this.logger.warn('Backend returned no users, graph seeding skipped');
        return false;
      }

      for (const user of users) {
        await this.graphRepository.createOrUpdateUser({
          uid: user.uid,
          name: user.username,
        });

        const [skillsOffered, skillsDesired] = await Promise.all([
          this.httpClient.getSkillsOfferedByUser(user.uid),
          this.httpClient.getSkillsDesiredByUser(user.uid),
        ]);

        await this.seedSkillsForUser(user, skillsOffered, skillsDesired);
      }

      this.logger.log(`Graph seeded with ${users.length} users from backend.`);
      return true;
    } catch (error) {
      this.logger.error('Failed to seed graph from backend', error);
      return false;
    } finally {
      this.graphSeeding = false;
    }
  }

  private async seedSkillsForUser(
    user: UserDto,
    skillsOffered: SkillOfferedDto[],
    skillsDesired: SkillDesiredDto[],
  ): Promise<void> {
    const offeredProcessed = new Set<number>();
    for (const offered of skillsOffered) {
      const skill = offered.skill;
      if (!skill) {
        continue;
      }

      const skillId = Number(skill.id);
      if (!Number.isFinite(skillId)) {
        continue;
      }

      if (!offeredProcessed.has(skillId)) {
        offeredProcessed.add(skillId);
        await this.graphRepository.createOrUpdateSkill({
          id: skillId,
          label: skill.label ?? `Skill ${skillId}`,
          description: skill.description ?? undefined,
        });
      }

      await this.graphRepository.createOwnsRelationship(user.uid, skillId);
    }

    const desiredProcessed = new Set<number>();
    for (const desired of skillsDesired) {
      const skill = desired.skill;
      if (!skill) {
        continue;
      }

      const skillId = Number(skill.id);
      if (!Number.isFinite(skillId)) {
        continue;
      }

      if (!desiredProcessed.has(skillId)) {
        desiredProcessed.add(skillId);
        await this.graphRepository.createOrUpdateSkill({
          id: skillId,
          label: skill.label ?? `Skill ${skillId}`,
          description: skill.description ?? undefined,
        });
      }

      await this.graphRepository.createDesiresRelationship(user.uid, skillId);
    }
  }

  async getGraphStatistics() {
    return this.graphRepository.getGraphStatistics();
  }
}

