"use client";

import { useEffect, useRef, useState, useCallback, type CSSProperties } from "react";
import { io, Socket } from "socket.io-client";

/* ═══════════════════════════════════════════════════════════
   ICONS — pure SVG, zero emoji
   ═══════════════════════════════════════════════════════════ */

const I = ({ children, size = 20, cls = "" }: { children: React.ReactNode; size?: number; cls?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={cls}
    style={{ flexShrink: 0 }}>
    {children}
  </svg>
);

const MicSvg = ({ size = 20, cls = "" }: { size?: number; cls?: string }) => (
  <I size={size} cls={cls}>
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </I>
);

const MicOffSvg = ({ size = 20, cls = "" }: { size?: number; cls?: string }) => (
  <I size={size} cls={cls}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .38-.03.75-.08 1.12" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </I>
);

const PhoneSvg = ({ size = 24, cls = "" }: { size?: number; cls?: string }) => (
  <I size={size} cls={cls}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </I>
);

const EndCallSvg = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M23.71 16.67C20.66 13.78 16.54 12 12 12S3.34 13.78.29 16.67a1 1 0 0 0-.29.72 1 1 0 0 0 .31.72l2.83 2.83a1 1 0 0 0 1.41 0l2.83-2.83a1 1 0 0 0 0-1.41L5.9 15.22A9.94 9.94 0 0 1 12 13.5c2.25 0 4.33.66 6.1 1.72l-1.48 1.48a1 1 0 0 0 0 1.41l2.83 2.83a1 1 0 0 0 1.41 0l2.83-2.83a1 1 0 0 0 .31-.72 1 1 0 0 0-.29-.72z"/>
  </svg>
);

const SunSvg = ({ size = 16 }: { size?: number }) => (
  <I size={size}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </I>
);

const MoonSvg = ({ size = 16 }: { size?: number }) => (
  <I size={size}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </I>
);

const SkipSvg = ({ size = 20 }: { size?: number }) => (
  <I size={size}>
    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </I>
);

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const CATEGORIES = ["Random", "Music", "Gaming", "Tech", "Chill", "Deep Talk"];

const ICE = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type State = "idle" | "searching" | "incoming" | "calling" | "connected";

/* ═══════════════════════════════════════════════════════════
   RINGTONE (Web Audio beeps)
   ═══════════════════════════════════════════════════════════ */

function useRingtone() {
  const ctx = useRef<AudioContext | null>(null);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (iv.current) { clearInterval(iv.current); iv.current = null; }
    if (ctx.current) { ctx.current.close().catch(() => {}); ctx.current = null; }
  }, []);

  const play = useCallback(() => {
    stop();
    try {
      const ac = new AudioContext();
      ctx.current = ac;
      const beep = () => {
        const o1 = ac.createOscillator();
        const o2 = ac.createOscillator();
        const g = ac.createGain();
        o1.connect(g); o2.connect(g); g.connect(ac.destination);
        o1.frequency.value = 440;
        o2.frequency.value = 550;
        g.gain.setValueAtTime(0.08, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
        o1.start(ac.currentTime); o1.stop(ac.currentTime + 0.3);
        o2.start(ac.currentTime + 0.3); o2.stop(ac.currentTime + 0.6);
      };
      beep();
      iv.current = setInterval(beep, 2000);
    } catch {}
  }, [stop]);

  useEffect(() => () => stop(), [stop]);
  return { play, stop };
}

/* ═══════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function WaveBars({ active, color = "var(--accent)" }: { active: boolean; color?: string }) {
  const hs = [10, 18, 26, 22, 14, 24, 16, 20, 12];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2.5, height: 30 }}>
      {hs.map((h, i) => (
        <div key={i} style={{
          width: 2.5, borderRadius: 4, background: color,
          opacity: active ? 0.85 : 0.12,
          height: active ? undefined : 3,
          animation: active ? `wave 0.55s ease-in-out ${i * 0.06}s infinite` : "none",
          "--h": `${h}px`,
          transition: "opacity 0.4s",
        } as CSSProperties} />
      ))}
    </div>
  );
}

function Dots({ color = "var(--accent)", count = 3 }: { color?: string; count?: number }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: color,
          animation: `dot-pulse 1.4s ease-in-out ${i * 0.16}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */

export default function Home() {
  const [dark, setDark] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [category, setCategory] = useState("Random");
  const [muted, setMuted] = useState(false);
  const [peerMuted, setPeerMuted] = useState(false);
  const [online, setOnline] = useState(0);
  const [timer, setTimer] = useState(0);
  const [myName, setMyName] = useState("");
  const [peerName, setPeerName] = useState("");
  const [micOk, setMicOk] = useState(false);
  const [toast, setToast] = useState("");
  const [localSpk, setLocalSpk] = useState(false);
  const [peerSpk, setPeerSpk] = useState(false);

  const sock = useRef<Socket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const room = useRef<string | null>(null);
  const tmr = useRef<ReturnType<typeof setInterval> | null>(null);

  const ring = useRingtone();

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Theme ── */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  /* ── Mic ── */
  async function reqMic() {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicOk(true);
      initSock();
    } catch {
      alert("Microphone access is required.");
    }
  }

  /* ── Socket ── */
  function initSock() {
    if (sock.current?.connected) return;
    const s = io({ transports: ["websocket", "polling"] });
    sock.current = s;

    s.on("your_name", ({ name }: { name: string }) => setMyName(name));
    s.on("online_count", ({ count }: { count: number }) => setOnline(count));
    s.on("searching", () => setState("searching"));

    s.on("incoming_call", ({ roomId, callerName }: { roomId: string; callerName: string }) => {
      room.current = roomId; setPeerName(callerName);
      setState("incoming"); ring.play();
    });

    s.on("calling_peer", ({ roomId, peerName: n }: { roomId: string; peerName: string }) => {
      room.current = roomId; setPeerName(n); setState("calling");
    });

    s.on("call_accepted", async ({ roomId, initiator }: { roomId: string; initiator: boolean }) => {
      ring.stop(); room.current = roomId;
      setState("connected"); startTmr();
      await setupPC(initiator, roomId);
    });

    s.on("call_declined", () => {
      ring.stop(); flash("They declined"); setState("idle"); room.current = null;
    });

    s.on("call_ended", ({ reason }: { reason: string }) => {
      ring.stop(); killPC(); stopTmr();
      flash(reason); setState("idle");
      room.current = null; setPeerMuted(false); setPeerSpk(false); setTimer(0);
    });

    s.on("signal", async ({ data }: { data: RTCSessionDescriptionInit | { type: string; candidate: RTCIceCandidateInit } }) => {
      if (!pc.current) return;
      try {
        if ("candidate" in data && data.type === "ice-candidate") {
          const d = data as { type: string; candidate: RTCIceCandidateInit };
          if (d.candidate) await pc.current.addIceCandidate(new RTCIceCandidate(d.candidate));
        } else {
          const sdp = data as RTCSessionDescriptionInit;
          await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
          if (sdp.type === "offer") {
            const ans = await pc.current.createAnswer();
            await pc.current.setLocalDescription(ans);
            s.emit("signal", { roomId: room.current, data: pc.current.localDescription });
          }
        }
      } catch (e) { console.error(e); }
    });

    s.on("peer_mute_state", ({ muted: m }: { muted: boolean }) => setPeerMuted(m));
  }

  /* ── WebRTC ── */
  async function setupPC(init: boolean, rid: string) {
    killPC();
    const p = new RTCPeerConnection(ICE);
    pc.current = p;
    stream.current?.getTracks().forEach((t) => p.addTrack(t, stream.current!));

    p.onicecandidate = (e) => {
      if (e.candidate) sock.current?.emit("signal", { roomId: rid, data: { type: "ice-candidate", candidate: e.candidate.toJSON() } });
    };

    p.ontrack = (e) => {
      if (audio.current) {
        audio.current.srcObject = e.streams[0];
        audio.current.play().catch(() => {});
      }
      try {
        const ac = new AudioContext();
        const src = ac.createMediaStreamSource(e.streams[0]);
        const an = ac.createAnalyser(); an.fftSize = 256;
        src.connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        let last = false;
        const tick = () => {
          an.getByteFrequencyData(buf);
          const avg = buf.slice(0, 40).reduce((a, b) => a + b, 0) / 40;
          const sp = avg > 10;
          if (sp !== last) { last = sp; setPeerSpk(sp); }
          requestAnimationFrame(tick);
        };
        tick();
      } catch {}
    };

    if (init) {
      const offer = await p.createOffer({ offerToReceiveAudio: true });
      await p.setLocalDescription(offer);
      sock.current?.emit("signal", { roomId: rid, data: p.localDescription });
    }
  }

  function killPC() {
    pc.current?.close(); pc.current = null;
    if (audio.current) audio.current.srcObject = null;
    setPeerSpk(false);
  }

  function startTmr() { stopTmr(); setTimer(0); tmr.current = setInterval(() => setTimer((p) => p + 1), 1000); }
  function stopTmr() { if (tmr.current) { clearInterval(tmr.current); tmr.current = null; } }
  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  /* ── Mute ── */
  useEffect(() => {
    stream.current?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
    sock.current?.emit("mute_state", { muted });
  }, [muted]);

  /* ── Local speaking ── */
  useEffect(() => {
    if (!stream.current) return;
    let frame: number;
    try {
      const ac = new AudioContext();
      const src = ac.createMediaStreamSource(stream.current);
      const an = ac.createAnalyser(); an.fftSize = 256;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      let last = false;
      const tick = () => {
        an.getByteFrequencyData(buf);
        const avg = buf.slice(0, 40).reduce((a, b) => a + b, 0) / 40;
        const sp = avg > 12;
        if (sp !== last) { last = sp; setLocalSpk(sp); }
        frame = requestAnimationFrame(tick);
      };
      tick();
      return () => cancelAnimationFrame(frame);
    } catch { return; }
  }, [micOk]);

  /* ── Actions ── */
  const find = () => sock.current?.emit("find_partner", { category: category.toLowerCase().replace(" ", "-") });
  const accept = () => { ring.stop(); sock.current?.emit("accept_call", { roomId: room.current }); };
  const decline = () => { ring.stop(); sock.current?.emit("decline_call", { roomId: room.current }); setState("idle"); room.current = null; };

  const endCall = () => {
    sock.current?.emit("end_call"); killPC(); stopTmr(); setTimer(0);
    setState("idle"); room.current = null; setPeerMuted(false); setPeerSpk(false);
  };

  const next = () => {
    sock.current?.emit("end_call"); killPC(); stopTmr(); setTimer(0);
    setPeerMuted(false); setPeerSpk(false); find();
  };

  useEffect(() => () => {
    stopTmr(); ring.stop(); killPC();
    stream.current?.getTracks().forEach((t) => t.stop());
    sock.current?.disconnect();
  }, []);

  /* ═══════════════════════════════════════════════════════════
     STYLES
     ═══════════════════════════════════════════════════════════ */

  const S = {
    page: {
      background: "var(--bg)", height: "100vh", width: "100vw",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative" as const, overflow: "hidden",
      transition: "background 0.5s",
    } satisfies CSSProperties,

    // Ambient gradient layer behind card
    ambient: {
      position: "absolute" as const, inset: 0, pointerEvents: "none" as const,
      background: "var(--gradient-1), var(--gradient-2), var(--gradient-3)",
      transition: "background 0.5s",
    } satisfies CSSProperties,

    card: {
      position: "relative" as const,
      background: "var(--card)",
      backdropFilter: `blur(var(--glass-blur))`,
      WebkitBackdropFilter: `blur(var(--glass-blur))`,
      border: "1px solid var(--card-border)",
      boxShadow: "var(--card-shadow)",
      borderRadius: 32,
      width: "min(88vw, 400px)",
      minHeight: 420,
      padding: "44px 36px",
      display: "flex", flexDirection: "column" as const, alignItems: "center",
      justifyContent: "center",
      animation: "fadeScale 0.5s cubic-bezier(.2,.8,.2,1)",
      transition: "background 0.5s, border-color 0.5s, box-shadow 0.5s",
      zIndex: 2,
    } satisfies CSSProperties,

    // Circle avatar
    circle: (active: boolean, color: string, glow: string) => ({
      width: 110, height: 110, borderRadius: "50%",
      border: active ? `2.5px solid ${color}` : "2px solid var(--divider)",
      background: active ? `${color}11` : "var(--bg-sub)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.4s cubic-bezier(.2,.8,.2,1)",
      boxShadow: active ? `0 0 40px ${glow}` : "none",
      position: "relative" as const,
    }) satisfies CSSProperties,

    // Round button
    btn: (bg: string, shadow: string, sz = 64) => ({
      width: sz, height: sz, borderRadius: "50%",
      border: "none", cursor: "pointer",
      background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 24px ${shadow}`,
      transition: "transform 0.15s, box-shadow 0.15s",
    }) satisfies CSSProperties,

    // Ghost button
    ghost: (sz = 52) => ({
      width: sz, height: sz, borderRadius: "50%",
      border: "1px solid var(--divider)",
      background: "var(--bg-sub)", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-2)",
      transition: "all 0.2s",
    }) satisfies CSSProperties,

    pill: (active: boolean) => ({
      padding: "7px 16px", borderRadius: 100, fontSize: 12, fontWeight: 500 as const,
      border: "1px solid",
      borderColor: active ? "var(--accent)" : "var(--divider)",
      background: active ? "var(--accent-soft)" : "transparent",
      color: active ? "var(--accent)" : "var(--text-2)",
      cursor: "pointer", transition: "all 0.25s",
      letterSpacing: "0.01em",
    }) satisfies CSSProperties,
  };

  const press = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.92)"; };
  const release = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; };

  /* ═══════════════════════════════════════════════════════════
     PERMISSION SCREEN
     ═══════════════════════════════════════════════════════════ */

  if (!micOk) {
    return (
      <div style={S.page}>
        <div style={S.ambient} />
        <div style={{ ...S.card, minHeight: 340 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: "var(--accent-soft)", border: "1px solid var(--accent-med)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 28, color: "var(--accent)",
          }}>
            <MicSvg size={34} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            Microphone Access
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, textAlign: "center", marginBottom: 32, maxWidth: 280 }}>
            Allow microphone to start anonymous voice calls. Nothing is recorded. Ever.
          </p>
          <button onClick={reqMic}
            onMouseDown={press} onMouseUp={release}
            style={{
              width: "100%", maxWidth: 260, height: 52, borderRadius: 16, border: "none",
              background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: `0 4px 20px var(--accent-glow)`,
              transition: "transform 0.15s",
            }}>
            <MicSvg size={17} />
            Allow & Start
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════ */

  return (
    <div style={S.page}>
      <div style={S.ambient} />
      <audio ref={audio} autoPlay playsInline style={{ display: "none" }} />

      {/* ── Top bar: online + theme ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: "var(--green)",
            boxShadow: `0 0 8px var(--green-glow)`,
            animation: "breathe 2s ease-in-out infinite",
          }} />
          {online} online
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          style={{
            width: 42, height: 42, borderRadius: 14,
            border: "1px solid var(--card-border)", background: "var(--card)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-2)", boxShadow: "var(--card-shadow)",
            transition: "all 0.3s",
          }}
        >
          {dark ? <SunSvg /> : <MoonSvg />}
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--card-solid)", border: "1px solid var(--card-border)",
          borderRadius: 14, padding: "12px 24px", fontSize: 13, fontWeight: 500,
          color: "var(--text-2)", boxShadow: "var(--card-shadow)",
          animation: "toast-in 0.3s ease", zIndex: 30,
          backdropFilter: "blur(20px)",
        }}>
          {toast}
        </div>
      )}

      {/* ═══ CARD ═══ */}
      <div style={S.card} key={state}>

        {/* ────── IDLE ────── */}
        {state === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeIn 0.5s ease" }}>
            {/* ? Circle */}
            <div style={{
              ...S.circle(false, "", ""),
              animation: "float 4s ease-in-out infinite",
              marginBottom: 28,
            }}>
              <span style={{
                fontSize: 44, fontWeight: 200, color: "var(--text-3)",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                userSelect: "none",
              }}>?</span>
            </div>

            <p style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              You are
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 28, letterSpacing: "-0.02em" }}>
              {myName || "Anonymous"}
            </p>

            {/* Category pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 36, maxWidth: 320 }}>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} style={S.pill(category === c)}>
                  {c}
                </button>
              ))}
            </div>

            {/* Call button */}
            <button
              onClick={find}
              onMouseDown={press} onMouseUp={release}
              style={S.btn("var(--green)", "var(--green-glow)", 72)}
            >
              <PhoneSvg size={30} />
            </button>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 14, letterSpacing: "0.03em" }}>
              Tap to call a stranger
            </p>
          </div>
        )}

        {/* ────── SEARCHING ────── */}
        {state === "searching" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeIn 0.4s ease" }}>
            <div style={{ ...S.circle(false, "", ""), marginBottom: 28, position: "relative" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                border: "2.5px solid var(--accent)", borderTopColor: "transparent",
                animation: "spin 0.7s linear infinite",
              }} />
              {/* Orbit ring */}
              <div style={{
                position: "absolute", inset: -14, borderRadius: "50%",
                border: "1px solid var(--divider)", opacity: 0.5,
                animation: "spin 4s linear infinite",
              }}>
                <div style={{
                  position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)",
                  width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
                  boxShadow: `0 0 10px var(--accent-glow)`,
                }} />
              </div>
            </div>

            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 6, letterSpacing: "-0.02em" }}>
              Searching
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>
              Category: <span style={{ color: "var(--accent)", fontWeight: 600 }}>{category}</span>
            </p>
            <p style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 36 }}>
              {online > 1 ? `${online} people online` : "Waiting for someone..."}
            </p>

            <Dots color="var(--accent)" />

            <button onClick={endCall} style={{
              ...S.ghost(44), marginTop: 32, border: "1px solid var(--divider)",
              width: "auto", height: "auto", borderRadius: 12, padding: "10px 28px",
              fontSize: 13, fontWeight: 500,
            }}>
              Cancel
            </button>
          </div>
        )}

        {/* ────── INCOMING CALL ────── */}
        {state === "incoming" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeScale 0.3s ease" }}>
            <div style={{ position: "relative", marginBottom: 28 }}>
              {/* Pulse rings */}
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  position: "absolute", inset: -(10 + i * 14), borderRadius: "50%",
                  border: `${2 - i * 0.5}px solid var(--accent)`,
                  animation: `pulse-ring 2s ease-out ${i * 0.3}s infinite`,
                  opacity: 0.4 - i * 0.1,
                }} />
              ))}
              <div style={{
                ...S.circle(true, "var(--accent)", "var(--accent-glow)"),
                animation: "shake-phone 2.5s ease-in-out infinite",
                color: "var(--accent)",
              }}>
                <PhoneSvg size={40} />
              </div>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Incoming Call
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 4, letterSpacing: "-0.02em" }}>
              {peerName}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 40 }}>
              wants to talk to you
            </p>

            {/* Accept / Decline */}
            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button onClick={decline} onMouseDown={press} onMouseUp={release}
                  style={S.btn("var(--red)", "var(--red-glow)", 60)}>
                  <EndCallSvg size={22} />
                </button>
                <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>Decline</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button onClick={accept} onMouseDown={press} onMouseUp={release}
                  style={S.btn("var(--green)", "var(--green-glow)", 60)}>
                  <PhoneSvg size={26} />
                </button>
                <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>Accept</span>
              </div>
            </div>
          </div>
        )}

        {/* ────── CALLING (outgoing) ────── */}
        {state === "calling" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeIn 0.4s ease" }}>
            <div style={{ position: "relative", marginBottom: 28 }}>
              <div style={{
                position: "absolute", inset: -8, borderRadius: "50%",
                animation: "orbit-glow 2s infinite",
              }} />
              <div style={{
                ...S.circle(true, "var(--green)", "var(--green-glow)"),
                color: "var(--green)",
              }}>
                <PhoneSvg size={38} />
              </div>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Calling
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 4, letterSpacing: "-0.02em" }}>
              {peerName}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 36 }}>
              ringing...
            </p>

            <Dots color="var(--green)" />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 32 }}>
              <button onClick={endCall} onMouseDown={press} onMouseUp={release}
                style={S.btn("var(--red)", "var(--red-glow)", 56)}>
                <EndCallSvg size={20} />
              </button>
              <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 500 }}>Cancel</span>
            </div>
          </div>
        )}

        {/* ────── CONNECTED ────── */}
        {state === "connected" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "fadeIn 0.4s ease" }}>
            {/* Peer avatar */}
            <div style={{
              ...S.circle(peerSpk && !peerMuted, "var(--green)", "var(--green-glow)"),
              marginBottom: 20,
            }}>
              <WaveBars active={peerSpk && !peerMuted} color="var(--green)" />
            </div>

            {/* Name & timer */}
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 2, letterSpacing: "-0.02em" }}>
              {peerName}
            </p>
            <p style={{
              fontSize: 32, fontWeight: 300, color: "var(--text-2)", marginBottom: 4,
              fontVariantNumeric: "tabular-nums", fontFamily: "'SF Mono', 'Menlo', monospace",
              letterSpacing: "0.04em",
            }}>
              {fmt(timer)}
            </p>

            {peerMuted && (
              <p style={{
                fontSize: 11, color: "var(--red)", fontWeight: 500,
                padding: "3px 10px", borderRadius: 6,
                background: "var(--red-soft)",
                marginBottom: 2,
              }}>
                Stranger is muted
              </p>
            )}

            {/* Your mic pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 100,
              background: muted ? "var(--red-soft)" : (localSpk ? "var(--green-soft)" : "var(--bg-sub)"),
              marginTop: 8, marginBottom: 36, transition: "all 0.25s",
              border: `1px solid ${muted ? "var(--red)" : "var(--divider)"}`,
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: muted ? "var(--red)" : "var(--green)",
                transition: "background 0.2s",
              }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: muted ? "var(--red)" : "var(--text-2)" }}>
                {muted ? "Your mic is off" : "Your mic"}
              </span>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button onClick={() => setMuted((m) => !m)} style={{
                  ...S.ghost(52),
                  background: muted ? "var(--red-soft)" : "var(--bg-sub)",
                  borderColor: muted ? "var(--red)" : "var(--divider)",
                  color: muted ? "var(--red)" : "var(--text-2)",
                }}>
                  {muted ? <MicOffSvg size={20} /> : <MicSvg size={20} />}
                </button>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>{muted ? "Unmute" : "Mute"}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button onClick={endCall} onMouseDown={press} onMouseUp={release}
                  style={S.btn("var(--red)", "var(--red-glow)", 64)}>
                  <EndCallSvg size={24} />
                </button>
                <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 500 }}>End</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button onClick={next} style={S.ghost(52)}>
                  <SkipSvg size={20} />
                </button>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>Next</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom ── */}
      <p style={{
        position: "absolute", bottom: 18, fontSize: 11, color: "var(--text-4)",
        letterSpacing: "0.06em", zIndex: 1, textAlign: "center",
      }}>
        VoiceAnon — peer-to-peer · encrypted · zero logs
      </p>
    </div>
  );
}
