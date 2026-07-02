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

const queue = [];
const rooms = {};
const users = {};

const names = [
  "Таинственная Картошка", "Хитрый Енот", "Сонный Пингвин", "Драматичный Кактус",
  "Невидимый Банан", "Ворчливый Тостер", "Неуклюжий Ниндзя", "Саркастичное Облако",
  "Философский Носок", "Тревожный Авокадо", "Подозрительная Дыня", "Хаотичная Вафля",
  "Самоуверенная Улитка", "Пассивно-Агрессивная Лампа", "Главный Герой Голубь",
  "Безумная Подушка", "Опасно Спокойная Вилка", "Загадочный Огурец",
  "Паникующий Чайник", "Дерзкий Кроссовок", "Мечтательный Бублик",
];

function rndName() { return names[Math.floor(Math.random() * names.length)]; }
function rmQ(sid) { const i = queue.indexOf(sid); if (i !== -1) queue.splice(i, 1); }
function peer(rid, sid) { const r = rooms[rid]; if (!r) return null; return r.p1 === sid ? r.p2 : r.p2 === sid ? r.p1 : null; }

app.prepare().then(() => {
  const srv = createServer((req, res) => handle(req, res, parse(req.url, true)));
  const io = new Server(srv, { cors: { origin: "*" }, transports: ["websocket", "polling"] });

  io.on("connection", (socket) => {
    const name = rndName();
    users[socket.id] = { roomId: null, name };
    socket.emit("your_name", { name });

    // Set custom name
    socket.on("set_name", ({ name: n }) => {
      if (!users[socket.id]) return;
      const clean = (n || "").trim().slice(0, 24);
      if (clean) {
        users[socket.id].name = clean;
        // If in a room, notify peer of name change
        if (users[socket.id].roomId) {
          const p = peer(users[socket.id].roomId, socket.id);
          if (p) io.to(p).emit("peer_name", { name: clean });
        }
      }
    });

    // Find — instant connect, no accept/decline
    socket.on("find", () => {
      const u = users[socket.id]; if (!u) return;
      // Leave current room
      if (u.roomId) {
        const p = peer(u.roomId, socket.id);
        if (p && users[p]) { io.to(p).emit("ended", { msg: "Собеседник ушёл" }); users[p].roomId = null; }
        delete rooms[u.roomId]; u.roomId = null;
      }
      rmQ(socket.id);

      // Try match
      while (queue.length > 0) {
        const mid = queue.shift();
        if (!io.sockets.sockets.get(mid)) continue; // dead socket
        // Match found — instant connect
        const rid = uuidv4();
        rooms[rid] = { p1: mid, p2: socket.id };
        users[socket.id].roomId = rid;
        users[mid].roomId = rid;
        // p1 initiates WebRTC
        io.to(mid).emit("connected", { rid, init: true, peerName: users[socket.id].name });
        socket.emit("connected", { rid, init: false, peerName: users[mid].name });
        return;
      }
      // No match — wait in queue
      queue.push(socket.id);
      socket.emit("searching");
    });

    socket.on("signal", ({ rid, data }) => { const p = peer(rid, socket.id); if (p) io.to(p).emit("signal", { data }); });
    socket.on("mute", ({ m }) => { const u = users[socket.id]; if (!u?.roomId) return; const p = peer(u.roomId, socket.id); if (p) io.to(p).emit("pmute", { m }); });

    socket.on("end", () => {
      const u = users[socket.id]; if (!u) return;
      if (u.roomId) {
        const p = peer(u.roomId, socket.id);
        if (p && users[p]) { io.to(p).emit("ended", { msg: "Собеседник завершил звонок" }); users[p].roomId = null; }
        delete rooms[u.roomId]; u.roomId = null;
      }
      rmQ(socket.id);
    });

    socket.on("disconnect", () => {
      const u = users[socket.id];
      if (u) {
        if (u.roomId) {
          const p = peer(u.roomId, socket.id);
          if (p && users[p]) { io.to(p).emit("ended", { msg: "Собеседник отключился" }); users[p].roomId = null; }
          delete rooms[u.roomId];
        }
        rmQ(socket.id); delete users[socket.id];
      }
    });
  });

  srv.listen(port, hostname, () => console.log(`> http://${hostname}:${port}`));
});
