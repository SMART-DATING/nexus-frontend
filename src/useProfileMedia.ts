import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Profile } from "./api";

// Renew only media, never replace public fields with a private /me response.
export function useProfileMedia(profile: Profile) {
  const signature = JSON.stringify([
    profile.userId,
    profile.avatarUrl,
    profile.photos,
    profile.photoCount,
    profile.photoAllowance,
  ]);
  const [renewed, setRenewed] = useState<{
    signature: string;
    profile: Profile;
  }>();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const attempted = useRef(new Set<string>());
  const active = useRef(signature);
  const pending = useRef(false);
  const mounted = useRef(false);
  active.current = signature;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    attempted.current.clear();
    setFailed([]);
  }, [signature]);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    const token = sessionStorage.getItem("nexus-token");
    const source = signature;
    pending.current = true;
    setLoading(true);
    try {
      const next = await api<Profile>(`/profiles/${profile.userId}`);
      if (
        mounted.current &&
        active.current === source &&
        token === sessionStorage.getItem("nexus-token")
      ) {
        setRenewed({ signature: source, profile: next });
        setFailed([]);
      }
    } catch {
      // Preserve the last card and offer an explicit retry if renewal fails.
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [signature, profile.userId]);
  const onError = useCallback(
    (url: string) => {
      setFailed((old) => (old.includes(url) ? old : [...old, url]));
      if (!attempted.current.has(url)) {
        attempted.current.add(url);
        void refresh();
      }
    },
    [refresh],
  );
  useEffect(() => {
    let last = Date.now();
    const renew = () => {
      if (
        document.visibilityState === "visible" &&
        sessionStorage.getItem("nexus-token") &&
        Date.now() - last >= 12 * 60 * 1000
      ) {
        last = Date.now();
        void refresh();
      }
    };
    const timer = setInterval(renew, 60 * 1000);
    window.addEventListener("focus", renew);
    document.addEventListener("visibilitychange", renew);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", renew);
      document.removeEventListener("visibilitychange", renew);
    };
  }, [refresh]);
  const media = renewed?.signature === signature ? renewed.profile : profile;
  return {
    profile: {
      ...profile,
      avatarUrl: media.avatarUrl,
      photos: media.photos,
      photoCount: media.photoCount,
      photoAllowance: media.photoAllowance,
    },
    loading,
    failed,
    onError,
    refresh,
  };
}
