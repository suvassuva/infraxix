// ==============================================================================
// Infraxix - Live Location Service
// Manages Field Officer Daily Duty & Real-Time GPS Location Broadcasting
// ==============================================================================

import { doc, setDoc, getDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore, isFirebaseConfigured, isMockDataSource } from '@/repositories/firebase/firebaseConfig';
import { geolocationService } from '@/services/geolocationService';
import { OfficerDutyLocation } from '@/types/gps';

const COLLECTION_NAME = 'officerLiveLocations';
const LOCAL_STORAGE_DUTY_KEY = 'infraxix_officer_duty_state';

class LiveLocationService {
  private watchId: number | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  private isLiveFirebase(): boolean {
    return isFirebaseConfigured() && !isMockDataSource();
  }

  /**
   * Helper to format today's date in YYYY-MM-DD local time
   */
  public getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper to construct a Google Maps location link
   */
  public buildGoogleMapsLink(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  /**
   * Starts daily duty and begins broadcasting live GPS location for the officer.
   */
  public async startDuty(officer: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }): Promise<OfficerDutyLocation> {
    // 1. Capture current high-accuracy GPS position
    const currentGps = await geolocationService.captureCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });

    const now = new Date().toISOString();
    const dutyDate = this.getTodayDateString();
    const mapsLink = this.buildGoogleMapsLink(currentGps.latitude, currentGps.longitude);

    const locationData: OfficerDutyLocation = {
      officerUid: officer.uid,
      officerName: officer.displayName || officer.email?.split('@')[0] || 'Field Officer',
      officerEmail: officer.email || '',
      isLive: true,
      status: 'on_duty',
      dutyDate,
      latitude: currentGps.latitude,
      longitude: currentGps.longitude,
      accuracyMeters: currentGps.accuracyMeters,
      altitudeMeters: currentGps.altitudeMeters,
      speed: currentGps.speed,
      heading: currentGps.heading,
      locationLink: mapsLink,
      startedAt: now,
      updatedAt: now,
    };

    // 2. Persist to Firestore or local storage
    await this.persistLocation(locationData);

    // 3. Start automated background tracking (pings every 45s)
    this.startBackgroundWatch(officer);

    return locationData;
  }

  /**
   * Manually refreshes or automatically updates current officer GPS position.
   */
  public async pingLocation(officer: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }): Promise<OfficerDutyLocation> {
    const currentGps = await geolocationService.captureCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
    });

    const existing = await this.getOfficerDutyStatus(officer.uid);
    const now = new Date().toISOString();
    const mapsLink = this.buildGoogleMapsLink(currentGps.latitude, currentGps.longitude);

    const updatedData: OfficerDutyLocation = {
      officerUid: officer.uid,
      officerName: officer.displayName || existing?.officerName || 'Field Officer',
      officerEmail: officer.email || existing?.officerEmail || '',
      isLive: true,
      status: 'on_duty',
      dutyDate: existing?.dutyDate || this.getTodayDateString(),
      latitude: currentGps.latitude,
      longitude: currentGps.longitude,
      accuracyMeters: currentGps.accuracyMeters,
      altitudeMeters: currentGps.altitudeMeters,
      speed: currentGps.speed,
      heading: currentGps.heading,
      locationLink: mapsLink,
      startedAt: existing?.startedAt || now,
      updatedAt: now,
    };

    await this.persistLocation(updatedData);
    return updatedData;
  }

  /**
   * Ends daily duty and stops broadcasting live location.
   */
  public async endDuty(officer: { uid: string }): Promise<void> {
    this.stopBackgroundWatch();

    const existing = await this.getOfficerDutyStatus(officer.uid);
    const now = new Date().toISOString();

    if (existing) {
      const offDutyData: OfficerDutyLocation = {
        ...existing,
        isLive: false,
        status: 'off_duty',
        updatedAt: now,
      };
      await this.persistLocation(offDutyData);
    }
  }

  /**
   * Persists the officer duty location payload.
   */
  private async persistLocation(data: OfficerDutyLocation): Promise<void> {
    // Save to Local Storage for offline backup and quick sync
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_DUTY_KEY}_${data.officerUid}`, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('infraxix:duty-location-updated', { detail: data }));
      } catch {
        // Fallback
      }
    }

    // Persist to Cloud Firestore if connected
    if (this.isLiveFirebase()) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const docRef = doc(db, COLLECTION_NAME, data.officerUid);
          await setDoc(docRef, data, { merge: true });
        }
      } catch (err) {
        console.warn('[LiveLocationService] Cloud sync notice:', err);
      }
    }
  }

  /**
   * Retrieves the current duty status of a specific officer.
   */
  public async getOfficerDutyStatus(officerUid: string): Promise<OfficerDutyLocation | null> {
    // 1. Check Cloud Firestore
    if (this.isLiveFirebase()) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const docRef = doc(db, COLLECTION_NAME, officerUid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            return snap.data() as OfficerDutyLocation;
          }
        }
      } catch (err) {
        console.warn('[LiveLocationService] getOfficerDutyStatus notice:', err);
      }
    }

    // 2. Check local storage fallback
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_DUTY_KEY}_${officerUid}`);
        if (raw) {
          return JSON.parse(raw) as OfficerDutyLocation;
        }
      } catch {
        // Fallback
      }
    }

    return null;
  }

  /**
   * Real-time subscription to an officer's duty status (used on Officer Hub).
   */
  public subscribeToOfficerDutyStatus(
    officerUid: string,
    callback: (status: OfficerDutyLocation | null) => void
  ): () => void {
    let unsubFirestore: (() => void) | null = null;

    if (this.isLiveFirebase()) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const docRef = doc(db, COLLECTION_NAME, officerUid);
          unsubFirestore = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              callback(snap.data() as OfficerDutyLocation);
            } else {
              callback(null);
            }
          });
        }
      } catch (err) {
        console.warn('[LiveLocationService] subscribeToOfficerDutyStatus error:', err);
      }
    }

    // Local event listener fallback
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent<OfficerDutyLocation>;
      if (customEvent.detail && customEvent.detail.officerUid === officerUid) {
        callback(customEvent.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('infraxix:duty-location-updated', handleLocal);
    }

    // Initial read
    this.getOfficerDutyStatus(officerUid).then((status) => {
      callback(status);
    });

    return () => {
      if (unsubFirestore) {
        unsubFirestore();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('infraxix:duty-location-updated', handleLocal);
      }
    };
  }

  /**
   * Real-time subscription to all active/recent officer locations (used on Admin Dashboard).
   */
  public subscribeToAllLiveOfficers(
    callback: (officers: OfficerDutyLocation[]) => void
  ): () => void {
    let unsubFirestore: (() => void) | null = null;

    if (this.isLiveFirebase()) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const colRef = collection(db, COLLECTION_NAME);
          unsubFirestore = onSnapshot(
            colRef,
            (snap) => {
              const list: OfficerDutyLocation[] = [];
              snap.forEach((d) => {
                list.push(d.data() as OfficerDutyLocation);
              });
              // Sort by most recently updated
              list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
              callback(list);
            },
            (err) => {
              console.warn('[LiveLocationService] subscribeToAllLiveOfficers error:', err);
            }
          );
        }
      } catch (err) {
        console.warn('[LiveLocationService] subscribeToAllLiveOfficers setup error:', err);
      }
    }

    // Local fallback collector
    const refreshFromLocal = () => {
      if (typeof window === 'undefined') return;
      const list: OfficerDutyLocation[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(LOCAL_STORAGE_DUTY_KEY)) {
            const val = localStorage.getItem(key);
            if (val) {
              list.push(JSON.parse(val));
            }
          }
        }
      } catch {
        // Ignore
      }
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      callback(list);
    };

    const handleLocal = () => refreshFromLocal();

    if (typeof window !== 'undefined') {
      window.addEventListener('infraxix:duty-location-updated', handleLocal);
      window.addEventListener('storage', handleLocal);
    }

    refreshFromLocal();

    return () => {
      if (unsubFirestore) {
        unsubFirestore();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('infraxix:duty-location-updated', handleLocal);
        window.removeEventListener('storage', handleLocal);
      }
    };
  }

  /**
   * Starts periodic GPS pings (every 45s) when on active duty.
   */
  private startBackgroundWatch(officer: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  }) {
    this.stopBackgroundWatch();

    // Periodic interval ping
    this.intervalTimer = setInterval(async () => {
      try {
        await this.pingLocation(officer);
      } catch (err) {
        console.warn('[LiveLocationService] Periodic GPS ping notice:', err);
      }
    }, 45000);

    // Watch position if supported
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        this.watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            try {
              const now = new Date().toISOString();
              const updatedData: OfficerDutyLocation = {
                officerUid: officer.uid,
                officerName: officer.displayName || 'Field Officer',
                officerEmail: officer.email || '',
                isLive: true,
                status: 'on_duty',
                dutyDate: this.getTodayDateString(),
                latitude: Number(pos.coords.latitude.toFixed(6)),
                longitude: Number(pos.coords.longitude.toFixed(6)),
                accuracyMeters: Number(pos.coords.accuracy.toFixed(1)),
                altitudeMeters: pos.coords.altitude != null ? Number(pos.coords.altitude.toFixed(1)) : null,
                speed: pos.coords.speed != null ? Number(pos.coords.speed.toFixed(2)) : null,
                heading: pos.coords.heading != null ? Number(pos.coords.heading.toFixed(1)) : null,
                locationLink: this.buildGoogleMapsLink(pos.coords.latitude, pos.coords.longitude),
                startedAt: now,
                updatedAt: now,
              };
              await this.persistLocation(updatedData);
            } catch {
              // Ignore
            }
          },
          (err) => {
            console.warn('[LiveLocationService] watchPosition error:', err);
          },
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
        );
      } catch (err) {
        console.warn('[LiveLocationService] watchPosition setup notice:', err);
      }
    }
  }

  /**
   * Stops periodic GPS tracking.
   */
  private stopBackgroundWatch() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

export const liveLocationService = new LiveLocationService();
