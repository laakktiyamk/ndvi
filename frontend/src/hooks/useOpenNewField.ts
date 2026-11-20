import { useCallback, useState } from 'react';
import { getCdseStatus } from '../services/authService';

/**
 * Checks that the user has CDSE credentials connected before opening the
 * New field dialog. If the status check itself fails, the dialog opens
 * anyway: the backend enforces the requirement, this is only a convenience.
 */
export function useOpenNewField(onOpen: () => void) {
  const [checking, setChecking] = useState(false);
  const [notConnected, setNotConnected] = useState(false);

  const tryOpen = useCallback(async () => {
    setChecking(true);
    let connected = true;
    try {
      const res = await getCdseStatus();
      connected = res.data.connected;
    } catch {
      // status unknown: do not block the user
    } finally {
      setChecking(false);
    }

    if (connected) onOpen();
    else setNotConnected(true);
  }, [onOpen]);

  const dismiss = useCallback(() => setNotConnected(false), []);

  return { tryOpen, checking, notConnected, dismiss };
}