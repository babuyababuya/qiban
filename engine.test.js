const assert = require("assert");
const E = require("./engine");
const L = require("./lessons");

function assertStatus(lesson, x, y, status, session) {
  const result = L.judge(lesson, session || L.start(lesson), x, y);
  assert.strictEqual(result.status, status, lesson.id + " " + x + "," + y + " -> " + result.status + " " + (result.reason || ""));
  return result;
}

const lessons = L.ordered();
assert.strictEqual(lessons.length, 16);
assert.strictEqual(new Set(lessons.map((lesson) => lesson.id)).size, 16);

for (const lesson of lessons) {
  const session = L.start(lesson);
  assert.strictEqual(session.board.length, lesson.size, lesson.id + " size");
  for (const key of ["mom", "child", "pro"]) {
    assert.notStrictEqual(lesson.prompt[key], lesson.teach[key], lesson.id + " " + key);
    assert.ok(lesson.prompt[key].length > 8, lesson.id);
  }
  assert.notStrictEqual(lesson.teach.mom, lesson.teach.child);
  assert.notStrictEqual(lesson.teach.child, lesson.teach.pro);

  if (lesson.task === "move") {
    for (const [x, y] of lesson.accept) {
      const result = assertStatus(lesson, x, y, "success");
      if (lesson.minCapture) assert.ok(result.captured.length >= lesson.minCapture, lesson.id + " capture");
      const before = JSON.stringify(session.board);
      assertStatus(lesson, x, y, "success", session);
      assert.strictEqual(JSON.stringify(session.board), before, lesson.id + " mutated");
    }
  } else if (lesson.task === "pick") {
    for (const [x, y] of lesson.accept) assertStatus(lesson, x, y, "success");
  } else if (lesson.task === "pick-all") {
    let current = L.start(lesson);
    lesson.accept.forEach(([x, y], index) => {
      const result = L.judge(lesson, current, x, y);
      current = result.session;
      assert.strictEqual(result.status, index === lesson.accept.length - 1 ? "success" : "continue", lesson.id);
    });
  }

  let wrong = null;
  for (let y = 0; y < lesson.size && !wrong; y += 1) {
    for (let x = 0; x < lesson.size; x += 1) {
      if ((lesson.accept || []).some(([ax, ay]) => ax === x && ay === y)) continue;
      if (lesson.eyes && lesson.eyes.some(([ax, ay]) => ax === x && ay === y)) continue;
      if (session.board[y][x] !== E.EMPTY) continue;
      if (session.ko && session.ko.x === x && session.ko.y === y) continue;
      wrong = [x, y];
      break;
    }
  }
  if (wrong && lesson.task !== "pick-all") {
    const result = L.judge(lesson, L.start(lesson), wrong[0], wrong[1]);
    assert.notStrictEqual(result.status, "success", lesson.id + " wrong point succeeded " + wrong);
  }
}

const kill = L.byId.l9;
const killed = L.judge(kill, L.start(kill), kill.accept[0][0], kill.accept[0][1]);
assert.strictEqual(killed.captured.length, 8);

const eyes = L.byId.l10;
const eyeSession = L.start(eyes);
let eyeCount = 0;
for (let y = 0; y < eyes.size; y += 1) {
  for (let x = 0; x < eyes.size; x += 1) {
    if (E.isEye(eyeSession.board, x, y, E.WHITE)) eyeCount += 1;
  }
}
assert.strictEqual(eyeCount, 2);

const live = L.byId.l16;
const eyePoint = live.eyes[0];
const eyeTry = L.judge(live, L.start(live), eyePoint[0], eyePoint[1]);
assert.strictEqual(eyeTry.status, "illegal");
assert.strictEqual(eyeTry.reason, "eye");

const ko = L.byId.l15;
const koSession = L.start(ko);
assert.ok(koSession.ko);
const koTry = L.judge(ko, koSession, koSession.ko.x, koSession.ko.y);
assert.strictEqual(koTry.reason, "ko");
assert.strictEqual(L.judge(ko, L.start(ko), 4, 4).status, "success");

const atari = E.advise(L.start(L.byId.l6).board, E.BLACK, null);
assert.strictEqual(atari.kind, "atari");
const canTake = E.advise(L.start(L.byId.l3).board, E.BLACK, null);
assert.strictEqual(canTake.kind, "capture");

const mixed = E.create(3);
mixed[0][1] = E.WHITE;
mixed[0][2] = E.WHITE;
mixed[1][0] = E.WHITE;
mixed[1][2] = E.BLACK;
mixed[2][1] = E.WHITE;
mixed[2][2] = E.WHITE;
const suicide = E.playAt(mixed, 1, 1, E.BLACK, null);
assert.strictEqual(suicide.ok, false);
assert.strictEqual(suicide.reason, "suicide");

const oneEye = L.start(L.byId.l9).board;
const [oneX, oneY] = L.byId.l9.accept[0];
assert.strictEqual(E.playAt(oneEye, oneX, oneY, E.WHITE, null).reason, "ownEye");
const liveBoard = L.start(L.byId.l10).board;
const [eyeX, eyeY] = L.byId.l10.accept[0];
assert.strictEqual(E.playAt(liveBoard, eyeX, eyeY, E.BLACK, null).reason, "eye");
assert.strictEqual(E.playAt(liveBoard, eyeX, eyeY, E.WHITE, null).ok, true);

let board = E.create(9);
let koPoint = null;
let color = E.BLACK;
for (let i = 0; i < 40; i += 1) {
  const move = E.botMove(board, color, koPoint);
  if (!move) break;
  const played = E.place(board, move.x, move.y, color, koPoint);
  assert.strictEqual(played.ok, true, "bot illegal");
  board = played.board;
  koPoint = played.ko;
  color = color === E.BLACK ? E.WHITE : E.BLACK;
}

console.log("engine and 16 lessons ok");
