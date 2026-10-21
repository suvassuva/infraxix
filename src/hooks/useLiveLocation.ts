'use client';

// ==============================================================================
// Infraxix - useLiveLocation Hook
// Reactive hook for Field Officer daily duty location broadcast & Admin radar
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { liveLocationService } from '@/services/liveLocationService';
import { OfficerDutyLocation } from '@/types/gps';
import { useAuth } from '@/hooks/useAuth';

export function useOfficerLiveLocation() {
  const { user } = useAuth();
  const [dutyStatus, setDutyStatus] = useState<OfficerDutyLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'officer') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = liveLocationService.subscribeToOfficerDutyStatus(
      user.uid,
      (status) => {
        setDutyStatus(status);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, user?.role]);

  const startDuty = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    setError(null);
    try {
      const status = await liveLocationService.startDuty({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      setDutyStatus(status);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to acquire GPS fix and start duty.';
      setError(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  const pingNow = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    setError(null);
    try {
      const status = await liveLocationService.pingLocation({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      setDutyStatus(status);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update GPS telemetry.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  const endDuty = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    setError(null);
    try {
      await liveLocationService.endDuty({ uid: user.uid });
      setDutyStatus((prev) => (prev ? { ...prev, isLive: false, status: 'off_duty' } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to stop duty broadcast.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  return {
    dutyStatus,
    isBroadcasting: dutyStatus?.isLive ?? false,
    isOnDuty: dutyStatus?.status === 'on_duty' && dutyStatus?.isLive,
    isLoading,
    actionLoading,
    error,
    startDuty,
    pingNow,
    endDuty,
    clearError: () => setError(null),
  };
}

export function useAdminLiveRadar() {
  const [officers, setOfficers] = useState<OfficerDutyLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = liveLocationService.subscribeToAllLiveOfficers((list) => {
      setOfficers(list);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const liveOfficers = officers.filter((o) => o.isLive && o.status === 'on_duty');

  return {
    officers,
    liveOfficers,
    totalOfficers: officers.length,
    activeCount: liveOfficers.length,
    isLoading,
  };
}
