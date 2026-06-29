"use client";

import "@livekit/components-styles";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Track, type Participant } from "livekit-client";
import type { TrackReference, TrackReferenceOrPlaceholder } from "@livekit/components-core";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useDataChannel,
} from "@livekit/components-react";

type Role = "host" | "student";

function meta(p: { metadata?: string }): { role?: string; matric?: string } {
  try {
    return p.metadata ? JSON.parse(p.metadata) : {};
  } catch {
    return {};
  }
}
function isHost(p: { metadata?: string }) {
  return meta(p).role === "host";
}

// "abc" feature: integrity signals — flags a student who is on multiple screens
// or who leaves the class screen (switches tab / loses focus). Published as
// LiveKit attributes so the lecturer sees it live.
function useAbcProctor(
  enabled: boolean,
  lp: { attributes?: Record<string, string>; setAttributes: (a: Record<string, string>) => Promise<void> }
) {
  const leaves = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const patch = (partial: Record<string, string>) =>
      lp.setAttributes({ ...(lp.attributes || {}), ...partial }).catch(() => {});
    const checkScreens = () => {
      const ext = typeof window !== "undefined" && !!(window.screen as unknown as { isExtended?: boolean })?.isExtended;
      patch({ screens: ext ? "multi" : "single" });
    };
    const onVis = () => {
      if (document.hidden) {
        leaves.current += 1;
        patch({ away: "1", leaves: String(leaves.current) });
      } else patch({ away: "" });
    };
    const onBlur = () => patch({ away: "1" });
    const onFocus = () => patch({ away: "" });

    checkScreens();
    patch({ away: "", leaves: "0" });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    const screenObj = window.screen as unknown as { addEventListener?: (e: string, c: () => void) => void; removeEventListener?: (e: string, c: () => void) => void };
    screenObj.addEventListener?.("change", checkScreens);
    const iv = setInterval(checkScreens, 10000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      screenObj.removeEventListener?.("change", checkScreens);
      clearInterval(iv);
    };
  }, [enabled, lp]);
}

export default function Classroom({
  sessionId,
  backHref,
}: {
  sessionId: string;
  backHref: string;
}) {
  const router = useRouter();
  const [conn, setConn] = useState<{ token: string; url: string; role: Role } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/livekit/token?session=${sessionId}`)
      .then((r) => r.json())
      .then((d) => (d.token ? setConn(d) : setError(d.error || "Could not join")))
      .catch(() => setError("Could not connect"));
  }, [sessionId]);

  if (error)
    return (
      <Center>
        <p className="font-display text-xl">{error}</p>
        <button onClick={() => router.push(backHref)} className="btn btn-gold mt-4">Back to course</button>
      </Center>
    );
  if (!conn) return <Center><p className="font-display text-xl text-paper/80">Joining the classroom…</p></Center>;

  const isTeacher = conn.role === "host";
  return (
    <LiveKitRoom
      serverUrl={conn.url}
      token={conn.token}
      connect
      audio={isTeacher}
      video={isTeacher}
      onDisconnected={() => router.push(backHref)}
      className="h-full"
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      <Stage sessionId={sessionId} role={conn.role} />
    </LiveKitRoom>
  );
}

function Stage({ sessionId, role }: { sessionId: string; role: Role }) {
  const isTeacher = role === "host";
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  useAbcProctor(!isTeacher, localParticipant);

  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );

  const screen = tracks.find((t) => t.source === Track.Source.ScreenShare && t.publication);
  const hostCam = tracks.find((t) => t.source === Track.Source.Camera && isHost(t.participant));
  const main: TrackReference | undefined = (screen as TrackReference) || (hostCam as TrackReference);
  const cameras = tracks.filter((t) => t.source === Track.Source.Camera);

  // ---- attendance via data channel ----
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [attendanceLiveHost, setAttendanceLiveHost] = useState(false);
  const [marked, setMarked] = useState(false);
  const { send } = useDataChannel("attendance", (msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (!isTeacher && data.action === "open") setAttendanceModal(true);
      if (!isTeacher && data.action === "close") setAttendanceModal(false);
    } catch {}
  });

  const broadcast = useCallback(
    (action: "open" | "close") => send(new TextEncoder().encode(JSON.stringify({ action })), { reliable: true }),
    [send]
  );

  const passAttendance = () => { setAttendanceLiveHost(true); broadcast("open"); };
  const stopAttendance = () => { setAttendanceLiveHost(false); broadcast("close"); };

  const markPresent = async () => {
    await fetch("/api/livekit/attend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session: sessionId }),
    });
    const attrs = { ...(localParticipant.attributes || {}), present: "1" };
    await localParticipant.setAttributes(attrs);
    setMarked(true); // modal stays, shows confirmation; clears when host ends attendance
  };

  // ---- raise hand via attributes ----
  const myHand = localParticipant.attributes?.hand === "1";
  const toggleHand = async () => {
    const attrs = { ...(localParticipant.attributes || {}), hand: myHand ? "" : "1" };
    await localParticipant.setAttributes(attrs);
  };

  const raisedHands = participants.filter((p) => !isHost(p) && p.attributes?.hand === "1");
  const presentCount = participants.filter((p) => !isHost(p) && p.attributes?.present === "1").length;
  const studentCount = participants.filter((p) => !isHost(p)).length;
  const multiScreen = participants.filter((p) => !isHost(p) && p.attributes?.screens === "multi");
  const awayStudents = participants.filter((p) => !isHost(p) && p.attributes?.away === "1");

  const muteOne = (identity: string) =>
    fetch("/api/livekit/mute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session: sessionId, identity }),
    });
  const muteAll = () =>
    fetch("/api/livekit/mute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session: sessionId, all: true }),
    });

  return (
    <div className="flex h-full min-h-0 flex-1 gap-3 p-3">
      {/* main stage + controls */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex-1 overflow-hidden rounded-xl bg-black">
          {main?.publication ? (
            <VideoTrack trackRef={main} className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-center text-paper/50">
              <div>
                <p className="font-display text-2xl">{isTeacher ? "You're live" : "Waiting for the lecturer's video"}</p>
                <p className="mt-1 text-sm">{isTeacher ? "Turn on your camera or share your screen." : ""}</p>
              </div>
            </div>
          )}
          {screen && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-pine-900">
              ● Sharing screen
            </span>
          )}
        </div>

        {/* control bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-pine-900/60 p-2">
          <Ctrl onClick={() => localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)}
            active={localParticipant.isMicrophoneEnabled}>
            {localParticipant.isMicrophoneEnabled ? "🎙 Mic on" : "🔇 Mic off"}
          </Ctrl>
          <Ctrl onClick={() => localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)}
            active={localParticipant.isCameraEnabled}>
            {localParticipant.isCameraEnabled ? "📹 Cam on" : "📷 Cam off"}
          </Ctrl>

          {isTeacher ? (
            <>
              <Ctrl onClick={() => localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled)}
                active={localParticipant.isScreenShareEnabled}>
                🖥 {localParticipant.isScreenShareEnabled ? "Stop share" : "Share screen / doc"}
              </Ctrl>
              <Ctrl onClick={muteAll}>🔇 Mute all</Ctrl>
              {attendanceLiveHost ? (
                <Ctrl onClick={stopAttendance} active>📋 Stop attendance · {presentCount}/{studentCount}</Ctrl>
              ) : (
                <Ctrl onClick={passAttendance} gold>📋 Pass attendance</Ctrl>
              )}
            </>
          ) : (
            <Ctrl onClick={toggleHand} gold={!myHand} active={myHand}>
              {myHand ? "✋ Lower hand" : "✋ Raise hand"}
            </Ctrl>
          )}

          <div className="ml-auto" />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-paper/80">
            {studentCount} student{studentCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* right rail: participants */}
      <aside className="hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto rounded-xl bg-pine-900/60 p-2 lg:flex">
        <p className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-paper/50">
          In the room ({participants.length})
        </p>
        {isTeacher && raisedHands.length > 0 && (
          <div className="rounded-lg bg-gold/15 p-2 text-xs text-gold">
            ✋ {raisedHands.map((p) => p.name || "Student").join(", ")}
          </div>
        )}
        {isTeacher && (multiScreen.length > 0 || awayStudents.length > 0) && (
          <div className="rounded-lg bg-rust/15 p-2 text-xs text-rust">
            ⚠ Integrity
            {multiScreen.length > 0 && <div>🖥 {multiScreen.length} on multiple screens</div>}
            {awayStudents.length > 0 && <div>👀 {awayStudents.length} away from screen</div>}
          </div>
        )}
        {participants.map((p) => (
          <PersonTile
            key={p.identity}
            p={p}
            camTrack={cameras.find((t) => t.participant.identity === p.identity)}
            canMute={isTeacher && !isHost(p)}
            showDetails={isTeacher && !isHost(p)}
            onMute={() => muteOne(p.identity)}
          />
        ))}
      </aside>

      {/* student attendance pop-up */}
      {!isTeacher && attendanceModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="card max-w-sm p-6 text-center">
            <p className="eyebrow">Attendance</p>
            <h3 className="mt-2 font-display text-2xl font-semibold">Your lecturer is taking attendance</h3>
            <p className="mt-2 text-sm text-ink-soft">Tap below to be marked present for this class.</p>
            {marked ? (
              <p className="mt-5 chip status-open mx-auto">✓ You&apos;re marked present</p>
            ) : (
              <button onClick={markPresent} className="btn btn-gold mt-5 w-full py-2.5">I&apos;m present ✋</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonTile({
  p, camTrack, canMute, showDetails, onMute,
}: {
  p: Participant;
  camTrack?: TrackReferenceOrPlaceholder;
  canMute: boolean;
  showDetails?: boolean;
  onMute: () => void;
}) {
  const host = isHost(p);
  const matric = meta(p).matric;
  const multi = p.attributes?.screens === "multi";
  const away = p.attributes?.away === "1";
  const leaves = Number(p.attributes?.leaves || "0");
  return (
    <div className={`relative overflow-hidden rounded-lg bg-black/40 ${away ? "ring-1 ring-rust/60" : ""}`}>
      <div className="aspect-video">
        {camTrack?.publication ? (
          <VideoTrack trackRef={camTrack as TrackReference} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-pine font-display font-semibold text-paper">
              {(p.name || "?").slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 px-2 py-1 text-xs text-paper">
        <span className="flex items-center gap-1 truncate">
          {p.attributes?.hand === "1" && <span>✋</span>}
          {!p.isMicrophoneEnabled && <span className="text-paper/50">🔇</span>}
          <span className="truncate">{p.name || "Guest"}{host ? " · host" : ""}</span>
        </span>
        {canMute && p.isMicrophoneEnabled && (
          <button onClick={onMute} className="rounded bg-white/10 px-1.5 py-0.5 hover:bg-white/20">mute</button>
        )}
      </div>
      {showDetails && (
        <div className="flex flex-wrap items-center gap-1 px-2 pb-1.5 text-[0.62rem]">
          {matric && <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-paper/80">{matric}</span>}
          {multi && <span className="rounded bg-rust/25 px-1.5 py-0.5 text-paper">🖥 multi-screen</span>}
          {away && <span className="rounded bg-rust/25 px-1.5 py-0.5 text-paper">👀 away</span>}
          {leaves > 0 && <span className="rounded bg-white/10 px-1.5 py-0.5 text-paper/70">left {leaves}×</span>}
        </div>
      )}
    </div>
  );
}

function Ctrl({
  children, onClick, active, gold,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  gold?: boolean;
}) {
  const base = "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const cls = gold
    ? "bg-gold text-pine-900 hover:brightness-105"
    : active
      ? "bg-pine text-paper"
      : "bg-white/10 text-paper hover:bg-white/20";
  return <button onClick={onClick} className={`${base} ${cls}`}>{children}</button>;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full place-items-center bg-pine-900 px-6 text-center text-paper">{<div>{children}</div>}</div>;
}
