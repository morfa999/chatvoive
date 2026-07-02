const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── State ────────────────────────────────────────────────
// category -> [socketId]
const queues = {};
// roomId -> { peer1, peer2, category, pending }
const rooms = {};
// socketId -> { roomId, category }
const users = {};

const funnyNames = [
  "Mysterious Potato", "Sneaky Raccoon", "Confused Penguin", "Dramatic Cactus",
  "Invisible Banana", "Grumpy Toaster", "Clumsy Ninja", "Sarcastic Cloud",
  "Philosophical Sock", "Anxious Avocado", "Suspicious Melon", "Chaotic Waffle",
  "Existential Donut", "Overconfident Snail", "Passive-Aggressive Lamp",
  "Emotionally Unavailable Chair", "Main Character Pigeon",
  "Oversharing Fridge", "Delusional Broom", "Unhinged Pillow",
  "Dangerously Calm Fork", "Chronically Online Carrot",
  "Menacingly Polite Goat", "Reluctant Hero Spoon",
];

function randomName() {
  return funnyNames[Math.floor(Math.random() * funnyNames.length)];
}

function getQueue(cat) {
  if (!queues[cat]) queues[cat] = [];
  return queues[cat];
}

function removeFromAllQueues(sid) {
  for (const c of Object.keys(queues)) {
    queues[c] = queues[c].filter((s) => s !== sid);
  }
}

function getRoomPeer(roomId, sid) {
  const r = rooms[roomId];
  if (!r) return null;
  return r.peer1 === sid ? r.peer2 : r.peer2 === sid ? r.peer1 : null;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    const name = randomName();
    users[socket.id] = { roomId: null, category: "random", name };
    socket.emit("your_name", { name });

    const emitOnline = () => io.emit("online_count", { count: io.engine.clientsCount });
    emitOnline();

    // ── Find partner ──
    socket.on("find_partner", ({ category = "random" } = {}) => {
      const user = users[socket.id];
      if (!user) return;

      // leave current
      if (user.roomId) {
        const pid = getRoomPeer(user.roomId, socket.id);
        if (pid && users[pid]) {
          io.to(pid).emit("call_ended", { reason: "Partner left" });
          users[pid].roomId = null;
        }
        delete rooms[user.roomId];
        user.roomId = null;
      }
      removeFromAllQueues(socket.id);
      user.category = category;

      const q = getQueue(category);

      // try match
      if (q.length > 0) {
        const matchId = q.shift();
        if (!io.sockets.sockets.get(matchId)) {
          // dead socket, re-queue self
          q.push(socket.id);
          socket.emit("searching");
          return;
        }

        const roomId = uuidv4();
        rooms[roomId] = { peer1: matchId, peer2: socket.id, category, pending: true };
        users[socket.id].roomId = roomId;
        users[matchId].roomId = roomId;

        const callerName = users[matchId]?.name || "Unknown";
        const calleeName = users[socket.id]?.name || "Unknown";

        // matchId (caller) found someone, show "calling" screen
        io.to(matchId).emit("calling_peer", { roomId, peerName: calleeName });
        // socket.id (callee) gets incoming call
        socket.emit("incoming_call", { roomId, callerName });
      } else {
        q.push(socket.id);
        socket.emit("searching");
      }
    });

    // ── Accept call ──
    socket.on("accept_call", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.pending = false;
      // peer1=caller, peer2=callee. Caller initiates WebRTC.
      io.to(room.peer1).emit("call_accepted", { roomId, initiator: true });
      io.to(room.peer2).emit("call_accepted", { roomId, initiator: false });
    });

    // ── Decline call ──
    socket.on("decline_call", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      const pid = getRoomPeer(roomId, socket.id);
      if (pid && users[pid]) {
        io.to(pid).emit("call_declined");
        users[pid].roomId = null;
      }
      users[socket.id].roomId = null;
      delete rooms[roomId];
    });

    // ── WebRTC signal ──
    socket.on("signal", ({ roomId, data }) => {
      const pid = getRoomPeer(roomId, socket.id);
      if (pid) io.to(pid).emit("signal", { data });
    });

    // ── Mute sync ──
    socket.on("mute_state", ({ muted }) => {
      const user = users[socket.id];
      if (!user?.roomId) return;
      const pid = getRoomPeer(user.roomId, socket.id);
      if (pid) io.to(pid).emit("peer_mute_state", { muted });
    });

    // ── End call ──
    socket.on("end_call", () => {
      const user = users[socket.id];
      if (!user) return;
      if (user.roomId) {
        const pid = getRoomPeer(user.roomId, socket.id);
        if (pid && users[pid]) {
          io.to(pid).emit("call_ended", { reason: "Partner hung up" });
          users[pid].roomId = null;
        }
        delete rooms[user.roomId];
        user.roomId = null;
      }
      removeFromAllQueues(socket.id);
      emitOnline();
    });

    // ── Disconnect ──
    socket.on("disconnect", () => {
      const user = users[socket.id];
      if (user) {
        if (user.roomId) {
          const pid = getRoomPeer(user.roomId, socket.id);
          if (pid && users[pid]) {
            io.to(pid).emit("call_ended", { reason: "Partner disconnected" });
            users[pid].roomId = null;
          }
          delete rooms[user.roomId];
        }
        removeFromAllQueues(socket.id);
        delete users[socket.id];
      }
      emitOnline();
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
