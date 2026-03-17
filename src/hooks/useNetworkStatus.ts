/**
 * Hook that monitors network connectivity in real time.
 *
 * Uses @react-native-community/netinfo (already installed) to subscribe
 * to connectivity changes and exposes a simple { isOnline, connectionType }
 * state.
 */

import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoStateType } from '@react-native-community/netinfo';

// ── Types ──────────────────────────────────────────────────────────────

export interface NetworkStatus {
  /** Whether the device currently has an active internet connection. */
  isOnline: boolean;
  /** Connection type string (e.g. "wifi", "cellular") or null if unknown. */
  connectionType: string | null;
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus({
        isOnline: state.isConnected ?? false,
        connectionType: state.type ?? null,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
