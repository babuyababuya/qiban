const assert = require("assert");
const E = require("./engine");
const L = require("./lessons");

function assertStatus(lesson, x, y, status, session) {
  const result = L.judge(lesson, session || L.start(lesson), x, y);
  assert.strictEqual(result.status, status, lesson.id + " " + x + "," + y + " -> " + result.status + " " + (result.reason || ""));
  return result;
}

function playScript(lesson) {
  let session = L.start(lesson);
  lesson.steps.forEach((step, index) => {
    const result = L.judge(lesson, session, step.at[0], step.at[1]);
    const last = index === lesson.steps.length - 1;
    assert.strictEqual(result.status, last ? "success" : "continue", lesson.id + " step " + index + " " + result.status);
    session = result.session;
  });
  return session;
}

const lessons = L.ordered();
assert.strictEqual(lessons.length, 20);
assert.strictEqual(new Set(lessons.map((lesson) => lesson.id)).size, 20);
assert.strictEqual(L.story.length, 8);
assert.strictEqual(L.practices.length, 5);

function checkLesson(lesson) {
  const session = L.start(lesson);
  assert.strictEqual(session.board.length, lesson.size, lesson.id + " size");
  for (const key of ["mom", "child", "pro"]) {
    assert.notStrictEqual(lesson.prompt[key], lesson.teach[key], lesson.id + " " + key);
    assert.ok(lesson.prompt[key].length > 8, lesson.id);
  }
  assert.notStrictEqual(lesson.teach.mom, lesson.teach.child);
  assert.notStrictEqual(lesson.teach.child, lesson.teach.pro);

  if (lesson.task === "script") {
    const done = playScript(lesson);
    assert.ok(done.capturedNow.length >= 1, lesson.id + " script captured");
    return;
  }
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

  if (lesson.free) {
    const eye = (lesson.eyes || [])[0];
    if (eye) assert.strictEqual(L.judge(lesson, L.start(lesson), eye[0], eye[1]).status, "illegal", lesson.id + " eye");
    if (session.ko) assert.strictEqual(L.judge(lesson, session, session.ko.x, session.ko.y).reason, "ko");
    return;
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

for (const lesson of lessons) {
  assert.strictEqual(lesson.drills.length, 2, lesson.id + " drills");
  checkLesson(lesson);
  for (const drill of lesson.drills) checkLesson(drill);
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
assert.strictEqual(L.judge(live, L.start(live), 1, 0).status, "success");

const ko = L.byId.l15;
const koSession = L.start(ko);
assert.ok(koSession.ko);
const koTry = L.judge(ko, koSession, koSession.ko.x, koSession.ko.y);
assert.strictEqual(koTry.reason, "ko");
assert.strictEqual(L.judge(ko, L.start(ko), 4, 4).status, "success");
assert.strictEqual(L.judge(ko, L.start(ko), 4, 3).status, "success");

const snap = playScript(L.byId.l17);
assert.ok(snap.capturedNow.length >= 2, "snapback takes the group");

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

function stonesOf(practice) {
  const next = E.create(practice.size);
  for (const stone of practice.stones) next[stone.y][stone.x] = stone.c === "B" ? E.BLACK : E.WHITE;
  return next;
}

for (const practice of L.practices) {
  if (!practice.line) continue;
  let current = stonesOf(practice);
  let point = null;
  let caps = 0;
  for (const [x, y] of practice.line) {
    const played = E.playAt(current, x, y, E.BLACK, point);
    assert.strictEqual(played.ok, true, practice.id + " line " + x + "," + y + " " + (played.reason || ""));
    current = played.board;
    point = played.ko;
    caps += played.captured.length;
    if (practice.kind === "survive") {
      const group = E.groupAt(current, practice.anchor[0], practice.anchor[1]);
      assert.ok(group.liberties > 1, practice.id + " escaped");
      continue;
    }
    const reply = E.botMove(current, E.WHITE, point, practice.style);
    if (!reply || caps >= practice.goal) continue;
    const answered = E.place(current, reply.x, reply.y, E.WHITE, point);
    assert.strictEqual(answered.ok, true, practice.id + " bot");
    const escape = practice.line[practice.line.length - 1];
    if (practice.style === "miss") {
      assert.notStrictEqual(reply.x + "," + reply.y, escape[0] + "," + escape[1], practice.id + " fled");
    }
    current = answered.board;
    point = answered.ko;
  }
  if (practice.kind !== "survive") assert.ok(caps >= practice.goal, practice.id + " captured " + caps);
}

const missBoard = stonesOf(L.practices[0]);
const atariMove = E.playAt(missBoard, 3, 2, E.BLACK, null);
const missed = E.botMove(atariMove.board, E.WHITE, atariMove.ko, "miss");
assert.notStrictEqual(missed.x + "," + missed.y, "2,3");

const pathLessons = L.pathOrdered();
assert.strictEqual(pathLessons.length, 6);
assert.strictEqual(new Set(pathLessons.map((lesson) => lesson.id)).size, 6);
for (const lesson of pathLessons) {
  assert.strictEqual(lesson.drills.length, 2, lesson.id + " drills");
  checkLesson(lesson);
  for (const drill of lesson.drills) checkLesson(drill);
}
assert.strictEqual(L.judge(L.byId.p1, L.start(L.byId.p1), 1, 1).captured.length, 3);
assert.strictEqual(L.judge(L.byId.p2, L.start(L.byId.p2), 2, 1).captured.length, 0);
assert.strictEqual(L.judge(L.byId.p3, L.start(L.byId.p3), 2, 2).captured.length, 5);
assert.strictEqual(L.judge(L.byId.p4, L.start(L.byId.p4), 2, 1).captured.length, 5);

const opening = E.hintMove(E.create(9), E.BLACK, null);
assert.strictEqual(opening.x + "," + opening.y, "2,2");
assert.strictEqual(opening.kind, "corner");
for (const practice of L.practices) {
  if (!practice.line) continue;
  let current = stonesOf(practice);
  let point = null;
  for (let i = 0; i < practice.line.length; i += 1) {
    const hint = E.hintMove(current, E.BLACK, point);
    const want = practice.line[i];
    assert.strictEqual(hint.x + "," + hint.y, want[0] + "," + want[1], practice.id + " hint " + i);
    const played = E.playAt(current, want[0], want[1], E.BLACK, point);
    current = played.board;
    point = played.ko;
    if (i === practice.line.length - 1) break;
    const reply = E.botMove(current, E.WHITE, point, practice.style);
    if (!reply) break;
    const answered = E.place(current, reply.x, reply.y, E.WHITE, point);
    current = answered.board;
    point = answered.ko;
  }
}
{
  let board = E.create(9);
  let ko = null;
  const caps = [0, 0, 0];
  for (let i = 0; i < 80 && caps[1] < 5 && caps[2] < 5; i += 1) {
    const hint = E.hintMove(board, E.BLACK, ko);
    assert.ok(hint, "hint");
    let played = E.place(board, hint.x, hint.y, E.BLACK, ko);
    assert.strictEqual(played.ok, true, "hint legal");
    board = played.board;
    ko = played.ko;
    caps[1] += played.captured.length;
    if (caps[1] >= 5) break;
    const reply = E.botMove(board, E.WHITE, ko, "greedy");
    if (!reply) break;
    played = E.place(board, reply.x, reply.y, E.WHITE, ko);
    board = played.board;
    ko = played.ko;
    caps[2] += played.captured.length;
  }
  assert.ok(caps[1] >= 5 && caps[1] > caps[2], "hint wins " + caps[1] + "-" + caps[2]);
}

console.log("engine, 20 lessons, 6 path lessons, drills, practices ok");
