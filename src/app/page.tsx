"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

/* ═══════════════════════════════════════════════════════════
   SVG Icons — no emoji, all inline SVG
   ═══════════════════════════════════════════════════════════ */

function Ic({ d, size = 20, cls = "", fill = false }: { d: string; size?: number; cls?: string; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={cls}>
      <path d={d} />
    </svg>
  );
}

const icons = {
  mic: "M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8",
  micOff: "M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .38-.03.75-.08 1.12M12 19v4M8 23h8",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  phoneOff: "M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67M1 1l22 22M4.22 4.22A19.86 19.86 0 0 0 2.12 4.18 2 2 0 0 0 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91",
  sun: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  search: "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};

const SunMoon = ({ dark, size = 18 }: { dark: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {dark ? (
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    ) : (
      <>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </>
    )}
  </svg>
);

const PhoneIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={icons.phone} />
  </svg>
);

const PhoneDownIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M23.71 16.67C20.66 13.78 16.54 12 12 12S3.34 13.78.29 16.67a1 1 0 0 0-.29.72 1 1 0 0 0 .31.72l2.83 2.83a1 1 0 0 0 1.41 0l2.83-2.83a1 1 0 0 0 0-1.41L5.9 15.22A9.94 9.94 0 0 1 12 13.5c2.25 0 4.33.66 6.1 1.72l-1.48 1.48a1 1 0 0 0 0 1.41l2.83 2.83a1 1 0 0 0 1.41 0l2.83-2.83a1 1 0 0 0 .31-.72 1 1 0 0 0-.29-.72z"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

const CATEGORIES = ["Random", "Music", "Gaming", "Tech", "Chill"];

const ICE = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type State = "idle" | "searching" | "incoming" | "calling" | "connected";

/* ═══════════════════════════════════════════════════════════
   Ringtone – Web Audio API beeps
   ═══════════════════════════════════════════════════════════ */

function useRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playRing = useCallback(() => {
    stopRing();
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const playBeep = () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.4);
      };

      playBeep();
      intervalRef.current = setInterval(playBeep, 1500);
    } catch {}
  }, []);

  const stopRing = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
  }, []);

  // cleanup on unmount
  useEffect(() => () => stopRing(), [stopRing]);

  return { playRing, stopRing };
}

/* ═══════════════════════════════════════════════════════════
   Wave visualizer
   ═══════════════════════════════════════════════════════════ */

function WaveBars({ active }: { active: boolean }) {
  const heights = [12, 20, 28, 20, 12];
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 3, height: 28 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 3,
          borderRadius: 2,
          background: "var(--accent)",
          opacity: active ? 0.8 : 0.15,
          height: active ? undefined : 4,
          animation: active ? `waveBar 0.6s ease-in-out ${i * 0.1}s infinite` : "none",
          ["--h" as string]: `${h}px`,
          transition: "opacity 0.3s",
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main App
   ═══════════════════════════════════════════════════════════ */

export default function Home() {
  const [dark, setDark] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [category, setCategory] = useState("Random");
  const [muted, setMuted] = useState(false);
  const [peerMuted, setPeerMuted] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [myName, setMyName] = useState("");
  const [peerName, setPeerName] = useState("");
  const [micAllowed, setMicAllowed] = useState(false);
  const [callEndMsg, setCallEndMsg] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const roomRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [peerSpeaking, setPeerSpeaking] = useState(false);

  const { playRing, stopRing } = useRingtone();

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Theme ── */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  /* ── Mic ── */
  async function requestMic() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = s;
      setMicAllowed(true);
      initSocket();
    } catch {
      alert("Microphone access is required for voice chat.");
    }
  }

  /* ── Socket ── */
  function initSocket() {
    if (socketRef.current?.connected) return;
    const s = io({ transports: ["websocket", "polling"] });
    socketRef.current = s;

    s.on("your_name", ({ name }: { name: string }) => setMyName(name));
    s.on("online_count", ({ count }: { count: number }) => setOnlineCount(count));
    s.on("searching", () => setState("searching"));

    s.on("incoming_call", ({ roomId, callerName }: { roomId: string; callerName: string }) => {
      roomRef.current = roomId;
      setPeerName(callerName);
      setState("incoming");
      playRing();
    });

    s.on("calling_peer", ({ roomId, peerName: pn }: { roomId: string; peerName: string }) => {
      roomRef.current = roomId;
      setPeerName(pn);
      setState("calling");
    });

    s.on("call_accepted", async ({ roomId, initiator }: { roomId: string; initiator: boolean }) => {
      stopRing();
      roomRef.current = roomId;
      setState("connected");
      startTimer();
      await setupPeer(initiator, roomId);
    });

    s.on("call_declined", () => {
      stopRing();
      setCallEndMsg("Call declined");
      setState("idle");
      roomRef.current = null;
      setTimeout(() => setCallEndMsg(""), 3000);
    });

    s.on("call_ended", ({ reason }: { reason: string }) => {
      stopRing();
      cleanupPeer();
      stopTimer();
      setCallEndMsg(reason);
      setState("idle");
      roomRef.current = null;
      setPeerMuted(false);
      setPeerSpeaking(false);
      setTimer(0);
      setTimeout(() => setCallEndMsg(""), 3000);
    });

    s.on("signal", async ({ data }: { data: RTCSessionDescriptionInit | { type: string; candidate: RTCIceCandidateInit } }) => {
      if (!pcRef.current) return;
      try {
        if ("candidate" in data && data.type === "ice-candidate") {
          const d = data as { type: string; candidate: RTCIceCandidateInit };
          if (d.candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(d.candidate));
        } else {
          const sdp = data as RTCSessionDescriptionInit;
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          if (sdp.type === "offer") {
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            s.emit("signal", { roomId: roomRef.current, data: pcRef.current.localDescription });
          }
        }
      } catch (e) { console.error("signal err", e); }
    });

    s.on("peer_mute_state", ({ muted: m }: { muted: boolean }) => setPeerMuted(m));
  }

  /* ── WebRTC ── */
  async function setupPeer(initiator: boolean, roomId: string) {
    cleanupPeer();
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;

    streamRef.current?.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("signal", { roomId, data: { type: "ice-candidate", candidate: e.candidate.toJSON() } });
      }
    };

    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
        audioRef.current.play().catch(() => {});
      }
      // peer volume detection
      try {
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(e.streams[0]);
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        src.connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        let last = false;
        const tick = () => {
          an.getByteFrequencyData(buf);
          const avg = buf.slice(0, 40).reduce((a, b) => a + b, 0) / 40;
          const sp = avg > 10;
          if (sp !== last) { last = sp; setPeerSpeaking(sp); }
          requestAnimationFrame(tick);
        };
        tick();
      } catch {}
    };

    if (initiator) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("signal", { roomId, data: pc.localDescription });
    }
  }

  function cleanupPeer() {
    pcRef.current?.close();
    pcRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setPeerSpeaking(false);
  }

  /* ── Timer ── */
  function startTimer() { stopTimer(); setTimer(0); timerRef.current = setInterval(() => setTimer((p) => p + 1), 1000); }
  function stopTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }

  /* ── Mute ── */
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
    socketRef.current?.emit("mute_state", { muted });
  }, [muted]);

  /* ── Local speaking detection ── */
  useEffect(() => {
    if (!streamRef.current) return;
    let frame: number;
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(streamRef.current);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      let last = false;
      const tick = () => {
        an.getByteFrequencyData(buf);
        const avg = buf.slice(0, 40).reduce((a, b) => a + b, 0) / 40;
        const sp = avg > 12;
        if (sp !== last) { last = sp; setLocalSpeaking(sp); }
        frame = requestAnimationFrame(tick);
      };
      tick();
      return () => cancelAnimationFrame(frame);
    } catch { return; }
  }, [micAllowed]);

  /* ── Actions ── */
  function handleFind() {
    socketRef.current?.emit("find_partner", { category: category.toLowerCase() });
  }

  function handleAccept() {
    stopRing();
    socketRef.current?.emit("accept_call", { roomId: roomRef.current });
  }

  function handleDecline() {
    stopRing();
    socketRef.current?.emit("decline_call", { roomId: roomRef.current });
    setState("idle");
    roomRef.current = null;
  }

  function handleEndCall() {
    socketRef.current?.emit("end_call");
    cleanupPeer();
    stopTimer();
    setTimer(0);
    setState("idle");
    roomRef.current = null;
    setPeerMuted(false);
    setPeerSpeaking(false);
  }

  function handleNext() {
    socketRef.current?.emit("end_call");
    cleanupPeer();
    stopTimer();
    setTimer(0);
    setPeerMuted(false);
    setPeerSpeaking(false);
    handleFind();
  }

  /* ── Cleanup ── */
  useEffect(() => () => {
    stopTimer();
    stopRing();
    cleanupPeer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
  }, []);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */

  // Mic permission screen
  if (!micAllowed) {
    return (
      <div data-theme={dark ? "dark" : "light"} style={{ background: "var(--bg)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s" }}>
        <div style={{
          background: "var(--card)", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)",
          borderRadius: 24, padding: "48px 40px", maxWidth: 380, width: "90%", textAlign: "center",
          animation: "fadeScale 0.4s ease",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
            background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ic d={icons.mic} size={30} cls="" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>Voice Access</h1>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 32 }}>
            Allow microphone to start anonymous voice calls. Nothing is recorded.
          </p>
          <button onClick={requestMic} style={{
            width: "100%", height: 48, borderRadius: 14, border: "none", cursor: "pointer",
            background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "transform 0.15s, opacity 0.15s",
          }}
          onMouseDown={(e) => { (e.target as HTMLElement).style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
          >
            <Ic d={icons.mic} size={16} />
            Allow Microphone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "background 0.3s", position: "relative", overflow: "hidden" }}>
      <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* ── Theme toggle — top right ── */}
      <button onClick={() => setDark((d) => !d)} style={{
        position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: 12,
        border: "1px solid var(--card-border)", background: "var(--card)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)",
        boxShadow: "var(--card-shadow)", transition: "all 0.2s", zIndex: 10,
      }}>
        <SunMoon dark={dark} size={16} />
      </button>

      {/* ── Online count — top left ── */}
      <div style={{
        position: "absolute", top: 20, left: 20, display: "flex", alignItems: "center", gap: 8,
        fontSize: 13, color: "var(--text-3)", zIndex: 10,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", boxShadow: `0 0 6px var(--green)` }} />
        {onlineCount} online
      </div>

      {/* ── End message toast ── */}
      {callEndMsg && (
        <div style={{
          position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 12,
          padding: "10px 20px", fontSize: 13, color: "var(--text-2)", boxShadow: "var(--card-shadow)",
          animation: "fadeUp 0.3s ease", zIndex: 20,
        }}>
          {callEndMsg}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MAIN CARD
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow)",
        borderRadius: 28, width: "min(92vw, 400px)", padding: "40px 32px",
        display: "flex", flexDirection: "column", alignItems: "center",
        animation: "fadeScale 0.4s ease", transition: "background 0.3s, border-color 0.3s",
        position: "relative", overflow: "hidden",
      }}>

        {/* ── IDLE ── */}
        {state === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeUp 0.3s ease" }}>
            {/* Question mark circle */}
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "var(--matte)", border: "2px solid var(--divider)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24, position: "relative",
            }}>
              <span style={{ fontSize: 40, fontWeight: 300, color: "var(--text-3)", fontFamily: "Georgia, serif" }}>?</span>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 4 }}>
              You are
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", marginBottom: 24 }}>
              {myName || "Anonymous"}
            </p>

            {/* Category pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 32 }}>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                  border: "1px solid",
                  borderColor: category === c ? "var(--accent)" : "var(--divider)",
                  background: category === c ? "var(--accent-bg)" : "transparent",
                  color: category === c ? "var(--accent)" : "var(--text-2)",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Call button */}
            <button onClick={handleFind} style={{
              width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "var(--green)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 20px ${dark ? "rgba(48,209,88,0.3)" : "rgba(52,199,89,0.35)"}`,
              transition: "transform 0.15s",
            }}
            onMouseDown={(e) => { (e.target as HTMLElement).style.transform = "scale(0.92)"; }}
            onMouseUp={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
            >
              <PhoneIcon size={28} />
            </button>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12 }}>Tap to find someone</p>
          </div>
        )}

        {/* ── SEARCHING ── */}
        {state === "searching" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeUp 0.3s ease" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "var(--matte)", border: "2px solid var(--divider)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24, position: "relative",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: "2px solid var(--accent)", borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }} />
            </div>

            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>Searching...</p>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 32 }}>
              Looking in {category}
            </p>

            {/* Bouncing dots */}
            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "var(--accent)",
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </div>

            <button onClick={handleEndCall} style={{
              padding: "10px 28px", borderRadius: 12, border: "1px solid var(--divider)",
              background: "transparent", color: "var(--text-2)", fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.2s",
            }}>
              Cancel
            </button>
          </div>
        )}

        {/* ── INCOMING CALL ── */}
        {state === "incoming" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeScale 0.3s ease" }}>
            {/* Pulsing avatar */}
            <div style={{ position: "relative", marginBottom: 24 }}>
              <div style={{
                position: "absolute", inset: -12, borderRadius: "50%",
                border: "2px solid var(--accent)", opacity: 0.3,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: -24, borderRadius: "50%",
                border: "1px solid var(--accent)", opacity: 0.15,
                animation: "pulse 1.5s ease-in-out 0.3s infinite",
              }} />
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: "var(--accent-bg)", border: "2px solid var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "shake 2s ease-in-out infinite",
              }}>
                <PhoneIcon size={36} />
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 4 }}>Incoming call from</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>{peerName}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 36 }}>wants to talk to you</p>

            {/* Accept / Decline */}
            <div style={{ display: "flex", gap: 24 }}>
              <button onClick={handleDecline} style={{
                width: 60, height: 60, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "var(--red)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px ${dark ? "rgba(255,69,58,0.3)" : "rgba(255,59,48,0.3)"}`,
                transition: "transform 0.15s",
              }}
              onMouseDown={(e) => { (e.currentTarget).style.transform = "scale(0.9)"; }}
              onMouseUp={(e) => { (e.currentTarget).style.transform = "scale(1)"; }}
              >
                <PhoneDownIcon size={22} />
              </button>

              <button onClick={handleAccept} style={{
                width: 60, height: 60, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "var(--green)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px ${dark ? "rgba(48,209,88,0.3)" : "rgba(52,199,89,0.3)"}`,
                transition: "transform 0.15s",
              }}
              onMouseDown={(e) => { (e.currentTarget).style.transform = "scale(0.9)"; }}
              onMouseUp={(e) => { (e.currentTarget).style.transform = "scale(1)"; }}
              >
                <PhoneIcon size={24} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 40, marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 500 }}>Decline</span>
              <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500 }}>Accept</span>
            </div>
          </div>
        )}

        {/* ── CALLING (waiting for accept) ── */}
        {state === "calling" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeUp 0.3s ease" }}>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <div style={{
                position: "absolute", inset: -10, borderRadius: "50%",
                animation: "callPulse 2s infinite",
              }} />
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: "var(--green-bg)", border: "2px solid var(--green)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PhoneIcon size={36} />
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 4 }}>Calling</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>{peerName}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 32 }}>ringing...</p>

            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--green)",
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </div>

            <button onClick={handleEndCall} style={{
              width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "var(--red)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${dark ? "rgba(255,69,58,0.3)" : "rgba(255,59,48,0.3)"}`,
            }}>
              <PhoneDownIcon size={20} />
            </button>
            <span style={{ fontSize: 11, color: "var(--red)", marginTop: 8 }}>Cancel</span>
          </div>
        )}

        {/* ── CONNECTED ── */}
        {state === "connected" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeUp 0.3s ease" }}>
            {/* Avatar circle with speaking ring */}
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: peerSpeaking ? "var(--green-bg)" : "var(--matte)",
              border: peerSpeaking ? "2px solid var(--green)" : "2px solid var(--divider)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16, transition: "all 0.3s",
              boxShadow: peerSpeaking ? `0 0 24px ${dark ? "rgba(48,209,88,0.15)" : "rgba(52,199,89,0.15)"}` : "none",
            }}>
              <WaveBars active={peerSpeaking && !peerMuted} />
            </div>

            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>{peerName}</p>
            <p style={{ fontSize: 28, fontWeight: 300, color: "var(--text-2)", marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
              {fmt(timer)}
            </p>
            {peerMuted && (
              <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 4 }}>muted</p>
            )}

            {/* Your mic indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 100,
              background: muted ? "var(--red-bg)" : (localSpeaking ? "var(--green-bg)" : "var(--matte)"),
              marginBottom: 36, transition: "all 0.2s",
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: muted ? "var(--red)" : "var(--green)",
              }} />
              <span style={{ fontSize: 11, color: muted ? "var(--red)" : "var(--text-2)" }}>
                {muted ? "You are muted" : "Your mic"}
              </span>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* Mute */}
              <button onClick={() => setMuted((m) => !m)} style={{
                width: 52, height: 52, borderRadius: "50%", border: "1px solid var(--divider)",
                background: muted ? "var(--red-bg)" : "var(--matte)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: muted ? "var(--red)" : "var(--text-2)", transition: "all 0.2s",
              }}>
                <Ic d={muted ? icons.micOff : icons.mic} size={20} />
              </button>

              {/* End call */}
              <button onClick={handleEndCall} style={{
                width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "var(--red)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 20px ${dark ? "rgba(255,69,58,0.3)" : "rgba(255,59,48,0.3)"}`,
                transition: "transform 0.15s",
              }}
              onMouseDown={(e) => { (e.currentTarget).style.transform = "scale(0.9)"; }}
              onMouseUp={(e) => { (e.currentTarget).style.transform = "scale(1)"; }}
              >
                <PhoneDownIcon size={24} />
              </button>

              {/* Next */}
              <button onClick={handleNext} style={{
                width: 52, height: 52, borderRadius: "50%", border: "1px solid var(--divider)",
                background: "var(--matte)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-2)", transition: "all 0.2s",
              }}>
                <Ic d={icons.search} size={20} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 28, marginTop: 10 }}>
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>{muted ? "Unmute" : "Mute"}</span>
              <span style={{ fontSize: 10, color: "var(--red)" }}>End</span>
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>Next</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom branding ── */}
      <p style={{ position: "absolute", bottom: 16, fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em" }}>
        VoiceAnon &middot; anonymous &middot; encrypted &middot; peer-to-peer
      </p>
    </div>
  );
}
