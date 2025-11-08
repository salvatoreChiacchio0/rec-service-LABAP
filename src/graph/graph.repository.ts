import { Injectable } from '@nestjs/common';
import { int } from 'neo4j-driver';
import { Neo4jService } from '../neo4j/neo4j.service';
import { UserNode } from './entities/user.entity';
import { SkillNode } from './entities/skill.entity';
import {
  RelationshipType,
  RatingProperties,
  SwapProperties,
} from './relationships/relationships';

@Injectable()
export class GraphRepository {
  constructor(private readonly neo4jService: Neo4jService) {}

  // User operations
  async createOrUpdateUser(user: UserNode): Promise<void> {
    const query = `
      MERGE (u:User {uid: $uid})
      SET u.name = $name
    `;
    await this.neo4jService.runQuery(query, {
      uid: user.uid,
      name: user.name || null,
    });
  }

  // Skill operations
  async createOrUpdateSkill(skill: SkillNode): Promise<void> {
    const query = `
      MERGE (s:Skill {id: $id})
      SET s.label = $label,
          s.description = $description
    `;
    await this.neo4jService.runQuery(query, {
      id: skill.id,
      label: skill.label,
      description: skill.description || null,
    });
  }

  // Relationship: User OWNS Skill
  async createOwnsRelationship(userUid: string, skillId: number): Promise<void> {
    const query = `
      MATCH (u:User {uid: $userUid})
      MATCH (s:Skill {id: $skillId})
      MERGE (u)-[r:OWNS]->(s)
    `;
    await this.neo4jService.runQuery(query, { userUid, skillId });
  }

  // Relationship: User DESIRES Skill
  async createDesiresRelationship(
    userUid: string,
    skillId: number,
  ): Promise<void> {
    const query = `
      MATCH (u:User {uid: $userUid})
      MATCH (s:Skill {id: $skillId})
      MERGE (u)-[r:DESIRES]->(s)
    `;
    await this.neo4jService.runQuery(query, { userUid, skillId });
  }

  // Relationship: User RATES User for Skills
  async createRatesRelationship(
    reviewerUid: string,
    reviewedUid: string,
    ratingProperties: RatingProperties,
  ): Promise<void> {
    const query = `
      MERGE (reviewer:User {uid: $reviewerUid})
      MERGE (reviewed:User {uid: $reviewedUid})
      MERGE (reviewer)-[r:RATES]->(reviewed)
      SET r.rating = $rating,
          r.review = $review,
          r.timestamp = datetime()
    `;
    await this.neo4jService.runQuery(query, {
      reviewerUid,
      reviewedUid,
      rating: ratingProperties.rating,
      review: ratingProperties.review || null,
    });
  }

  // Relationship: User SWAPPED_WITH User
  async createSwappedRelationship(
    userUid1: string,
    userUid2: string,
    swapProperties: SwapProperties,
  ): Promise<void> {
    const query = `
      MERGE (u1:User {uid: $userUid1})
      MERGE (u2:User {uid: $userUid2})
      MERGE (u1)-[r:SWAPPED_WITH]->(u2)
      SET r.timestamp = $timestamp,
          r.success = $success
    `;
    await this.neo4jService.runQuery(query, {
      userUid1,
      userUid2,
      timestamp: swapProperties.timestamp,
      success: swapProperties.success,
    });
  }

  // Remove relationship
  async removeOwnsRelationship(userUid: string, skillId: number): Promise<void> {
    const query = `
      MATCH (u:User {uid: $userUid})-[r:OWNS]->(s:Skill {id: $skillId})
      DELETE r
    `;
    await this.neo4jService.runQuery(query, { userUid, skillId });
  }

  async removeDesiresRelationship(
    userUid: string,
    skillId: number,
  ): Promise<void> {
    const query = `
      MATCH (u:User {uid: $userUid})-[r:DESIRES]->(s:Skill {id: $skillId})
      DELETE r
    `;
    await this.neo4jService.runQuery(query, { userUid, skillId });
  }

  // Graph traversal di livello 2 per trovare utenti suggeriti
  // Livello 1: utenti con cui l'utente corrente ha fatto swap
  // Livello 2: utenti con cui questi utenti (livello 1) hanno fatto swap
  async getLevel2SwapRecommendations(
    userUid: string,
    limit: number = 10,
  ): Promise<any[]> {
    const query = `
      // Livello 1: Trova utenti con cui l'utente corrente ha fatto swap
      MATCH (u:User {uid: $userUid})-[swap1:SWAPPED_WITH]->(level1User:User)
      WHERE swap1.success = true
      
      // Livello 2: Trova utenti con cui i level1User hanno fatto swap
      MATCH (level1User)-[swap2:SWAPPED_WITH]->(level2User:User)
      WHERE swap2.success = true
        AND level2User.uid <> u.uid
        AND NOT (u)-[:SWAPPED_WITH]->(level2User)
      
      // Trova le skill che level2User possiede (che potrebbero interessare)
      OPTIONAL MATCH (level2User)-[:OWNS]->(skill:Skill)
      
      // Trova le skill che level2User desidera E che l'utente corrente possiede (match potenziale)
      OPTIONAL MATCH (level2User)-[:DESIRES]->(desiredSkill:Skill)
      WHERE (u)-[:OWNS]->(desiredSkill)
      
      WITH u, level1User, level2User, 
           collect(DISTINCT skill.label) as skillsTheyOffer,
           collect(DISTINCT desiredSkill.label) as skillsTheyWant,
           count(DISTINCT skill) as skillsCount,
           count(DISTINCT desiredSkill) as matchingDesires
      
      // Boost: conta quante volte level2User appare (più popolare = migliore)
      WITH u, level1User, level2User, skillsTheyOffer, skillsTheyWant,
           skillsCount, matchingDesires,
           count(DISTINCT level1User) as connectionStrength
      
      // Boost: rating medio di level2User
      OPTIONAL MATCH (rated:User)-[r:RATES]->(level2User)
      WITH u, level1User, level2User, skillsTheyOffer, skillsTheyWant,
           skillsCount, matchingDesires, connectionStrength,
           avg(r.rating) as avgRating, count(r) as ratingCount
      
      // Calcola score basato su:
      // - connectionStrength: quante connessioni di livello 2 (più alto = meglio)
      // - skillsCount: quante skill offre
      // - matchingDesires: quante skill desidera che l'utente possiede
      // - avgRating: rating medio
      WITH level2User, skillsTheyOffer, skillsTheyWant,
           connectionStrength * 20 + 
           skillsCount * 5 + 
           matchingDesires * 15 + 
           coalesce(avgRating, 0) * 3 + 
           coalesce(ratingCount, 0) * 2 as score
      
      ORDER BY score DESC
      LIMIT $limit
      
      RETURN level2User.uid as recommendedUserUid,
             level2User.name as recommendedUserName,
             skillsTheyOffer,
             skillsTheyWant,
             score
    `;

    const result = await this.neo4jService.runQuery(query, {
      userUid,
      limit: int(limit),
    });
    return result.map((record) => ({
      recommendedUserUid: record.recommendedUserUid,
      recommendedUserName: record.recommendedUserName,
      skillsTheyOffer: record.skillsTheyOffer || [],
      skillsTheyWant: record.skillsTheyWant || [],
      score: record.score,
    }));
  }

  // Get recommendations based on graph analysis (versione originale)
  async getSwapRecommendations(userUid: string, limit: number = 10): Promise<any[]> {
    const query = `
      MATCH (u:User {uid: $userUid})-[:DESIRES]->(desiredSkill:Skill)
      MATCH (otherUser:User)-[:OWNS]->(desiredSkill)
      WHERE otherUser.uid <> u.uid
      
      // Find what the other user desires
      OPTIONAL MATCH (otherUser)-[:DESIRES]->(otherDesiredSkill:Skill)
      WHERE (u)-[:OWNS]->(otherDesiredSkill)
      
      WITH u, otherUser, desiredSkill, otherDesiredSkill,
           count(otherDesiredSkill) as matchingSkills
      
      // Boost by ratings
      OPTIONAL MATCH (rated:User)-[:RATES]->(otherUser)
      WITH u, otherUser, desiredSkill, otherDesiredSkill, matchingSkills,
           avg(rated.rating) as avgRating
      
      // Boost by past successful swaps
      OPTIONAL MATCH (u)-[swap:SWAPPED_WITH]->(otherUser)
      WHERE swap.success = true
      WITH u, otherUser, desiredSkill, otherDesiredSkill, matchingSkills, avgRating,
           count(swap) as successfulSwaps
      
      // Calculate recommendation score
      WITH u, otherUser, desiredSkill, otherDesiredSkill, matchingSkills,
           coalesce(avgRating, 0) as avgRating,
           coalesce(successfulSwaps, 0) as successfulSwaps,
           (matchingSkills * 10 + avgRating * 2 + successfulSwaps * 5) as score
      
      ORDER BY score DESC
      LIMIT $limit
      
      RETURN otherUser.uid as recommendedUserUid,
             otherUser.name as recommendedUserName,
             collect(DISTINCT desiredSkill.label) as skillsTheyOffer,
             collect(DISTINCT otherDesiredSkill.label) as skillsTheyWant,
             score
    `;
    
    const result = await this.neo4jService.runQuery(query, {
      userUid,
      limit: int(limit),
    });
    return result.map(record => ({
      recommendedUserUid: record.recommendedUserUid,
      recommendedUserName: record.recommendedUserName,
      skillsTheyOffer: record.skillsTheyOffer,
      skillsTheyWant: record.skillsTheyWant,
      score: record.score,
    }));
  }

  // Fallback 1: Get most popular users (based on ratings and swaps)
  async getMostPopularUsers(userUid: string, limit: number = 10): Promise<any[]> {
    const query = `
      MATCH (u:User {uid: $userUid})
      MATCH (otherUser:User)
      WHERE otherUser.uid <> u.uid
      
      // Get ratings for other user
      OPTIONAL MATCH (rated:User)-[:RATES]->(otherUser)
      WITH u, otherUser, avg(rated.rating) as avgRating, count(rated) as ratingCount
      
      // Get successful swaps for other user
      OPTIONAL MATCH (otherUser)-[swap:SWAPPED_WITH]->(anyUser:User)
      WHERE swap.success = true
      WITH u, otherUser, avgRating, ratingCount, count(swap) as successfulSwaps
      
      // Get skills they own
      OPTIONAL MATCH (otherUser)-[:OWNS]->(skill:Skill)
      
      WITH u, otherUser, avgRating, ratingCount, successfulSwaps,
           collect(DISTINCT skill.label) as skillsTheyOffer
      
      // Calculate popularity score
      WITH otherUser, skillsTheyOffer,
           coalesce(avgRating, 0) * 2 + coalesce(ratingCount, 0) + coalesce(successfulSwaps, 0) * 3 as popularityScore
      
      ORDER BY popularityScore DESC, otherUser.uid
      LIMIT $limit
      
      RETURN otherUser.uid as recommendedUserUid,
             otherUser.name as recommendedUserName,
             skillsTheyOffer,
             [] as skillsTheyWant,
             popularityScore as score
    `;
    
    const result = await this.neo4jService.runQuery(query, {
      userUid,
      limit: int(limit),
    });
    return result.map(record => ({
      recommendedUserUid: record.recommendedUserUid,
      recommendedUserName: record.recommendedUserName,
      skillsTheyOffer: record.skillsTheyOffer,
      skillsTheyWant: record.skillsTheyWant,
      score: record.score,
    }));
  }

  // Fallback 2: Get recently created users (last resort)
  async getRecentlyCreatedUsers(userUid: string, limit: number = 10): Promise<any[]> {
    const query = `
      MATCH (u:User {uid: $userUid})
      MATCH (otherUser:User)
      WHERE otherUser.uid <> u.uid
      
      // Get skills they own
      OPTIONAL MATCH (otherUser)-[:OWNS]->(skill:Skill)
      
      WITH u, otherUser, collect(DISTINCT skill.label) as skillsTheyOffer
      
      ORDER BY otherUser.uid
      LIMIT $limit
      
      RETURN otherUser.uid as recommendedUserUid,
             otherUser.name as recommendedUserName,
             skillsTheyOffer,
             [] as skillsTheyWant,
             0 as score
    `;
    
    const result = await this.neo4jService.runQuery(query, {
      userUid,
      limit: int(limit),
    });
    return result.map(record => ({
      recommendedUserUid: record.recommendedUserUid,
      recommendedUserName: record.recommendedUserName,
      skillsTheyOffer: record.skillsTheyOffer,
      skillsTheyWant: record.skillsTheyWant,
      score: record.score,
    }));
  }

  // Main method with fallback chain
  async getSwapRecommendationsWithFallback(userUid: string, limit: number = 10): Promise<any[]> {
    // Try smart recommendations first
    let recommendations = await this.getSwapRecommendations(userUid, limit);
    
    if (recommendations.length > 0) {
      console.log(`Using smart recommendations for user ${userUid}: ${recommendations.length} results`);
      return recommendations;
    }
    
    // Fallback to most popular users
    recommendations = await this.getMostPopularUsers(userUid, limit);
    
    if (recommendations.length > 0) {
      console.log(`Using popular users fallback for user ${userUid}: ${recommendations.length} results`);
      return recommendations;
    }
    
    // Last resort: return any recently created users
    console.log(`Using recent users fallback for user ${userUid}`);
    return this.getRecentlyCreatedUsers(userUid, limit);
  }

  async getFallbackRecommendations(
    userUid: string,
    limit: number = 10,
    excludeUids: string[] = [],
  ): Promise<any[]> {
    if (limit <= 0) {
      return [];
    }

    const excludeSet = new Set<string>([userUid, ...excludeUids.filter(Boolean)]);
    const uniqueResults: any[] = [];

    const addUnique = (items: any[]) => {
      for (const item of items) {
        const recommendedUid = item?.recommendedUserUid;
        if (!recommendedUid || excludeSet.has(recommendedUid)) {
          continue;
        }
        uniqueResults.push(item);
        excludeSet.add(recommendedUid);
        if (uniqueResults.length >= limit) {
          break;
        }
      }
    };

    if (uniqueResults.length < limit) {
      const popular = await this.getMostPopularUsers(
        userUid,
        limit + excludeSet.size,
      );
      addUnique(popular);
    }

    if (uniqueResults.length < limit) {
      const recent = await this.getRecentlyCreatedUsers(
        userUid,
        limit + excludeSet.size,
      );
      addUnique(recent);
    }

    return uniqueResults.slice(0, limit);
  }

  // Get graph statistics
  async getGraphStatistics(): Promise<any> {
    const statsQuery = `
      MATCH (n)
      WITH labels(n) as labels, count(*) as count
      UNWIND labels as label
      WITH label, sum(count) as nodeCount
      
      MATCH ()-[r]->()
      WITH label, nodeCount, type(r) as relType, count(r) as relCount
      
      RETURN {
        nodes: collect({
          label: label,
          count: nodeCount
        }),
        relationships: collect({
          type: relType,
          count: relCount
        })
      } as stats
    `;

    const detailedStatsQuery = `
      // User stats
      MATCH (u:User)
      WITH count(u) as userCount
      
      // Skill stats
      MATCH (s:Skill)
      WITH userCount, count(s) as skillCount
      
      // OWNS relationships
      MATCH ()-[r:OWNS]->()
      WITH userCount, skillCount, count(r) as ownsCount
      
      // DESIRES relationships
      MATCH ()-[r:DESIRES]->()
      WITH userCount, skillCount, ownsCount, count(r) as desiresCount
      
      // RATES relationships
      MATCH ()-[r:RATES]->()
      WITH userCount, skillCount, ownsCount, desiresCount, count(r) as ratesCount
      
      // SWAPPED_WITH relationships
      MATCH ()-[r:SWAPPED_WITH]->()
      WITH userCount, skillCount, ownsCount, desiresCount, ratesCount, count(r) as swappedCount
      
      RETURN {
        users: userCount,
        skills: skillCount,
        relationships: {
          owns: ownsCount,
          desires: desiresCount,
          rates: ratesCount,
          swapped: swappedCount,
          total: ownsCount + desiresCount + ratesCount + swappedCount
        }
      } as stats
    `;

    const result = await this.neo4jService.runQuery(detailedStatsQuery);
    return result[0]?.stats || {};
  }
}

