'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CaptureRecord,
  RecordFilterOptions,
  PaginatedResult,
  CreateRecordDTO,
  UpdateRecordDTO,
  AppError,
  QuickStats,
  UserProfile,
  SystemAuditLog,
} from '@/types';
import { recordService } from '@/services/recordService';
import { userService, auditLogService } from '@/services/userService';

/**
 * Hook to retrieve a paginated and filtered list of records
 */
export function useRecords(options: RecordFilterOptions = {}) {
  const {
    searchTerm,
    category,
    status,
    priority,
    sortBy,
    page,
    pageSize,
    listingType,
    propertyCategory,
    minPrice,
    maxPrice,
    ownerUid,
  } = options;

  const [data, setData] = useState<PaginatedResult<CaptureRecord>>({
    items: [],
    totalCount: 0,
    page: page || 1,
    pageSize: pageSize || 5,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await recordService.listRecords({
        searchTerm,
        category,
        status,
        priority,
        sortBy,
        page,
        pageSize,
        listingType,
        propertyCategory,
        minPrice,
        maxPrice,
        ownerUid,
      });
      setData(result);
    } catch (err: unknown) {
      setError(
        (err as AppError) || {
          code: 'STORAGE_ERROR',
          message: 'Failed to retrieve records from local service.',
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, category, status, priority, sortBy, page, pageSize, listingType, propertyCategory, minPrice, maxPrice, ownerUid]);

  useEffect(() => {
    let ignore = false;
    recordService
      .listRecords({
        searchTerm,
        category,
        status,
        priority,
        sortBy,
        page,
        pageSize,
        listingType,
        propertyCategory,
        minPrice,
        maxPrice,
        ownerUid,
      })
      .then((result) => {
        if (!ignore) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            (err as AppError) || {
              code: 'STORAGE_ERROR',
              message: 'Failed to retrieve records from local service.',
            }
          );
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm, category, status, priority, sortBy, page, pageSize, listingType, propertyCategory, minPrice, maxPrice, ownerUid]);

  // Synchronize immediately whenever repository records change anywhere
  useEffect(() => {
    const handleUpdate = () => {
      fetchRecords();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pvg:records-updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pvg:records-updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [fetchRecords]);

  return {
    records: data.items,
    totalCount: data.totalCount,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
    hasNextPage: data.hasNextPage,
    hasPrevPage: data.hasPrevPage,
    isLoading,
    error,
    refetch: fetchRecords,
  };
}

/**
 * Hook to retrieve and mutate a single record by ID
 */
export function useRecord(id: string) {
  const [record, setRecord] = useState<CaptureRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await recordService.getRecord(id);
      if (!result) {
        setError({
          code: 'NOT_FOUND',
          message: `Record with ID "${id}" could not be located in local memory.`,
        });
      }
      setRecord(result);
    } catch (err: unknown) {
      setError(
        (err as AppError) || {
          code: 'STORAGE_ERROR',
          message: 'Failed to fetch record from service.',
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    recordService
      .getRecord(id)
      .then((result) => {
        if (!ignore) {
          if (!result) {
            setError({
              code: 'NOT_FOUND',
              message: `Record with ID "${id}" could not be located in local memory.`,
            });
          }
          setRecord(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            (err as AppError) || {
              code: 'STORAGE_ERROR',
              message: 'Failed to fetch record from service.',
            }
          );
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  // Synchronize immediately whenever repository records change anywhere
  useEffect(() => {
    const handleUpdate = () => {
      fetchRecord();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pvg:records-updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pvg:records-updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [fetchRecord]);

  const updateRecord = async (updates: UpdateRecordDTO) => {
    setIsMutating(true);
    try {
      const updated = await recordService.updateRecord(id, updates);
      setRecord(updated);
      return updated;
    } catch (err: unknown) {
      setError(err as AppError);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteRecord = async (): Promise<boolean> => {
    setIsMutating(true);
    try {
      const result = await recordService.deleteRecord(id);
      return result;
    } catch (err: unknown) {
      setError(err as AppError);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const approveRecord = async (supervisorNote?: string, reviewerName?: string) => {
    return updateRecord({
      status: 'verified',
      supervisorNote: supervisorNote || 'Certified all field metrology tolerances.',
      reviewerName: reviewerName || 'Field Supervisor (Demo)',
    });
  };

  const flagRecord = async (reasonNote: string, reviewerName?: string) => {
    return updateRecord({
      status: 'flagged',
      priority: 'urgent',
      supervisorNote: reasonNote,
      reviewerName: reviewerName || 'Safety Reviewer (Demo)',
    });
  };

  return {
    record,
    isLoading,
    isMutating,
    error,
    refetch: fetchRecord,
    updateRecord,
    deleteRecord,
    approveRecord,
    flagRecord,
  };
}

/**
 * Hook to create a new record
 */
export function useCreateRecord() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const createRecord = async (dto: CreateRecordDTO): Promise<CaptureRecord> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const newRecord = await recordService.createRecord(dto);
      return newRecord;
    } catch (err: unknown) {
      const appErr = err as AppError;
      setError(appErr);
      throw appErr;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createRecord,
    isSubmitting,
    error,
  };
}

/**
 * Hook to retrieve operational overview metrics
 */
export function useStats() {
  const [stats, setStats] = useState<QuickStats>({
    totalRecords: 0,
    pendingReview: 0,
    approvedToday: 0,
    flaggedItems: 0,
    systemHealth: 100,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await recordService.getQuickStats();
      setStats(result);
    } catch {
      // Use graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    recordService
      .getQuickStats()
      .then((result) => {
        if (!ignore) {
          setStats(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Synchronize KPIs immediately whenever repository records change anywhere
  useEffect(() => {
    const handleUpdate = () => {
      fetchStats();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pvg:records-updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pvg:records-updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
}

/**
 * Hook to manage users in administration
 */
export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await userService.listUsers();
      setUsers(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    userService
      .listUsers()
      .then((list) => {
        if (!ignore) {
          setUsers(list);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const inviteUser = async (user: Omit<UserProfile, 'uid' | 'createdAt' | 'lastActiveAt'>) => {
    const created = await userService.createUser(user);
    setUsers((prev) => [created, ...prev]);
    return created;
  };

  const modifyUser = async (uid: string, role: UserProfile['role'], status: UserProfile['status']) => {
    const updated = await userService.updateUserRole(uid, role, status);
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.uid === uid ? updated : u)));
    }
    return updated;
  };

  return { users, isLoading, inviteUser, modifyUser, refetch: fetchUsers };
}

/**
 * Hook to manage system audit logs
 */
export function useAuditLogs() {
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await auditLogService.listLogs();
      setLogs(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    auditLogService
      .listLogs()
      .then((list) => {
        if (!ignore) {
          setLogs(list);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { logs, isLoading, refetch: fetchLogs };
}
