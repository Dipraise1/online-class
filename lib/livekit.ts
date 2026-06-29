import "server-only";
import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const WS_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://127.0.0.1:7880";

// RoomService needs an http(s) URL; the client uses the ws(s) URL.
export const LIVEKIT_HTTP_URL = WS_URL.replace(/^ws/, "http");
export const LIVEKIT_WS_URL = WS_URL;

export function roomNameFor(sessionId: string) {
  return `class-${sessionId}`;
}

export async function createAccessToken(opts: {
  identity: string;
  name: string;
  room: string;
  role: "host" | "student";
}) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: opts.identity,
    name: opts.name,
    metadata: JSON.stringify({ role: opts.role }),
  });
  at.addGrant({
    roomJoin: true,
    room: opts.room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true, // lets students raise hand via attributes
  });
  return at.toJwt();
}

export function roomService() {
  return new RoomServiceClient(LIVEKIT_HTTP_URL, API_KEY, API_SECRET);
}

// Force-mute a participant's microphone (host power).
export async function muteParticipantMic(room: string, identity: string) {
  const svc = roomService();
  const p = await svc.getParticipant(room, identity);
  const mic = p.tracks.find((t) => t.source === TrackSource.MICROPHONE);
  if (mic) await svc.mutePublishedTrack(room, identity, mic.sid, true);
}
