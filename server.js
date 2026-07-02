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

const queues = {};
const rooms = {};
const users = {};

const names = [
  "Таинственная Картошка", "Хитрый Енот", "Сонный Пингвин", "Драматичный Кактус",
  "Невидимый Банан", "Ворчливый Тостер", "Неуклюжий Ниндзя", "Саркастичное Облако",
  "Философский Носок", "Тревожный Авокадо", "Подозрительная Дыня", "Хаотичная Вафля",
  "Экзистенциальный Пончик", "Самоуверенная Улитка", "Пассивно-Агрессивная Лампа",
  "Эмоционально Недоступный Стул", "Главный Герой Голубь",
  "Бредовая Метла", "Безумная Подушка", "Опасно Спокойная Вилка",
  "Грозно Вежливый Козёл", "Ленивый Герой Ложка", "Загадочный Огурец",
  "Паникующий Чайник", "Дерзкий Кроссовок", "Мечтательный Бублик",
];

function rndName() { return names[Math.floor(Math.random() * names.length)]; }
function getQ(c) { if (!queues[c]) queues[c] = []; return queues[c]; }
function rmQ(sid) { for (const c of Object.keys(queues)) queues[c] = queues[c].filter(s => s !== sid); }
function peer(rid, sid) { const r = rooms[rid]; if (!r) return null; return r.p1 === sid ? r.p2 : r.p2 === sid ? r.p1 : null; }

app.prepare().then(() => {
  const srv = createServer((req, res) => handle(req, res, parse(req.url, true)));
  const io = new Server(srv, { cors: { origin: "*" }, transports: ["websocket", "polling"] });

  io.on("connection", (socket) => {
    const name = rndName();
    users[socket.id] = { roomId: null, cat: "any", name };
    socket.emit("your_name", { name });
    io.emit("online", { n: io.engine.clientsCount });

    socket.on("find", ({ cat = "any" } = {}) => {
      const u = users[socket.id]; if (!u) return;
      if (u.roomId) {
        const p = peer(u.roomId, socket.id);
        if (p && users[p]) { io.to(p).emit("ended", { msg: "Собеседник ушёл" }); users[p].roomId = null; }
        delete rooms[u.roomId]; u.roomId = null;
      }
      rmQ(socket.id); u.cat = cat;
      const q = getQ(cat);
      if (q.length > 0) {
        const mid = q.shift();
        if (!io.sockets.sockets.get(mid)) { q.push(socket.id); socket.emit("searching"); return; }
        const rid = uuidv4();
        rooms[rid] = { p1: mid, p2: socket.id, cat };
        users[socket.id].roomId = rid; users[mid].roomId = rid;
        io.to(mid).emit("calling", { rid, name: users[socket.id]?.name || "?" });
        socket.emit("ringing", { rid, name: users[mid]?.name || "?" });
      } else { q.push(socket.id); socket.emit("searching"); }
    });

    socket.on("accept", ({ rid }) => {
      const r = rooms[rid]; if (!r) return;
      io.to(r.p1).emit("accepted", { rid, init: true });
      io.to(r.p2).emit("accepted", { rid, init: false });
    });

    socket.on("decline", ({ rid }) => {
      const r = rooms[rid]; if (!r) return;
      const p = peer(rid, socket.id);
      if (p && users[p]) { io.to(p).emit("declined"); users[p].roomId = null; }
      users[socket.id].roomId = null; delete rooms[rid];
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
      rmQ(socket.id); io.emit("online", { n: io.engine.clientsCount });
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
      io.emit("online", { n: io.engine.clientsCount });
    });
  });

  srv.listen(port, hostname, () => console.log(`> http://${hostname}:${port}`));
});
