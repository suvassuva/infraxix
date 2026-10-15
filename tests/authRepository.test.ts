import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockAuthRepository, DEMO_MOCK_USERS } from '../src/repositories/MockAuthRepository';

describe('MockAuthRepository Unit & Contract Tests', () => {
  let authRepo: MockAuthRepository;

  beforeEach(() => {
    // Isolated instance starting with clean officer session
    authRepo = new MockAuthRepository(null);
  });

  it('should initialize with default demo officer if null passed', async () => {
    const user = await authRepo.getCurrentUser();
    assert.ok(user);
    assert.strictEqual(user?.role, 'officer');
    assert.strictEqual(user?.isMock, true);
    assert.strictEqual(user?.provider, 'mock');
  });

  it('should log in using predefined credentials and mark user as mock', async () => {
    const user = await authRepo.login({
      email: 'supervisor.dana@pvg-ops.local',
      password: 'any-password',
    });

    assert.strictEqual(user.email, 'supervisor.dana@pvg-ops.local');
    assert.strictEqual(user.role, 'supervisor');
    assert.strictEqual(user.displayName, 'Chief Inspector Dana');
    assert.strictEqual(user.isMock, true);
    assert.strictEqual(user.provider, 'mock');

    const current = await authRepo.getCurrentUser();
    assert.strictEqual(current?.email, 'supervisor.dana@pvg-ops.local');
  });

  it('should support instant role-based login (loginWithRole)', async () => {
    const adminUser = await authRepo.loginWithRole('admin');
    assert.strictEqual(adminUser.role, 'admin');
    assert.strictEqual(adminUser.email, DEMO_MOCK_USERS.admin.email);
    assert.strictEqual(adminUser.isMock, true);

    const isAuthed = await authRepo.isAuthenticated();
    assert.strictEqual(isAuthed, true);
  });

  it('should register a new mock user profile', async () => {
    const newUser = await authRepo.register({
      displayName: 'Specialist Elena Rostova',
      email: 'e.rostova@pvg-ops.local',
      role: 'officer',
      facility: 'Chemical Depot West',
    });

    assert.ok(newUser.uid.startsWith('mock-usr-'));
    assert.strictEqual(newUser.displayName, 'Specialist Elena Rostova');
    assert.strictEqual(newUser.role, 'officer');
    assert.strictEqual(newUser.facility, 'Chemical Depot West');
    assert.strictEqual(newUser.isMock, true);

    const current = await authRepo.getCurrentUser();
    assert.strictEqual(current?.email, 'e.rostova@pvg-ops.local');
  });

  it('should log out and clear active session', async () => {
    await authRepo.loginWithRole('officer');
    assert.strictEqual(await authRepo.isAuthenticated(), true);

    await authRepo.logout();
    assert.strictEqual(await authRepo.isAuthenticated(), false);

    const user = await authRepo.getCurrentUser();
    assert.strictEqual(user, null);
  });

  it('should notify subscriber when auth state changes', async () => {
    const stateHistory: (string | null)[] = [];

    const unsubscribe = authRepo.onAuthStateChanged((user) => {
      stateHistory.push(user ? user.role : null);
    });

    await authRepo.loginWithRole('supervisor');
    await authRepo.loginWithRole('admin');
    await authRepo.logout();

    unsubscribe();
    await authRepo.loginWithRole('officer'); // Should not record after unsubscribe

    assert.ok(stateHistory.includes('supervisor'));
    assert.ok(stateHistory.includes('admin'));
    assert.ok(stateHistory.includes(null));
    // Verify unsubscribe stopped tracking
    assert.strictEqual(stateHistory[stateHistory.length - 1], null);
  });

  it('should return all available demo users via getDemoUsers', () => {
    const demoUsers = authRepo.getDemoUsers();
    assert.strictEqual(demoUsers.length, 3);
    const roles = demoUsers.map((u) => u.role);
    assert.ok(roles.includes('officer'));
    assert.ok(roles.includes('supervisor'));
    assert.ok(roles.includes('admin'));
  });
});
