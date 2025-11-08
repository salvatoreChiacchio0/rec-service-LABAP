import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface UserDto {
  uid: string;
  username: string;
  email: string;
  profilePicture?: string;
  skillDesired?: string[];
  skillOffered?: string[];
  version?: number;
  creationTime?: string;
  lastUpdate?: string;
  [key: string]: any;
}

export interface SkillOfferedDto {
  id: number;
  userUid: string;
  skill: {
    id: number;
    label: string;
    description?: string;
    metadata?: Record<string, string>;
    version?: number;
    creationTime?: string;
    lastUpdate?: string;
  };
  version?: number;
  creationTime?: string;
  lastUpdate?: string;
  [key: string]: any;
}

export interface SkillDesiredDto {
  id: number;
  userUid: string;
  skill: {
    id: number;
    label: string;
    description?: string;
    metadata?: Record<string, string>;
    version?: number;
    creationTime?: string;
    lastUpdate?: string;
  };
  version?: number;
  creationTime?: string;
  lastUpdate?: string;
  [key: string]: any;
}

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    // URL del backend swapit-be (include già il context path /SwapItBe)
    // In Docker usa il nome del servizio: http://swapit-be:8080/SwapItBe
    // In locale: http://localhost:8080/SwapItBe
    this.baseUrl = process.env.SWAPIT_BE_URL || 'http://swapit-be:8080/SwapItBe';
    this.logger.log(`Backend URL: ${this.baseUrl}`);
  }

  async getUserByUid(userUid: string): Promise<UserDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<UserDto>(`${this.baseUrl}/api/users/${userUid}`),
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn(`User ${userUid} not found`);
        return null;
      }
      this.logger.error(`Error fetching user ${userUid}:`, error.message);
      return null;
    }
  }

  async getUsersByUids(userUids: string[]): Promise<Map<string, UserDto>> {
    const usersMap = new Map<string, UserDto>();
    
    // Fetch users in parallel
    const promises = userUids.map(async (uid) => {
      const user = await this.getUserByUid(uid);
      if (user) {
        usersMap.set(uid, user);
      }
    });

    await Promise.all(promises);
    return usersMap;
  }

  async getAllUsers(): Promise<UserDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<UserDto[]>(`${this.baseUrl}/api/users`),
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.error('Error fetching users list:', error.message);
      return [];
    }
  }

  async getSkillsOfferedByUser(userUid: string): Promise<SkillOfferedDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SkillOfferedDto[]>(
          `${this.baseUrl}/api/skills/offered/user/${userUid}`,
        ),
      );
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn(`Skills offered by user ${userUid} not found`);
        return [];
      }
      this.logger.error(
        `Error fetching skills offered by user ${userUid}:`,
        error.message,
      );
      return [];
    }
  }

  async getSkillsDesiredByUser(userUid: string): Promise<SkillDesiredDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SkillDesiredDto[]>(
          `${this.baseUrl}/api/skills/desired/user/${userUid}`,
        ),
      );
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn(`Skills desired by user ${userUid} not found`);
        return [];
      }
      this.logger.error(
        `Error fetching skills desired by user ${userUid}:`,
        error.message,
      );
      return [];
    }
  }
}

