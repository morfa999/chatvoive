"use client";
import { useEffect, useRef, useState, useCallback, type CSSProperties } from "react";
import { io, Socket } from "socket.io-client";

/* ═══ ICONS ═══ */
const Mic = ({ s = 22 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3m-4 0h8"/></svg>);
const MicOff = ({ s = 22 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .38-.03.75-.08 1.12"/><path d="M12 19v3m-4 0h8"/></svg>);
const Phone = ({ s = 22 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const PhoneDown = ({ s = 22 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M23.71 16.67C20.66 13.78 16.54 12 12 12S3.34 13.78.29 16.67a1 1 0 0 0 0 1.44l2.83 2.83a1 1 0 0 0 1.41 0l2.83-2.83a1 1 0 0 0 0-1.41L5.9 15.22A9.94 9.94 0 0 1 12 13.5c2.25 0 4.33.66 6.1 1.72l-1.48 1.48a1 1 0 0 0 0 1.41l2.83 2.83a1 1 0 0 0 1.41 0l2.83-2.83a1 1 0 0 0 .02-1.44z"/></svg>);
const Skip = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,4 15,12 5,20"/><rect x="17" y="5" width="2" height="14" rx="1"/></svg>);
const X = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const Check = ({ s = 22 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const Sun = () => (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>);
const Moon = () => (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);

/* ═══ BG ═══ */
const stickerD = [
  "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z",
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  "M12 2L2 12l10 10 10-10L12 2z","M2 20h20L18 8l-4 6-2-8-2 8-4-6-4 12z",
  "M3 18v-6a9 9 0 0 1 18 0v6","M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z",
  "M9 18V5l12-2v13","M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "M21 16V8l-7-4a2 2 0 0 0-2 0l-7 4v8l7 4a2 2 0 0 0 2 0l7-4z",
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
];
const sPos = [
  {x:5,y:8,r:15,s:.7},{x:90,y:5,r:-20,s:.55},{x:15,y:28,r:30,s:.5},{x:78,y:20,r:-10,s:.6},
  {x:50,y:5,r:45,s:.4},{x:65,y:35,r:-35,s:.5},{x:3,y:55,r:20,s:.6},{x:94,y:50,r:-15,s:.45},
  {x:28,y:78,r:10,s:.55},{x:75,y:72,r:-25,s:.6},{x:55,y:90,r:35,s:.45},{x:8,y:92,r:-40,s:.4},
];
function Bg() {
  return (<>
    <div style={{position:"absolute",inset:0,zIndex:0,pointerEvents:"none",backgroundImage:`linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)`,backgroundSize:"36px 36px"}}/>
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {sPos.map((p,i)=>(<svg key={i} width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--sticker)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,transform:`rotate(${p.r}deg) scale(${p.s})`}}><path d={stickerD[i%stickerD.length]}/></svg>))}
    </div>
  </>);
}

/* ═══ Segmented control ═══ */
function Seg({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{display:"flex",background:"var(--seg-bg)",borderRadius:10,padding:2,gap:0}}>
      {items.map(v=>(
        <button key={v} onClick={()=>onChange(v)} style={{
          flex:1,padding:"8px 4px",borderRadius:8,border:"none",cursor:"pointer",
          fontSize:13,fontWeight:value===v?600:400,
          background:value===v?"var(--seg-active)":"transparent",
          color:value===v?"var(--t1)":"var(--t3)",
          boxShadow:value===v?"0 1px 3px rgba(0,0,0,.08)":"none",
          transition:"all .2s",
        }}>{v}</button>
      ))}
    </div>
  );
}

/* ═══ Waves ═══ */
function Waves({on}:{on:boolean}) {
  const h=[8,14,20,16,10];
  return (<div style={{display:"flex",alignItems:"center",gap:2,height:22}}>
    {h.map((v,i)=>(<div key={i} style={{width:2.5,borderRadius:3,background:"var(--green)",height:on?undefined:3,animation:on?`wave .55s ease-in-out ${i*.07}s infinite`:"none",opacity:on?.8:.15,transition:"opacity .3s","--h":`${v}px`} as CSSProperties}/>))}
  </div>);
}

/* ═══ CONSTANTS ═══ */
const ICE={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]};
type St="idle"|"searching"|"incoming"|"calling"|"connected";

function useRing(){
  const c=useRef<AudioContext|null>(null);const iv=useRef<ReturnType<typeof setInterval>|null>(null);
  const stop=useCallback(()=>{if(iv.current){clearInterval(iv.current);iv.current=null;}if(c.current){c.current.close().catch(()=>{});c.current=null;}},[]);
  const play=useCallback(()=>{stop();try{const ac=new AudioContext();c.current=ac;const beep=()=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.frequency.value=520;g.gain.setValueAtTime(.1,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.4);o.start(ac.currentTime);o.stop(ac.currentTime+.4);};beep();iv.current=setInterval(beep,1800);}catch{}},[stop]);
  useEffect(()=>()=>stop(),[stop]);return{play,stop};
}

/* ═══ MAIN ═══ */
export default function Home(){
  const [dark,setDark]=useState(false);
  const [st,setSt]=useState<St>("idle");
  const [mut,setMut]=useState(false);
  const [pmut,setPmut]=useState(false);
  const [tm,setTm]=useState(0);
  const [me,setMe]=useState("");
  const [them,setThem]=useState("");
  const [toast,setToast]=useState("");
  const [pSpk,setPSpk]=useState(false);
  const [sheet,setSheet]=useState(false);
  const [myG,setMyG]=useState("Парень");
  const [theirG,setTheirG]=useState("Все");
  const [myA,setMyA]=useState("18-24");
  const [theirA,setTheirA]=useState("Все");
  const [swipeX,setSwipeX]=useState(0);
  const [swiping,setSwiping]=useState(false);
  const swipeStart=useRef(0);
  const sock=useRef<Socket|null>(null);
  const pcr=useRef<RTCPeerConnection|null>(null);
  const strm=useRef<MediaStream|null>(null);
  const aud=useRef<HTMLAudioElement|null>(null);
  const rid=useRef<string|null>(null);
  const tmr=useRef<ReturnType<typeof setInterval>|null>(null);
  const ring=useRing();
  const micReq=useRef(false);

  const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  useEffect(()=>{document.documentElement.setAttribute("data-theme",dark?"dark":"light");},[dark]);
  useEffect(()=>{if(micReq.current)return;micReq.current=true;(async()=>{try{strm.current=await navigator.mediaDevices.getUserMedia({audio:true});initSock();}catch{}})();},[]);

  function initSock(){
    if(sock.current?.connected)return;const s=io({transports:["websocket","polling"]});sock.current=s;
    s.on("your_name",({name}:{name:string})=>setMe(name));
    s.on("searching",()=>setSt("searching"));
    s.on("ringing",({rid:r,name}:{rid:string;name:string})=>{rid.current=r;setThem(name);setSt("incoming");ring.play();});
    s.on("calling",({rid:r,name}:{rid:string;name:string})=>{rid.current=r;setThem(name);setSt("calling");});
    s.on("accepted",async({rid:r,init}:{rid:string;init:boolean})=>{ring.stop();rid.current=r;setSt("connected");startTm();await setupPC(init,r);});
    s.on("declined",()=>{ring.stop();flash("Звонок отклонён");setSt("idle");rid.current=null;});
    s.on("ended",({msg}:{msg:string})=>{ring.stop();killPC();stopTm();flash(msg);setSt("idle");rid.current=null;setPmut(false);setPSpk(false);setTm(0);});
    s.on("signal",async({data}:{data:RTCSessionDescriptionInit|{type:string;candidate:RTCIceCandidateInit}})=>{
      if(!pcr.current)return;try{
        if("candidate" in data&&data.type==="ice-candidate"){const d=data as{type:string;candidate:RTCIceCandidateInit};if(d.candidate)await pcr.current.addIceCandidate(new RTCIceCandidate(d.candidate));}
        else{const sdp=data as RTCSessionDescriptionInit;await pcr.current.setRemoteDescription(new RTCSessionDescription(sdp));if(sdp.type==="offer"){const a=await pcr.current.createAnswer();await pcr.current.setLocalDescription(a);s.emit("signal",{rid:rid.current,data:pcr.current.localDescription});}}
      }catch(e){console.error(e);}});
    s.on("pmute",({m}:{m:boolean})=>setPmut(m));
  }

  async function setupPC(init:boolean,r:string){
    killPC();const p=new RTCPeerConnection(ICE);pcr.current=p;
    strm.current?.getTracks().forEach(t=>p.addTrack(t,strm.current!));
    p.onicecandidate=e=>{if(e.candidate)sock.current?.emit("signal",{rid:r,data:{type:"ice-candidate",candidate:e.candidate.toJSON()}});};
    p.ontrack=e=>{if(aud.current){aud.current.srcObject=e.streams[0];aud.current.play().catch(()=>{});}
      try{const ac=new AudioContext(),src=ac.createMediaStreamSource(e.streams[0]),an=ac.createAnalyser();an.fftSize=256;src.connect(an);const buf=new Uint8Array(an.frequencyBinCount);let last=false;const tick=()=>{an.getByteFrequencyData(buf);const avg=buf.slice(0,40).reduce((a,b)=>a+b,0)/40;const sp=avg>10;if(sp!==last){last=sp;setPSpk(sp);}requestAnimationFrame(tick);};tick();}catch{}};
    if(init){const o=await p.createOffer({offerToReceiveAudio:true});await p.setLocalDescription(o);sock.current?.emit("signal",{rid:r,data:p.localDescription});}
  }

  function killPC(){pcr.current?.close();pcr.current=null;if(aud.current)aud.current.srcObject=null;setPSpk(false);}
  function startTm(){stopTm();setTm(0);tmr.current=setInterval(()=>setTm(p=>p+1),1000);}
  function stopTm(){if(tmr.current){clearInterval(tmr.current);tmr.current=null;}}
  function flash(m:string){setToast(m);setTimeout(()=>setToast(""),3000);}

  useEffect(()=>{strm.current?.getAudioTracks().forEach(t=>{t.enabled=!mut;});sock.current?.emit("mute",{m:mut});},[mut]);

  const find=()=>{setSheet(false);sock.current?.emit("find",{myG,theirG,myA,theirA});};
  const accept=()=>{ring.stop();setSwipeX(0);sock.current?.emit("accept",{rid:rid.current});};
  const decline=()=>{ring.stop();setSwipeX(0);sock.current?.emit("decline",{rid:rid.current});setSt("idle");rid.current=null;};
  const end=()=>{sock.current?.emit("end");killPC();stopTm();setTm(0);setSt("idle");rid.current=null;setPmut(false);setPSpk(false);};
  const next=()=>{sock.current?.emit("end");killPC();stopTm();setTm(0);setPmut(false);setPSpk(false);find();};

  const onTS=(e:React.TouchEvent)=>{swipeStart.current=e.touches[0].clientX;setSwiping(true);};
  const onTM=(e:React.TouchEvent)=>{if(!swiping)return;setSwipeX(e.touches[0].clientX-swipeStart.current);};
  const onTE=()=>{setSwiping(false);if(swipeX>80)accept();else if(swipeX<-80)decline();else setSwipeX(0);};
  const onMD=(e:React.MouseEvent)=>{swipeStart.current=e.clientX;setSwiping(true);};
  const onMM=(e:React.MouseEvent)=>{if(!swiping)return;setSwipeX(e.clientX-swipeStart.current);};
  const onMU=()=>{if(!swiping)return;setSwiping(false);if(swipeX>80)accept();else if(swipeX<-80)decline();else setSwipeX(0);};

  useEffect(()=>()=>{stopTm();ring.stop();killPC();strm.current?.getTracks().forEach(t=>t.stop());sock.current?.disconnect();},[]);

  const press=(e:React.MouseEvent|React.TouchEvent)=>{(e.currentTarget as HTMLElement).style.transform="scale(0.94)";};
  const rel=(e:React.MouseEvent|React.TouchEvent)=>{(e.currentTarget as HTMLElement).style.transform="scale(1)";};

  const cir=(active:boolean):CSSProperties=>({
    width:"clamp(100px,22vw,130px)",height:"clamp(100px,22vw,130px)",borderRadius:"50%",
    border:active?"2.5px solid var(--green)":"2px solid var(--border)",
    background:active?(dark?"rgba(48,209,88,.08)":"rgba(48,209,88,.06)"):"var(--surface2)",
    display:"flex",alignItems:"center",justifyContent:"center",transition:"all .3s",
  });
  const rbtn=(bg:string,sz=60):CSSProperties=>({width:sz,height:sz,borderRadius:"50%",border:"none",cursor:"pointer",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform .15s"});
  const gbtn=(sz=52):CSSProperties=>({width:sz,height:sz,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--t2)",transition:"all .2s"});

  /* ═══ RENDER ═══ */
  return (
    <div style={{background:"var(--bg)",height:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",transition:"background .3s"}}>
      <Bg/>
      <audio ref={aud} autoPlay playsInline style={{display:"none"}}/>

      {/* top right theme */}
      <button onClick={()=>setDark(d=>!d)} style={{position:"absolute",top:16,right:16,width:44,height:44,borderRadius:22,border:"1px solid var(--border)",background:"var(--surface)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--t3)",zIndex:10}}>{dark?<Sun/>:<Moon/>}</button>

      {/* toast */}
      {toast&&<div style={{position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"12px 24px",fontSize:14,fontWeight:600,color:"var(--t1)",zIndex:30,animation:"fadeUp .25s ease"}}>{toast}</div>}

      {/* ═══ BOTTOM SHEET ═══ */}
      {sheet&&(
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setSheet(false)}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)"}}/>
          <div style={{position:"relative",background:"var(--sheet-bg)",borderRadius:"24px 24px 0 0",padding:"12px 24px 34px",maxHeight:"85vh",overflow:"auto",animation:"slideUp .3s ease"}} onClick={e=>e.stopPropagation()}>
            {/* handle */}
            <div style={{width:36,height:4,borderRadius:2,background:"var(--border)",margin:"0 auto 20px"}}/>


            <div style={{marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Ваш пол</p>
              <Seg items={["Парень","Девушка"]} value={myG} onChange={setMyG}/>
            </div>

            <div style={{marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Ваш возраст</p>
              <Seg items={["18-24","25-34","35-44","45+"]} value={myA} onChange={setMyA}/>
            </div>

            <div style={{width:"100%",height:1,background:"var(--border)",margin:"8px 0 20px"}}/>

            <div style={{marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Ищу пол</p>
              <Seg items={["Все","Парень","Девушка"]} value={theirG} onChange={setTheirG}/>
            </div>

            <div style={{marginBottom:28}}>
              <p style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Ищу возраст</p>
              <Seg items={["Все","18-24","25-34","35-44","45+"]} value={theirA} onChange={setTheirA}/>
            </div>

            <button onClick={find} onMouseDown={press} onMouseUp={rel} style={{width:"100%",height:54,borderRadius:16,border:"none",background:"var(--green)",color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"transform .15s"}}>
              <Phone s={20}/> Найти собеседника
            </button>
          </div>
        </div>
      )}

      {/* ═══ MAIN CENTER ═══ */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:2,width:"100%",padding:"0 24px",maxWidth:420}} key={st}>

        {/* ── IDLE ── */}
        {st==="idle"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",animation:"fadeUp .35s ease"}}>
            <div style={{...cir(false),marginBottom:"clamp(20px,4vh,36px)"}}>
              <span style={{fontSize:"clamp(36px,8vw,48px)",fontWeight:200,color:"var(--t3)",fontFamily:"Georgia,serif",userSelect:"none"}}>?</span>
            </div>
            <p style={{fontSize:13,color:"var(--t3)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>Вы</p>
            <p style={{fontSize:"clamp(18px,5vw,24px)",fontWeight:700,color:"var(--t1)",marginBottom:"clamp(28px,6vh,48px)"}}>{me||"Аноним"}</p>
            <button onClick={()=>setSheet(true)} onMouseDown={press} onMouseUp={rel} style={{...rbtn("var(--green)",76),width:"clamp(68px,16vw,84px)",height:"clamp(68px,16vw,84px)"}}>
              <Phone s={32}/>
            </button>
            <p style={{fontSize:14,color:"var(--t2)",marginTop:16,fontWeight:500}}>Найти собеседника</p>
          </div>
        )}

        {/* ── SEARCHING ── */}
        {st==="searching"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",animation:"fadeUp .3s ease"}}>
            <div style={{...cir(false),marginBottom:"clamp(20px,4vh,36px)"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2.5px solid var(--accent)",borderTopColor:"transparent",animation:"spin .7s linear infinite"}}/>
            </div>
            <p style={{fontSize:"clamp(18px,5vw,22px)",fontWeight:700,color:"var(--t1)",marginBottom:8}}>Ищем собеседника</p>
            <p style={{fontSize:14,color:"var(--t3)",marginBottom:36,textAlign:"center"}}>{myG}, {myA}</p>
            <div style={{display:"flex",gap:6,marginBottom:36}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",animation:`dotPulse 1.4s ease-in-out ${i*.16}s infinite`}}/>)}
            </div>
            <button onClick={end} onMouseDown={press} onMouseUp={rel} style={{padding:"12px 36px",borderRadius:14,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--t1)",fontSize:15,fontWeight:600,cursor:"pointer",transition:"transform .15s"}}>Отменить</button>
          </div>
        )}

        {/* ── INCOMING ── */}
        {st==="incoming"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",animation:"fadeUp .3s ease"}}>
            <div style={{position:"relative",marginBottom:"clamp(20px,4vh,36px)"}}>
              <div style={{position:"absolute",inset:-12,borderRadius:"50%",border:"2px solid var(--accent)",animation:"pulseBorder 1.5s ease-in-out infinite"}}/>
              <div style={{...cir(false),border:"2.5px solid var(--accent)",background:"var(--accent-bg)",animation:"ringShake 2s ease-in-out infinite",color:"var(--accent)"}}>
                <Phone s={40}/>
              </div>
            </div>
            <p style={{fontSize:12,color:"var(--t3)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>Входящий звонок</p>
            <p style={{fontSize:"clamp(20px,5vw,26px)",fontWeight:700,color:"var(--t1)",marginBottom:4}}>{them}</p>
            <p style={{fontSize:14,color:"var(--t2)",marginBottom:32}}>хочет поговорить</p>

            {/* swipe bar */}
            <div style={{width:"min(100%,300px)",position:"relative",height:72,borderRadius:36,background:"var(--surface2)",overflow:"hidden",touchAction:"none",cursor:"grab",userSelect:"none"}}
              onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
              <div style={{position:"absolute",left:20,top:"50%",transform:"translateY(-50%)",color:"var(--red)",opacity:swipeX<-30?1:.25,transition:"opacity .15s"}}><X s={24}/></div>
              <div style={{position:"absolute",right:20,top:"50%",transform:"translateY(-50%)",color:"var(--green)",opacity:swipeX>30?1:.25,transition:"opacity .15s"}}><Check s={24}/></div>
              <div style={{
                position:"absolute",top:6,left:"50%",transform:`translateX(calc(-50% + ${swipeX}px))`,
                width:60,height:60,borderRadius:"50%",
                background:swipeX>50?"var(--green)":swipeX<-50?"var(--red)":"var(--accent)",
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:swiping?"none":"all .3s",color:"#fff",
                boxShadow:"0 2px 12px rgba(0,0,0,.15)",
              }}><Phone s={24}/></div>
            </div>
            <p style={{fontSize:12,color:"var(--t3)",marginTop:10}}>
              {swipeX>50?"Отпустите — принять":swipeX<-50?"Отпустите — отклонить":"Свайпните для ответа"}
            </p>
          </div>
        )}

        {/* ── CALLING ── */}
        {st==="calling"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",animation:"fadeUp .3s ease"}}>
            <div style={{position:"relative",marginBottom:"clamp(20px,4vh,36px)"}}>
              <div style={{position:"absolute",inset:-10,borderRadius:"50%",border:"2px solid var(--green)",animation:"pulseBorder 2s infinite"}}/>
              <div style={{...cir(false),border:"2.5px solid var(--green)",background:"var(--green-bg)",color:"var(--green)"}}><Phone s={38}/></div>
            </div>
            <p style={{fontSize:12,color:"var(--t3)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>Вызов</p>
            <p style={{fontSize:"clamp(20px,5vw,26px)",fontWeight:700,color:"var(--t1)",marginBottom:4}}>{them}</p>
            <p style={{fontSize:14,color:"var(--t2)",marginBottom:36}}>ожидание ответа...</p>
            <div style={{display:"flex",gap:6,marginBottom:32}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"var(--green)",animation:`dotPulse 1.4s ease-in-out ${i*.16}s infinite`}}/>)}
            </div>
            <button onClick={end} onMouseDown={press} onMouseUp={rel} style={rbtn("var(--red)",58)}><PhoneDown s={22}/></button>
            <span style={{fontSize:13,color:"var(--red)",marginTop:10,fontWeight:500}}>Отменить</span>
          </div>
        )}

        {/* ── CONNECTED ── */}
        {st==="connected"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",animation:"fadeUp .3s ease"}}>
            <div style={{...cir(pSpk&&!pmut),marginBottom:20}}><Waves on={pSpk&&!pmut}/></div>
            <p style={{fontSize:"clamp(18px,5vw,24px)",fontWeight:700,color:"var(--t1)",marginBottom:4}}>{them}</p>
            <p style={{fontSize:"clamp(28px,7vw,38px)",fontWeight:200,color:"var(--t2)",fontVariantNumeric:"tabular-nums",fontFamily:"'SF Mono',Menlo,monospace",marginBottom:8,letterSpacing:".06em"}}>{fmt(tm)}</p>
            {pmut&&<p style={{fontSize:12,color:"var(--red)",marginBottom:4,padding:"4px 12px",borderRadius:8,background:"var(--red-bg)",fontWeight:500}}>микрофон собеседника выключен</p>}

            <div style={{display:"flex",gap:24,alignItems:"center",marginTop:12}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <button onClick={()=>setMut(m=>!m)} style={{...gbtn(54),background:mut?"var(--red-bg)":"var(--surface2)",borderColor:mut?"var(--red)":"var(--border)",color:mut?"var(--red)":"var(--t2)"}}>{mut?<MicOff s={22}/>:<Mic s={22}/>}</button>
                <span style={{fontSize:11,color:"var(--t3)",fontWeight:500}}>{mut?"Вкл":"Выкл"}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <button onClick={end} onMouseDown={press} onMouseUp={rel} style={rbtn("var(--red)",66)}><PhoneDown s={24}/></button>
                <span style={{fontSize:11,color:"var(--red)",fontWeight:600}}>Завершить</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <button onClick={next} style={gbtn(54)}><Skip s={22}/></button>
                <span style={{fontSize:11,color:"var(--t3)",fontWeight:500}}>Далее</span>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:100,background:mut?"var(--red-bg)":"var(--surface2)",marginTop:20,border:mut?"1px solid var(--red)":"1px solid var(--border)"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:mut?"var(--red)":"var(--green)"}}/>
              <span style={{fontSize:12,fontWeight:500,color:mut?"var(--red)":"var(--t2)"}}>{mut?"Ваш микрофон выкл":"Ваш микрофон вкл"}</span>
            </div>
          </div>
        )}
      </div>

      <p style={{position:"absolute",bottom:"clamp(14px,2.5vh,24px)",fontSize:13,color:"var(--t2)",letterSpacing:".04em",zIndex:1,fontWeight:500}}>
        VoiceAnon — анонимно · p2p · без записи
      </p>
    </div>
  );
}
