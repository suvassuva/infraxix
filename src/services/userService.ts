import { UserProfile, SystemAuditLog } from '@/types';
import { mockUsers, mockAuditLogs } from '@/data/mockData';

class UserService {
  private users: UserProfile[];

  constructor() {
    this.users = mockUsers.map((u) => ({
      uid: u.id,
      displayName: u.name,
      email: u.email,
      role: u.role,
      facility: 'Central Logistics Hub A',
      department: u.department,
      status: u.status,
      createdAt: '2026-01-15T08:00:00Z',
      lastActiveAt: u.lastActive,
      recordsCount: u.recordsCount,
    }));
  }

  public async listUsers(): Promise<UserProfile[]> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return [...this.users];
  }

  public async createUser(user: Omit<UserProfile, 'uid' | 'createdAt' | 'lastActiveAt'>): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const newUser: UserProfile = {
      ...user,
      uid: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastActiveAt: 'Just now',
      recordsCount: 0,
    };
    this.users.unshift(newUser);
    return { ...newUser };
  }

  public async updateUserRole(uid: string, role: UserProfile['role'], status: UserProfile['status']): Promise<UserProfile | null> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const user = this.users.find((u) => u.uid === uid);
    if (!user) return null;
    user.role = role;
    user.status = status;
    return { ...user };
  }
}

class AuditLogService {
  private logs: SystemAuditLog[];

  constructor() {
    this.logs = [...mockAuditLogs];
  }

  public async listLogs(): Promise<SystemAuditLog[]> {
    await new Promise((resolve) => setTimeout(resolve, 15));
    return [...this.logs];
  }

  public async recordEvent(event: Omit<SystemAuditLog, 'id' | 'timestamp'>): Promise<SystemAuditLog> {
    const newLog: SystemAuditLog = {
      ...event,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.logs.unshift(newLog);
    return newLog;
  }
}

export const userService = new UserService();
export const auditLogService = new AuditLogService();
