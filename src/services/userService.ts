import { UserProfile, SystemAuditLog } from '@/types';
import { getFirebaseFirestore } from '@/repositories/firebase/firebaseConfig';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getActiveDataSource } from '@/repositories';

class UserService {
  private inMemoryUsers: UserProfile[] = [];

  public async listUsers(): Promise<UserProfile[]> {
    if (getActiveDataSource() === 'firebase') {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const snap = await getDocs(collection(db, 'users'));
          return snap.docs.map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              displayName: data.displayName || 'Field Personnel',
              email: data.email || '',
              role: data.role || 'officer',
              facility: data.facility || 'Primary Facility',
              department: data.department || 'Field Operations',
              status: data.status || 'active',
              createdAt: data.createdAt || new Date().toISOString(),
              lastActiveAt: data.lastActiveAt || 'Recently active',
              recordsCount: data.recordsCount || 0,
            } as UserProfile;
          });
        }
      } catch (err) {
        console.warn('[UserService] Could not list users from Firestore, using local state:', err);
      }
    }

    return [...this.inMemoryUsers];
  }

  public async createUser(user: Omit<UserProfile, 'uid' | 'createdAt' | 'lastActiveAt'>): Promise<UserProfile> {
    const uid = `usr-${Date.now()}`;
    const newUser: UserProfile = {
      ...user,
      uid,
      createdAt: new Date().toISOString(),
      lastActiveAt: 'Just now',
      recordsCount: 0,
    };

    if (getActiveDataSource() === 'firebase') {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          await setDoc(doc(db, 'users', uid), newUser);
        }
      } catch (err) {
        console.warn('[UserService] Could not persist user to Firestore:', err);
      }
    }

    this.inMemoryUsers.unshift(newUser);
    return { ...newUser };
  }

  public async updateUserRole(uid: string, role: UserProfile['role'], status: UserProfile['status']): Promise<UserProfile | null> {
    if (getActiveDataSource() === 'firebase') {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          await updateDoc(doc(db, 'users', uid), { role, status });
        }
      } catch (err) {
        console.warn('[UserService] Could not update user in Firestore:', err);
      }
    }

    const user = this.inMemoryUsers.find((u) => u.uid === uid);
    if (user) {
      user.role = role;
      user.status = status;
      return { ...user };
    }

    return {
      uid,
      displayName: 'User',
      email: '',
      role,
      facility: 'Primary Facility',
      status,
      createdAt: new Date().toISOString(),
    };
  }
}

class AuditLogService {
  private inMemoryLogs: SystemAuditLog[] = [];

  public async listLogs(): Promise<SystemAuditLog[]> {
    if (getActiveDataSource() === 'firebase') {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const snap = await getDocs(collection(db, 'auditLogs'));
          if (!snap.empty) {
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SystemAuditLog));
          }
        }
      } catch {
        // Fall back to inMemoryLogs if collection does not exist yet
      }
    }

    return [...this.inMemoryLogs];
  }

  public async recordEvent(event: Omit<SystemAuditLog, 'id' | 'timestamp'>): Promise<SystemAuditLog> {
    const newLog: SystemAuditLog = {
      ...event,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    if (getActiveDataSource() === 'firebase') {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
        }
      } catch {
        // Non-blocking log persistence failure
      }
    }

    this.inMemoryLogs.unshift(newLog);
    return newLog;
  }
}

export const userService = new UserService();
export const auditLogService = new AuditLogService();
