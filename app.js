(function () {
  const KEY = "qiban-go-v1";
  const PANE_DEFAULT = { left: 280, right: 320 };
  const GOAL = 5;
  const VOICES = [
    { id: "mom", key: "1", name: "妈妈的话", hint: "家里的比喻" },
    { id: "child", key: "2", name: "孩子的话", hint: "短，能听懂" },
    { id: "pro", key: "3", name: "棋手的话", hint: "术语准确" },
  ];
  const GREET = {
    morning: {
      mom: "早。烧水的这几分钟，够学一手。",
      child: "早安。今天只下一颗豆豆。",
      pro: "晨间一手，温习棋感即可。",
    },
    afternoon: {
      mom: "午后。你先学会，孩子回来再讲。",
      child: "下午的一小盘，马上就懂。",
      pro: "午后温习，宜短不宜长。",
    },
    night: {
      mom: "灯下。学会这一手，睡前讲一句就好。",
      child: "睡觉前听一句棋的故事。",
      pro: "灯下复盘一手，足够。",
    },
  };
  const PERIOD_NAME = { morning: "清晨", afternoon: "午后", night: "灯下" };
  const ADVICE = {
    atari: {
      mom: "你有一块棋只剩一口气了。先把它接出去，或者先把对方提掉。",
      child: "你的豆豆快不能喘气了。先逃跑，或者先去吃掉对方。",
      pro: "己方有块被打吃。应先长出，或先手提子。",
    },
    capture: {
      mom: "棋盘上有子可以提。找只剩一口气的那块，把气占上。",
      child: "有豆豆可以吃。找只剩一个鼻孔的，把它堵住。",
      pro: "存在可提之子。占其最后一气即可。",
    },
    calm: {
      mom: "现在谁也不会马上被提。让自己的子靠在一起，或者去占角。",
      child: "现在都还能喘气。让豆豆手拉手，或者去角落。",
      pro: "双方暂无一眼可提。宜连接，或占角。",
    },
  };
  const MATCH = {
    start: {
      mom: "你执黑，先下。谁先提掉 5 颗，谁就赢。看不懂的时候，就数气。",
      child: "黑豆豆先走。先吃掉 5 颗的人赢。",
      pro: "黑先。先提满 5 子者胜。",
    },
    userCap: {
      mom: "提掉了。你看，是它没气了。",
      child: "吃掉啦。它不能喘气了。",
      pro: "提子。对方该处气尽。",
    },
    botCap: {
      mom: "它吃了你的子。先看自己是不是只剩一口气，下一手记得跑。",
      child: "哎呀，被吃掉一颗。下一手我们跑开。",
      pro: "失子。请检查被提之块的气。",
    },
    win: {
      mom: "你先提满 5 颗。今晚可以告诉孩子：没气的子，就要拿起来。",
      child: "你赢啦。没气的豆豆会被吃掉。",
      pro: "黑先提满 5 子，胜。",
    },
    lose: {
      mom: "这盘它提得更快。被提掉的地方，多半是只剩一口气还没跑。再来一盘就好。",
      child: "这盘被吃掉的更多。下一盘，快喘不动就先跑。",
      pro: "白先提满 5 子。复盘时先看失子前的气。",
    },
    draw: {
      mom: "下了不少手，谁也没先吃满。下一盘专找只剩一口气的子。",
      child: "这盘打平。下一盘去找快不能喘气的豆豆。",
      pro: "手数已满，未分胜负。下一盘宜专寻一气。",
    },
    thinking: {
      mom: "棋伴在看这一手。",
      child: "它在想把豆豆放哪儿。",
      pro: "对方思考中。",
    },
  };
  const HINT_LINE = {
    capture: {
      mom: "红圈是最后一口气。占上它，就能把子提掉。",
      child: "红圈堵住鼻孔，豆豆就回家了。",
      pro: "红圈为最后一气。占上即提。",
    },
    save: {
      mom: "你有一块只剩一口气。先下在红圈，跑出去。",
      child: "你的豆豆快喘不动了。先逃到红圈。",
      pro: "己方被打吃。请先在红圈长出。",
    },
    atari: {
      mom: "下在红圈，对方就只剩一口气。它若忘了跑，下一手可以提。",
      child: "下在红圈，小白只剩一个鼻孔。它若忘了跑，下一手吃掉。",
      pro: "红圈为打吃。对方若不应，下一手可提。",
    },
    chase: {
      mom: "红圈紧挨着对方，再收掉一口。",
      child: "红圈靠着小白，再堵住一个鼻孔。",
      pro: "红圈紧气，再收一口。",
    },
    corner: {
      mom: "第一手先占角。红圈在角上，从这里下起。",
      child: "先把豆豆放在角落。下在红圈。",
      pro: "第一手先占角。请下红圈。",
    },
    connect: {
      mom: "红圈挨着自己的子，连在一起更不容易被提。",
      child: "红圈让豆豆手拉手。",
      pro: "红圈与己子相连。",
    },
    steady: {
      mom: "红圈是这一手比较稳的地方。可以下，也可以自己再找。",
      child: "红圈这个地方比较稳。想下就下。",
      pro: "红圈为当前较稳之一手。",
    },
  };
  const QUIZ_HINT = {
    mom: {
      mom: "这句适合你自己先记住。讲给孩子，要再短、再具体。",
      child: "这句话是讲给自己听的。我们找像故事的那句。",
      pro: "此句是家长的比喻。对孩子宜更短。",
    },
    pro: {
      mom: "术语没有错。等孩子问「这叫什么」，再把这句给他。",
      child: "这些是难词，现在先不说。找豆子和鼻孔那句。",
      pro: "术语正确，但不宜作为第一句。请选口语化的儿童表述。",
    },
  };

  const save = loadSave();
  const state = {
    view: "learn",
    lessonId: "",
    voice: save.voice || "mom",
    session: null,
    solved: false,
    feedback: null,
    drill: null,
    review: false,
    peek: null,
    lift: [],
    storyIndex: 0,
    quiz: null,
    hint: false,
    hintUsed: false,
    pathOpen: false,
    about: false,
    toast: "",
    copied: false,
    practice: null,
  };
  let botToken = 0;
  let liftToken = 0;

  function loadSave() {
    const blank = {
      done: {},
      drills: {},
      taught: {},
      voice: "mom",
      streak: null,
      practiceWins: 0,
      clean: 0,
      lamp: "auto",
      seen: false,
      panes: null,
      track: "base",
    };
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
      const next = Object.assign(blank, parsed);
      if (!next.done || typeof next.done !== "object") next.done = {};
      if (!next.drills || typeof next.drills !== "object") next.drills = {};
      if (!next.taught || typeof next.taught !== "object") next.taught = {};
      if (!next.panes || typeof next.panes.left !== "number" || typeof next.panes.right !== "number") next.panes = null;
      if (next.track !== "path") next.track = "base";
      return next;
    } catch (error) {
      return blank;
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch (error) {
      state.toast = "这个浏览器没有记住进度，今天仍可以学。";
    }
  }

  function dayStamp(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function period() {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 18) return "night";
    if (hour < 11) return "morning";
    return "afternoon";
  }

  function lampOn() {
    if (save.lamp === "on") return true;
    if (save.lamp === "off") return false;
    return period() === "night";
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ordered() {
    return save.track === "path" ? GoLessons.pathOrdered() : GoLessons.ordered();
  }

  function frontierIndex() {
    const list = ordered();
    const index = list.findIndex((lesson) => !save.done[lesson.id]);
    return index === -1 ? list.length - 1 : index;
  }

  function isOpen(id) {
    const list = ordered();
    return list.findIndex((lesson) => lesson.id === id) <= frontierIndex();
  }

  function dayKey(stamp) {
    const date = new Date(stamp);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function drillRecord(id) {
    if (!save.drills[id] || typeof save.drills[id] !== "object") save.drills[id] = {};
    return save.drills[id];
  }

  function nextDrill(lesson) {
    return (lesson.drills || []).find((drill) => !drillRecord(lesson.id)[drill.id]) || null;
  }

  function isMastered(lesson) {
    return !!save.done[lesson.id] && !nextDrill(lesson);
  }

  function dueReview() {
    const today = dayStamp(0);
    for (const lesson of ordered()) {
      const seenAt = save.done[lesson.id];
      if (!seenAt || dayKey(seenAt) === today) continue;
      const drill = nextDrill(lesson);
      if (drill) return { lesson, drill };
    }
    return null;
  }

  function activeLesson() {
    return state.drill || GoLessons.byId[state.lessonId];
  }

  function captureVoice(count, who) {
    const n = count || 1;
    if (who === "user") {
      if (n <= 1) {
        return {
          mom: "这一颗只剩一口气。你占上了，把它拿回家。",
          child: "这一颗豆豆不能喘气了，回家啦。",
          pro: "一子气尽，提。",
        };
      }
      return {
        mom: "这 " + n + " 颗连在一起，最后一口气被占上，一起拿回家。",
        child: "这 " + n + " 颗豆豆手拉手，一起回家啦。",
        pro: n + " 子气尽，整块提取。",
      };
    }
    if (n <= 1) {
      return {
        mom: "它占了你最后一口气，把这一颗提走了。",
        child: "你的豆豆被拿走了。它堵住了最后一个鼻孔。",
        pro: "失一子。该子气尽。",
      };
    }
    return {
      mom: "它把你这 " + n + " 颗一起提走了。它们的气是一起算的。",
      child: "你的 " + n + " 颗豆豆一起被拿走了。",
      pro: "失 " + n + " 子。整块气尽。",
    };
  }

  function rankInfo() {
    const list = ordered();
    const done = list.filter((lesson) => save.done[lesson.id]).length;
    const mastered = list.filter(isMastered).length;
    const taught = list.filter((lesson) => save.taught[lesson.id]).length;
    const wins = save.practiceWins || 0;
    const steps = save.track === "path"
      ? [
        [0, "闯关还没开始"],
        [1, "见过死活"],
        [2, "会点眼"],
        [3, "会双打"],
        [4, "会接不归"],
        [5, "会小飞"],
        [6, "会数空"],
      ]
      : [
        [0, "还没落子"],
        [1, "见过棋盘"],
        [3, "会认气"],
        [6, "会提子"],
        [9, "懂窗户"],
        [12, "会拉手"],
        [16, "能认旧图"],
        [20, "会讲魔法"],
      ];
    let name = steps[0][1];
    for (const [count, label] of steps) if (mastered >= count) name = label;
    if (!mastered && done) name = "见过，还要再认";
    if (mastered >= 20 && taught >= 10 && wins >= 1) name = "家中小高手";
    return { name, done, mastered, taught, wins, total: list.length };
  }

  function streakText() {
    const streak = save.streak;
    if (!streak || !streak.n) return "还没开始连续学习";
    if (streak.last === dayStamp(0)) return "连续 " + streak.n + " 天";
    if (streak.last === dayStamp(-1)) return "连续 " + streak.n + " 天，今天还没学";
    return "间断了。今天一手，就能重新接上";
  }

  function bootLesson(id) {
    const lesson = GoLessons.byId[id];
    state.lessonId = id;
    state.drill = null;
    state.review = false;
    state.view = "learn";
    state.session = GoLessons.start(lesson);
    state.solved = false;
    state.feedback = null;
    state.quiz = null;
    state.peek = null;
    state.hint = false;
    state.hintUsed = false;
    state.about = false;
    state.copied = false;
  }

  function bootDrill(lesson, drill, review) {
    state.lessonId = lesson.id;
    state.drill = drill;
    state.review = !!review;
    state.view = "learn";
    state.session = GoLessons.start(drill);
    state.solved = false;
    state.feedback = null;
    state.quiz = null;
    state.peek = null;
    state.hint = false;
    state.hintUsed = false;
    state.about = false;
  }

  function openToday() {
    const due = dueReview();
    if (due) bootDrill(due.lesson, due.drill, true);
    else bootLesson(ordered()[frontierIndex()].id);
  }

  function shuffle(id) {
    const keys = ["mom", "child", "pro"];
    let hash = 2166136261;
    for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const random = () => {
      hash = Math.imul(hash ^ (hash >>> 16), 2246822519);
      return (hash >>> 0) / 4294967296;
    };
    for (let index = keys.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      const hold = keys[index];
      keys[index] = keys[swap];
      keys[swap] = hold;
    }
    return keys;
  }

  function markDone(id) {
    if (save.done[id]) return;
    save.done[id] = Date.now();
    const today = dayStamp(0);
    if (!save.streak || save.streak.last !== today) {
      if (save.streak && save.streak.last === dayStamp(-1)) save.streak = { last: today, n: save.streak.n + 1 };
      else save.streak = { last: today, n: 1 };
    }
    if (!state.hintUsed) save.clean = (save.clean || 0) + 1;
    persist();
  }

  function speak(text, rate) {
    if (!window.speechSynthesis || !text) {
      state.toast = "这台设备读不出来，你可以自己念给孩子听。";
      render();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate || 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function boardHtml(board, options) {
    const size = board.length;
    let cells = "";
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const value = board[y][x];
        const edges = [
          x === 0 ? "edge-l" : "",
          x === size - 1 ? "edge-r" : "",
          y === 0 ? "edge-t" : "",
          y === size - 1 ? "edge-b" : "",
        ].filter(Boolean).join(" ");
        const star = size === 9 && [2, 4, 6].includes(x) && [2, 4, 6].includes(y);
        const hinted = options.hints && options.hints.some(([hx, hy]) => hx === x && hy === y);
        const liberty = options.liberties && options.liberties.some(([lx, ly]) => lx === x && ly === y);
        const lifting = options.lift && options.lift.find((item) => item.x === x && item.y === y);
        const glow = options.glow && options.glow.some(([gx, gy]) => gx === x && gy === y);
        const marked = options.marks && options.marks.some(([mx, my]) => mx === x && my === y);
        const last = options.last && options.last.x === x && options.last.y === y && value;
        const ko = options.ko && options.ko.x === x && options.ko.y === y && !value;
        const stone = value === 1 ? "black" : value === 2 ? "white" : "";
        const liftStone = !stone && lifting ? lifting.c : "";
        cells += `<button type="button" class="pt ${edges}${hinted ? " hint" : ""}${liberty ? " lib" : ""}" data-act="play" data-x="${x}" data-y="${y}" aria-label="第 ${y + 1} 行，第 ${x + 1} 列">
          <i class="h"></i><i class="v"></i>
          ${star ? '<i class="star"></i>' : ""}
          ${stone ? `<i class="stone ${stone}${glow ? " glow" : ""}${last ? " last" : ""}"></i>` : ""}
          ${liftStone ? `<i class="stone ${liftStone} lift"></i>` : ""}
          ${marked ? '<i class="mark"></i>' : ""}
          ${ko ? '<i class="ko-tag">劫</i>' : ""}
          ${y === size - 1 ? `<i class="coord coord-x">${x + 1}</i>` : ""}
          ${x === size - 1 ? `<i class="coord coord-y">${y + 1}</i>` : ""}
        </button>`;
      }
    }
    const quiet = options.quiet ? " quiet" : "";
    const shake = options.shake ? " shake" : "";
    return `<div class="board${quiet}${shake}" style="--n:${size}" data-turn="${options.turn || "B"}">${cells}</div>`;
  }

  function lessonHints(lesson) {
    if (!state.hint) return [];
    if (lesson.task === "script") {
      const spec = lesson.steps[state.session.step || 0];
      return spec ? [spec.at] : [];
    }
    if (lesson.task === "pick-all") {
      return lesson.accept.filter(([x, y]) => !state.session.marks.some(([mx, my]) => mx === x && my === y));
    }
    return lesson.accept || [];
  }

  function pathHtml() {
    const info = rankInfo();
    const track = save.track === "path" ? "path" : "base";
    const source = track === "path" ? GoLessons.pathChapters : GoLessons.chapters;
    const chapters = source.map((chapter) => {
      const items = chapter.ids.map((id) => {
        const lesson = GoLessons.byId[id];
        const seen = !!save.done[id];
        const mastered = isMastered(lesson);
        const taught = !!save.taught[id];
        const current = state.view === "learn" && state.lessonId === id;
        const locked = !isOpen(id);
        const note = locked ? "先见过上一手" : mastered ? "会了" : seen ? "见过，还可以再认" : "";
        return `<button type="button" class="lesson-btn${current ? " current" : ""}${locked ? " locked" : ""}" data-act="lesson" data-id="${id}">
          <i class="pip${mastered ? " mastered" : seen ? " seen" : ""}${taught ? " taught" : ""}${current ? " now" : ""}"></i>
          <span>${esc(lesson.title)}${note ? "<small>" + note + "</small>" : ""}</span>
        </button>`;
      }).join("");
      return `<div class="chapter"><b>${esc(chapter.title)}</b><span>${esc(chapter.blurb)}</span>${items}</div>`;
    }).join("");
    const later = save.track === "path"
      ? `<button type="button" class="ghost-btn" data-act="practice">这一单元的小对局</button>`
      : `<div class="chapter"><b>再往后</b><span>死活、双打和收官在闯关 0.2。点进去就能下。</span>
          <button type="button" class="lesson-btn" data-act="track" data-track="path" data-id="p1">
            <i class="pip"></i><span>死活小题<small>到闯关里下这一手</small></span>
          </button>
          <button type="button" class="lesson-btn" data-act="track" data-track="path" data-id="p6">
            <i class="pip"></i><span>收官<small>数哪一边的空多</small></span>
          </button>
        </div>`;
    const practiceReady = !!save.done.l3 || !!save.done.p1;
    return `<section class="panel">
      <p class="meta">${PERIOD_NAME[period()]} · ${esc(streakText())}</p>
      <div class="rank">${esc(info.name)}</div>
      <p class="meta">见过 ${info.done}/${info.total} 手<br>再认后会了 ${info.mastered} 手<br>能讲给孩子 ${info.taught} 句<br>吃子棋胜 ${info.wins} 盘</p>
      <div class="track-switch">
        <button type="button" class="${track === "base" ? "on" : ""}" data-act="track" data-track="base">幼儿园 0.1</button>
        <button type="button" class="${track === "path" ? "on" : ""}" data-act="track" data-track="path">闯关 0.2</button>
      </div>
      <div class="path-actions">
        <button type="button" class="primary" data-act="today">回到今日这一手</button>
        <button type="button" data-act="practice">${practiceReady ? "下吃子棋" : "吃子棋未解锁"}</button>
        <button type="button" data-act="sleep">睡前小抄</button>
      </div>
    </section>
    <section class="panel">
      <h2>${track === "path" ? "闯关的路" : "循序的路"}</h2>
      <p class="meta">${track === "path" ? "一手一个小题。先下对，再换一张图认。单元末尾可以小对局。" : "幼儿园的二十手。先见过，再认一张才算会。"}</p>
      ${chapters}
      ${later}
      <button type="button" class="ghost-btn" data-act="reset-all">重新开始</button>
    </section>`;
  }

  function welcomeHtml() {
    if (save.seen) return "";
    return `<section class="welcome">
      <div class="welcome-copy">
        <h2>每天一手，就够了</h2>
        <p>第一张图只算见过，换一张再认，才算会。你先学会，再用孩子的那一句讲给他。</p>
      </div>
      <button type="button" class="primary" data-act="seen">从这一手开始</button>
    </section>`;
  }

  function learnHtml() {
    const parent = GoLessons.byId[state.lessonId];
    const lesson = activeLesson();
    const list = ordered();
    const index = list.findIndex((item) => item.id === parent.id);
    const chapter = [...GoLessons.chapters, ...GoLessons.pathChapters].find((item) => item.ids.includes(parent.id)) || { title: "" };
    const picking = lesson.task === "pick" || lesson.task === "pick-all";
    const colorName = lesson.toPlay === "W" ? "白" : "黑";
    const hand = state.drill
      ? "换一张棋盘，再认一次"
      : picking
        ? "这一手不用落子，点空着的交叉点"
        : `这一手请下${colorName}子`;
    const stone = lesson.toPlay === "W" ? "white" : "black";
    let banner = "";
    if (state.feedback && state.feedback.status === "illegal") {
      banner = `<div class="banner bad" role="status">${esc(GoLessons.reasonLine(state.feedback.reason, state.voice))}</div>`;
    } else if (state.feedback && state.feedback.status === "wrong") {
      const text = state.feedback.reason === "stone"
        ? GoLessons.reasonLine("stone", state.voice)
        : lesson.wrong[state.voice];
      banner = `<div class="banner bad" role="status">${esc(text)}</div>`;
    } else if (state.feedback && state.feedback.status === "continue") {
      banner = `<div class="banner" role="status">${esc(lesson.partial[state.voice])}</div>`;
    } else if (state.solved) {
      const taken = state.session.capturedNow ? state.session.capturedNow.length : 0;
      const named = taken ? captureVoice(taken, "user")[state.voice] : "这一手对了。";
      const fresh = state.hintUsed ? "" : " 没有看提示。";
      banner = `<div class="banner good" role="status">${esc(named)}${fresh}</div>`;
    } else if (!state.drill && save.done[parent.id]) {
      banner = `<div class="banner">这手见过了。可以再摆一次，也可以去再认一张没见过的图。</div>`;
    } else if (state.review) {
      banner = `<div class="banner">昨天那手，换张图认一次。大约二十秒。</div>`;
    }
    if (state.peek) {
      banner = `<div class="banner" role="status">这颗还有 ${state.peek.count} 口气。斜着的空位不算。</div>` + banner;
    }
    const hints = lessonHints(lesson);
    const wrongNow = state.feedback && (state.feedback.status === "wrong" || state.feedback.status === "illegal");
    const board = boardHtml(state.session.board, {
      turn: picking ? "pick" : lesson.toPlay,
      last: state.session.last,
      hints,
      glow: lesson.glow,
      marks: state.session.marks,
      ko: lesson.showKo ? state.session.ko : null,
      liberties: state.peek ? state.peek.points : [],
      lift: state.lift,
      quiet: state.solved,
      shake: !!wrongNow,
    });
    const showNext = state.solved || (!state.drill && !!save.done[parent.id]);
    const pending = nextDrill(parent);
    const again = showNext && pending
      ? `<button type="button" class="primary" data-act="again">再认一张</button>`
      : "";
    const nextLabel = state.drill ? "回到今天的新手" : index === list.length - 1 ? "去睡前小抄" : "下一手";
    const minutes = state.drill ? "大约二十秒" : "大约 " + lesson.minutes + " 分钟";
    const note = state.toast ? `<div class="toast" role="status">${esc(state.toast)}</div>` : "";
    return `${welcomeHtml()}
      <div class="board-wrap">
        <div class="hand">${picking && !state.drill ? "" : `<i class="stone ${stone}"></i>`}<span>${hand}</span></div>
        <div class="board-box">${board}</div>
      </div>
      ${note}
      ${banner}
      <div class="under-board">
        <p class="fine">点交叉，不点格子。按住一颗子可以数气。${esc(chapter.title)} · 第 ${index + 1} / ${list.length} 手 · ${minutes}</p>
        <div class="playbar">
          <button type="button" class="path-toggle" data-act="toggle-path">${state.pathOpen ? "收起课程" : "全部课程 " + rankInfo().done + "/" + rankInfo().total}</button>
          <button type="button" data-act="hint">${state.hint ? "收起提示" : "看提示"}</button>
          <button type="button" data-act="reset">再摆一次</button>
          ${index > 0 && !state.drill ? '<button type="button" data-act="prev">上一手</button>' : ""}
          ${again}
          ${showNext ? `<button type="button" data-act="next">${nextLabel}</button>` : ""}
        </div>
      </div>`;
  }

  function voiceHtml() {
    if (state.view === "sleep") return "";
    if (state.view === "practice") return practiceVoiceHtml();
    if (state.view === "story") return "";
    const lesson = activeLesson();
    const switcher = VOICES.map((voice) => `<button type="button" class="${voice.id}${state.voice === voice.id ? " on" : ""}" data-act="voice" data-voice="${voice.id}">${voice.name}<small>${voice.key} · ${voice.hint}</small></button>`).join("");
    let body = "";
    if (state.solved && state.quiz && !state.quiz.revealed) {
      const options = state.quiz.order.map((who) => {
        const bad = state.quiz.bad === who ? " bad" : "";
        return `<button type="button" class="quiz-opt${bad}" data-act="quiz" data-who="${who}">${esc(lesson.teach[who])}</button>`;
      }).join("");
      const hint = state.quiz.bad ? `<p class="meta">${esc(QUIZ_HINT[state.quiz.bad][state.voice])}</p>` : "";
      body = `<section class="panel">
        <h2>讲给孩子之前</h2>
        <p>标签盖住了。如果现在念给孩子听，你选哪一句？</p>
        ${options}
        ${hint}
        <p><button type="button" class="ghost-btn" data-act="reveal">先看答案</button></p>
      </section>`;
    } else {
      const pack = state.solved ? lesson.teach : lesson.prompt;
      const field = state.solved ? "teach" : "prompt";
      const cards = VOICES.map((voice) => `<article class="card voice ${voice.id}${state.voice === voice.id ? " active" : ""}">
        <header><strong>${voice.name}</strong><span>${voice.hint}</span><button type="button" data-act="speak" data-field="${field}" data-who="${voice.id}">朗读</button></header>
        <p>${esc(pack[voice.id])}</p>
      </article>`).join("");
      const stamp = state.solved && save.taught[lesson.id]
        ? `<div class="stamp-row"><div class="stamp">能讲<br>给孩子</div></div>`
        : "";
      const read = state.solved
        ? `<button type="button" class="primary" data-act="speak" data-field="teach" data-who="child">读给孩子听</button>`
        : "";
      body = `${stamp}${cards}<div class="playbar">${read}</div>`;
    }
    const note = state.quiz && state.quiz.revealed && state.quiz.gaveUp
      ? `<p class="meta">看过答案了。再摆一次，自己选出孩子的那句，才算能脱口讲出。</p>`
      : `<p class="meta">「妈妈的话」是一种温柔说法，爸爸讲也一样。按 1、2、3 可以换。</p>`;
    return `<div class="switcher">${switcher}</div>${note}${body}`;
  }

  function sleepHtml() {
    const learned = ordered().filter((lesson) => save.done[lesson.id]);
    if (!learned.length) {
      return `<section class="panel"><h2>睡前小抄</h2><p>还没有可以讲的话。先学一手，这里会留下孩子听得懂的那一句。</p></section>`;
    }
    const cards = learned.map((lesson) => `<article class="sleep-card">
      <header><h2>${esc(lesson.title)}</h2><button type="button" class="speak" data-act="speak" data-lesson="${lesson.id}" data-field="teach" data-who="child">读给孩子听</button></header>
      <p class="kicker">孩子的话</p>
      <p class="child-line">${esc(lesson.teach.child)}</p>
      <p class="kicker">妈妈的话</p>
      <p>${esc(lesson.teach.mom)}</p>
      <p class="kicker">棋手的话</p>
      <p>${esc(lesson.teach.pro)}</p>
    </article>`).join("");
    return `<section class="panel">
      <h2>今晚可以讲的</h2>
      <p class="meta">只收已经学会的手，避免把没弄懂的讲出去。孩子的那句放在最上面。</p>
      <div class="sleep-tools">
        <button type="button" class="primary" data-act="copy">${state.copied ? "已复制" : "复制小抄"}</button>
        <button type="button" data-act="print">打印</button>
      </div>
    </section>
    <div class="sleep-list">${cards}</div>`;
  }

  function practicePack(practice) {
    if (!practice) return MATCH.start;
    const spec = practice.spec;
    if (practice.thinking) return MATCH.thinking;
    if (practice.event === "illegal" && practice.illegal) return practice.illegal;
    if (practice.over === "user") return spec.win || MATCH.win;
    if (practice.over === "bot") return MATCH.lose;
    if (practice.over === "draw") return MATCH.draw;
    if (practice.event === "userCap") return captureVoice(practice.lastCaps, "user");
    if (practice.event === "botCap") return captureVoice(practice.lastCaps, "bot");
    if (practice.event === "survive") return spec.win;
    if (state.hint && practice.event !== "illegal") {
      const hint = practiceHint(practice);
      if (hint && HINT_LINE[hint.kind]) return HINT_LINE[hint.kind];
    }
    if (practice.event === "start") return spec.intro || MATCH.start;
    const advice = GoEngine.advise(practice.board, GoEngine.BLACK, practice.ko);
    if (!advice || advice.kind === "calm") return null;
    return ADVICE[advice.kind] || null;
  }

  function practiceVoiceHtml() {
    const pack = practicePack(state.practice);
    const switcher = VOICES.map((voice) => `<button type="button" class="${voice.id}${state.voice === voice.id ? " on" : ""}" data-act="voice" data-voice="${voice.id}">${voice.name}<small>${voice.key}</small></button>`).join("");
    const cards = pack ? VOICES.map((voice) => `<article class="card ${voice.id}${state.voice === voice.id ? " active" : ""}">
      <header><strong>${voice.name}</strong><button type="button" data-act="speak" data-who="${voice.id}" data-from="practice">朗读</button></header>
      <p>${esc(pack[voice.id])}</p>
    </article>`).join("") : "";
    const body = pack
      ? cards
      : `<p class="meta">这一手先看气。按住一颗子，数它还剩几口。斜着的空位不算。</p>`;
    return `<div class="switcher">${switcher}</div><p class="meta">${esc(state.practice.spec.title)}。规则仍然由棋盘判定。</p>${body}`;
  }

  function practiceHint(practice) {
    if (!practice || practice.over || practice.thinking) return null;
    return GoEngine.hintMove(practice.board, GoEngine.BLACK, practice.ko);
  }

  function practiceHtml() {
    const practice = state.practice;
    const goal = practice.goal || GOAL;
    const hint = state.hint ? practiceHint(practice) : null;
    const board = boardHtml(practice.board, {
      turn: "B",
      last: practice.last,
      hints: hint ? [[hint.x, hint.y]] : [],
      liberties: state.peek ? state.peek.points : [],
      lift: state.lift,
      quiet: !!practice.over || practice.thinking,
    });
    const pack = practicePack(practice);
    const end = practice.over && pack ? `<div class="banner good">${esc(pack[state.voice])}</div>` : "";
    const peek = state.peek ? `<div class="banner">这颗还有 ${state.peek.count} 口气。斜着的空位不算。</div>` : "";
    const open = GoLessons.practices.filter((item) => save.done[item.need]);
    const chips = open.map((item) => `<button type="button" class="${item.id === practice.spec.id ? "primary" : ""}" data-act="practice" data-id="${item.id}">${esc(item.title)}</button>`).join("");
    const note = practice.kind === "survive"
      ? "你只剩一口气。先跑出去。"
      : practice.spec.size === 9
        ? "九路棋盘。先提满 " + goal + " 颗的一方赢。"
        : esc(practice.spec.blurb);
    const hintLine = hint ? `<div class="banner">${esc(HINT_LINE[hint.kind][state.voice])}</div>` : "";
    return `<div class="board-wrap">
        <div class="score"><span>你提了 <b>${practice.caps[1]}</b> / ${goal}</span><span>棋伴提了 <b>${practice.caps[2]}</b> / ${goal}</span></div>
        <div class="hand"><i class="stone black"></i><span>${practice.over ? "这盘停在这一下" : practice.thinking ? "棋伴在下白子" : "你下黑子"}</span></div>
        <div class="board-box">${board}</div>
        <p class="fine">${note} 按住一颗子可以数气。可以悔棋，也可以看提示。</p>
      </div>
      ${peek}${hintLine}${end}
      <div class="playbar chips">${chips}</div>
      <div class="playbar">
        <button type="button" class="path-toggle" data-act="toggle-path">全部课程</button>
        <button type="button" data-act="hint" ${practice.over || practice.thinking ? "disabled" : ""}>${state.hint ? "收起提示" : "看提示"}</button>
        <button type="button" data-act="undo" ${practice.history.length ? "" : "disabled"}>悔棋</button>
        <button type="button" data-act="practice" data-id="${practice.spec.id}">再来一盘</button>
        <button type="button" class="primary" data-act="today">回到课程</button>
      </div>`;
  }

  function storyHtml() {
    const frames = GoLessons.story;
    const index = Math.max(0, Math.min(state.storyIndex, frames.length - 1));
    const frame = frames[index];
    const lesson = GoLessons.byId[frame.id];
    const open = !!save.done[frame.id];
    const board = open
      ? boardHtml(GoLessons.start(lesson).board, { turn: lesson.toPlay, quiet: true, glow: lesson.glow })
      : "";
    const body = open
      ? `<p class="child-line">${esc(frame.line)}</p>`
      : `<p>这手还没见过。先去学「${esc(lesson.title)}」，故事才会接到这里。</p>`;
    return `<section class="panel">
      <h2>一盘小故事</h2>
      <p class="meta">第 ${index + 1} / ${frames.length} 格 · ${esc(frame.caption)}</p>
      ${open ? `<div class="board-wrap"><div class="board-box">${board}</div></div>` : ""}
      ${body}
      <div class="playbar">
        ${index > 0 ? '<button type="button" data-act="story-prev">上一格</button>' : ""}
        ${index < frames.length - 1 ? '<button type="button" class="primary" data-act="story-next">下一格</button>' : ""}
        ${open ? `<button type="button" data-act="speak" data-lesson="${frame.id}" data-field="teach" data-who="child">读给孩子听</button>` : ""}
      </div>
    </section>`;
  }

  function aboutHtml() {
    if (!state.about) return "";
    return `<div class="mask">
      <button type="button" class="mask-hit" data-act="close-about" aria-label="关闭说明"></button>
      <article class="about">
        <h2>棋伴怎么教</h2>
        <p>同一手棋，有三种说法。妈妈的话用家里的事来记，孩子的话短、能听懂，棋手的话用真正的术语。</p>
        <p>能不能下、有没有气、提得掉提不掉，都由围棋规则当场算。这里不会临时编一手棋，所以气和劫不会被讲错。</p>
        <p>用法只有一句：你先花五分钟学会，再把孩子的那一句讲给他。清晨、午后、灯下都可以。进度记在这台设备上，断网也能打开。</p>
        <p>第一张图只算见过。换一张没见过的棋盘再认出来，才算会。吃子从摆好的小残局开始，棋伴有时会忘了跑。按住一颗子，可以数它还剩几口气。</p>
        <p>二十手走完，你能看懂气、提子、打吃、眼、连接、劫，还有先送再提、假窗、追吃和沿边走。想继续，打开闯关 0.2：死活、双打、小飞和收官，仍然是你先懂，再用孩子的话讲。</p>
        <button type="button" class="primary" data-act="close-about">知道了</button>
      </article>
    </div>`;
  }

  function render() {
    document.body.classList.toggle("lamp", lampOn());
    const info = rankInfo();
    const lesson = GoLessons.byId[state.lessonId];
    document.title = state.view === "practice"
      ? "棋伴 · " + (state.practice && state.practice.spec ? state.practice.spec.title : "吃子棋")
      : state.view === "sleep"
        ? "棋伴 · 睡前小抄"
        : state.view === "story"
          ? "棋伴 · 一盘小故事"
          : "棋伴 · " + (state.drill ? "再认 " : "") + lesson.title;
    const stage = state.view === "sleep"
      ? sleepHtml()
      : state.view === "story"
        ? storyHtml()
        : state.view === "practice"
          ? practiceHtml()
          : learnHtml();
    const toast = state.toast && state.view !== "learn"
      ? `<div class="toast" role="status">${esc(state.toast)}</div>`
      : "";
    document.getElementById("app").innerHTML = `<div class="shell">
      <header class="top">
        <div class="brand">
          <div class="seal" aria-hidden="true">伴</div>
          <div>
            <p class="tag">父母的围棋伴侣 · ${PERIOD_NAME[period()]}</p>
            <h1>棋伴</h1>
            <p class="greet">${esc(GREET[period()][state.voice])}</p>
          </div>
        </div>
        <div class="tools">
          <button type="button" data-act="lamp">${lampOn() ? "看白天" : "换灯下"}</button>
          <button type="button" data-act="about">这是什么</button>
          <button type="button" data-act="story">一盘小故事</button>
          <button type="button" data-act="sleep">睡前小抄</button>
        </div>
      </header>
      ${toast}
      <div class="layout${state.pathOpen ? " path-open" : ""}${state.view === "sleep" || state.view === "story" ? " sleep" : ""}">
        <aside class="path">${pathHtml()}</aside>
        <div class="split split-left" data-split="left" role="separator" aria-orientation="vertical" aria-label="拖动调整左侧和棋盘" tabindex="0"></div>
        <main class="stage">${stage}</main>
        <div class="split split-right" data-split="right" role="separator" aria-orientation="vertical" aria-label="拖动调整棋盘和右侧" tabindex="0"></div>
        <aside class="voices">${voiceHtml()}</aside>
      </div>
      <p class="fine">离线可用 · 见过 ${info.done} 手 · 会了 ${info.mastered} 手 · 气尽即提 · 不许自杀 · 单劫不能马上提回 · 现在的段位：${esc(info.name)}</p>
    </div>${aboutHtml()}`;
    applyPanes();
    fitBoard();
    alignLessonWithBoard();
  }

  function fitBoard() {
    const stage = document.querySelector(".stage");
    const wrap = stage && stage.querySelector(".board-wrap");
    const box = wrap && wrap.querySelector(".board-box");
    if (!box) return;
    if (window.innerWidth < 981) {
      box.style.width = "";
      stage.querySelectorAll(":scope > .banner, :scope > .under-board").forEach((el) => {
        el.style.width = "";
        el.style.maxWidth = "";
      });
      return;
    }
    stage.querySelectorAll(":scope > .banner, :scope > .under-board").forEach((el) => {
      el.style.width = "";
      el.style.maxWidth = "";
    });
    const footer = document.querySelector(".shell > .fine");
    const hand = wrap.querySelector(".hand");
    const handInFlow = hand && getComputedStyle(hand).position !== "absolute";
    const banner = stage.querySelector(":scope > .banner");
    const under = stage.querySelector(":scope > .under-board");
    const toast = stage.querySelector(":scope > .toast");
    const bannerH = banner ? banner.offsetHeight : 0;
    const underH = under ? under.offsetHeight : 0;
    const toastH = toast ? toast.offsetHeight : 0;
    const extras = [];
    const score = wrap.querySelector(".score");
    const wrapFine = wrap.querySelector(":scope > .fine");
    if (score) extras.push(score);
    if (wrapFine) extras.push(wrapFine);
    stage.querySelectorAll(":scope > .playbar").forEach((el) => extras.push(el));
    const extraH = extras.reduce((sum, el) => sum + el.offsetHeight, 0) + extras.length * 4;
    const top = handInFlow
      ? hand.getBoundingClientRect().bottom + 2
      : stage.getBoundingClientRect().top + 2;
    const bottom = footer ? footer.getBoundingClientRect().top : window.innerHeight;
    const reserve = bannerH + underH + toastH + extraH + 14;
    const pad = getComputedStyle(box);
    const padX = (parseFloat(pad.paddingLeft) || 0) + (parseFloat(pad.paddingRight) || 0);
    const padY = (parseFloat(pad.paddingTop) || 0) + (parseFloat(pad.paddingBottom) || 0);
    const room = bottom - top - reserve - padY + padX;
    const size = Math.max(320, Math.min(stage.clientWidth, room));
    box.style.width = size + "px";
    if (under && Math.abs(under.offsetHeight - underH) > 4) {
      const again = bottom - top - bannerH - (under ? under.offsetHeight : 0) - (toast ? toast.offsetHeight : 0) - extraH - 14 - padY + padX;
      box.style.width = Math.max(320, Math.min(stage.clientWidth, again)) + "px";
    }
  }

  function panePrefs() {
    if (save.panes && typeof save.panes.left === "number" && typeof save.panes.right === "number") return save.panes;
    return PANE_DEFAULT;
  }

  function paneBounds(layoutWidth, sleep) {
    const splits = sleep ? 12 : 24;
    const leftMin = 220;
    const rightMin = sleep ? 0 : 240;
    const centerMin = 320;
    const leftMax = Math.max(leftMin, layoutWidth - splits - rightMin - centerMin);
    const rightMax = Math.max(rightMin, layoutWidth - splits - leftMin - centerMin);
    return { splits, leftMin, leftMax, rightMin, rightMax, centerMin };
  }

  function applyPanes() {
    const layout = document.querySelector(".layout");
    if (!layout || window.innerWidth < 981) return;
    const sleep = layout.classList.contains("sleep");
    const prefs = panePrefs();
    const bounds = paneBounds(layout.clientWidth, sleep);
    let left = Math.max(bounds.leftMin, Math.min(bounds.leftMax, prefs.left));
    let right = sleep ? 0 : Math.max(bounds.rightMin, Math.min(bounds.rightMax, prefs.right));
    const center = layout.clientWidth - left - right - bounds.splits;
    if (center < bounds.centerMin) {
      const short = bounds.centerMin - center;
      const leftSlack = Math.max(0, left - bounds.leftMin);
      const rightSlack = Math.max(0, right - bounds.rightMin);
      const slack = leftSlack + rightSlack;
      if (slack > 0) {
        const take = Math.min(short, slack);
        left -= take * (leftSlack / slack);
        right -= sleep ? 0 : take * (rightSlack / slack);
      }
    }
    left = Math.round(Math.max(bounds.leftMin, left));
    right = sleep ? 0 : Math.round(Math.max(bounds.rightMin, right));
    layout.style.gridTemplateColumns = sleep
      ? `${left}px 12px minmax(0, 1fr)`
      : `${left}px 12px minmax(0, 1fr) 12px ${right}px`;
  }

  function dragPane(which, clientX) {
    const layout = document.querySelector(".layout");
    if (!layout) return;
    const sleep = layout.classList.contains("sleep");
    const rect = layout.getBoundingClientRect();
    const bounds = paneBounds(rect.width, sleep);
    const path = layout.querySelector(".path");
    const voices = layout.querySelector(".voices");
    let left = path ? path.getBoundingClientRect().width : bounds.leftMin;
    let right = !sleep && voices ? voices.getBoundingClientRect().width : 0;
    if (which === "left") left = clientX - rect.left;
    else right = rect.right - clientX;
    left = Math.max(bounds.leftMin, Math.min(bounds.leftMax, left));
    right = sleep ? 0 : Math.max(bounds.rightMin, Math.min(bounds.rightMax, right));
    const center = rect.width - left - right - bounds.splits;
    if (center < bounds.centerMin) {
      if (which === "left") left = rect.width - right - bounds.splits - bounds.centerMin;
      else right = rect.width - left - bounds.splits - bounds.centerMin;
    }
    save.panes = {
      left: Math.round(Math.max(bounds.leftMin, Math.min(bounds.leftMax, left))),
      right: Math.round(Math.max(bounds.rightMin, Math.min(bounds.rightMax, right))),
    };
    applyPanes();
    fitBoard();
  }

  function alignLessonWithBoard() {
    const path = document.querySelector(".path");
    const current = path && path.querySelector(".lesson-btn.current");
    const board = document.querySelector(".stage .board");
    if (!path || !current || !board) return;
    const boardBox = board.getBoundingClientRect();
    const itemBox = current.getBoundingClientRect();
    if (!boardBox.height || !itemBox.height) return;
    const boardMid = boardBox.top + boardBox.height / 2;
    const itemMid = itemBox.top + itemBox.height / 2;
    path.scrollTop += itemMid - boardMid;
  }

  function snapshot(practice) {
    return {
      board: practice.board.map((row) => row.slice()),
      ko: practice.ko ? { x: practice.ko.x, y: practice.ko.y } : null,
      caps: { 1: practice.caps[1], 2: practice.caps[2] },
      plies: practice.plies,
      last: practice.last ? { x: practice.last.x, y: practice.last.y } : null,
    };
  }

  function restore(practice, shot) {
    practice.board = shot.board.map((row) => row.slice());
    practice.ko = shot.ko ? { x: shot.ko.x, y: shot.ko.y } : null;
    practice.caps = { 1: shot.caps[1], 2: shot.caps[2] };
    practice.plies = shot.plies;
    practice.last = shot.last ? { x: shot.last.x, y: shot.last.y } : null;
    practice.over = null;
    practice.thinking = false;
    practice.event = "start";
    practice.illegal = null;
  }

  function finishPractice(practice) {
    const goal = practice.goal || GOAL;
    if (practice.kind === "survive") {
      const anchor = practice.anchor;
      const alive = anchor && practice.board[anchor[1]][anchor[0]] === GoEngine.BLACK;
      const group = alive ? GoEngine.groupAt(practice.board, anchor[0], anchor[1]) : null;
      if (alive && group.liberties > 1) {
        practice.over = "user";
        practice.event = "survive";
      } else if (practice.caps[2] >= 1) practice.over = "bot";
    } else if (practice.caps[1] >= goal) practice.over = "user";
    else if (practice.caps[2] >= goal) practice.over = "bot";
    else if (practice.plies >= 80) {
      if (practice.caps[1] === practice.caps[2]) practice.over = "draw";
      else practice.over = practice.caps[1] > practice.caps[2] ? "user" : "bot";
    }
    if (practice.over === "user" && !practice.counted) {
      practice.counted = true;
      save.practiceWins = (save.practiceWins || 0) + 1;
      persist();
    }
  }

  function placeStones(spec) {
    const board = GoEngine.create(spec.size);
    for (const stone of spec.stones || []) {
      board[stone.y][stone.x] = stone.c === "B" ? GoEngine.BLACK : GoEngine.WHITE;
    }
    return board;
  }

  function rememberLift(captured, color) {
    state.lift = (captured || []).map(([x, y]) => ({ x, y, c: color }));
    const token = ++liftToken;
    window.setTimeout(() => {
      if (token !== liftToken) return;
      state.lift = [];
      render();
    }, 700);
  }

  function startPractice(id) {
    const open = GoLessons.practices.filter((item) => save.done[item.need] || (item.need === "l3" && save.done.p1));
    if (!open.length) {
      state.toast = "先见过提子，或先下完死活小题，再来小对局。";
      state.view = "learn";
      render();
      return;
    }
    const spec = open.find((item) => item.id === id) || open[open.length - 1];
    botToken += 1;
    state.view = "practice";
    state.about = false;
    state.peek = null;
    state.lift = [];
    state.hint = false;
    state.practice = {
      spec,
      goal: spec.goal,
      style: spec.style,
      kind: spec.kind || "",
      anchor: spec.anchor || null,
      board: placeStones(spec),
      ko: null,
      caps: { 1: 0, 2: 0 },
      lastCaps: 0,
      last: null,
      history: [],
      over: null,
      plies: 0,
      thinking: false,
      counted: false,
      event: "start",
      illegal: null,
    };
    render();
  }

  function scheduleBot() {
    const practice = state.practice;
    const token = ++botToken;
    practice.thinking = true;
    render();
    window.setTimeout(() => {
      if (token !== botToken || state.view !== "practice") return;
      const move = GoEngine.botMove(practice.board, GoEngine.WHITE, practice.ko, practice.style);
      practice.thinking = false;
      if (!move) {
        finishPractice(practice);
        render();
        return;
      }
      const played = GoEngine.place(practice.board, move.x, move.y, GoEngine.WHITE, practice.ko);
      if (!played.ok) {
        practice.event = "start";
        render();
        return;
      }
      practice.board = played.board;
      practice.ko = played.ko;
      practice.last = { x: move.x, y: move.y };
      practice.plies += 1;
      if (played.captured.length) {
        practice.caps[2] += played.captured.length;
        practice.lastCaps = played.captured.length;
        practice.event = "botCap";
        rememberLift(played.captured, "black");
      }
      finishPractice(practice);
      render();
    }, 420);
  }

  function playPractice(x, y) {
    const practice = state.practice;
    if (!practice || practice.over || practice.thinking) return;
    const before = snapshot(practice);
    const played = GoEngine.playAt(practice.board, x, y, GoEngine.BLACK, practice.ko);
    if (!played.ok) {
      practice.event = "illegal";
      practice.illegal = {
        mom: GoLessons.reasonLine(played.reason, "mom"),
        child: GoLessons.reasonLine(played.reason, "child"),
        pro: GoLessons.reasonLine(played.reason, "pro"),
      };
      render();
      return;
    }
    practice.history.push(before);
    practice.board = played.board;
    practice.ko = played.ko;
    practice.last = { x, y };
    practice.plies += 1;
    practice.illegal = null;
    if (played.captured.length) {
      practice.caps[1] += played.captured.length;
      practice.lastCaps = played.captured.length;
      practice.event = "userCap";
      rememberLift(played.captured, "white");
    } else {
      practice.event = "quiet";
    }
    finishPractice(practice);
    if (practice.over) {
      render();
      return;
    }
    scheduleBot();
  }

  function onPlay(x, y) {
    if (state.view !== "learn" && state.view !== "practice") return;
    if (state.view === "practice") {
      playPractice(x, y);
      return;
    }
    if (state.solved) return;
    state.peek = null;
    const lesson = activeLesson();
    const result = GoLessons.judge(lesson, state.session, x, y);
    if (result.status === "success") {
      state.session = result.session;
      state.solved = true;
      state.feedback = { status: "success" };
      state.hint = false;
      if (result.captured && result.captured.length) {
        rememberLift(result.captured, lesson.toPlay === "W" ? "black" : "white");
      }
      if (state.drill) {
        drillRecord(state.lessonId)[state.drill.id] = Date.now();
        persist();
        state.quiz = null;
      } else {
      const first = !save.done[lesson.id];
      if (first) markDone(lesson.id);
      const already = !!save.taught[lesson.id];
      state.quiz = {
        order: shuffle(lesson.id),
        bad: null,
        revealed: already,
        gaveUp: false,
      };
      }
    } else if (result.status === "continue") {
      state.session = result.session;
      state.feedback = { status: "continue" };
    } else {
      state.feedback = { status: result.status, reason: result.reason || "" };
    }
    render();
  }

  function sleepText() {
    return ordered().filter((lesson) => save.done[lesson.id]).map((lesson) => {
      return lesson.title + "\n孩子的话：" + lesson.teach.child + "\n妈妈的话：" + lesson.teach.mom + "\n棋手的话：" + lesson.teach.pro;
    }).join("\n\n");
  }

  function onClick(event) {
    const target = event.target.closest("[data-act]");
    if (!target) return;
    const act = target.dataset.act;
    if (act !== "speak" && act !== "close-about") state.toast = "";
    if (act === "play") {
      if (holdPeek) {
        holdPeek = false;
        return;
      }
      onPlay(Number(target.dataset.x), Number(target.dataset.y));
    }
    else if (act === "voice") {
      state.voice = target.dataset.voice;
      save.voice = state.voice;
      persist();
      render();
    } else if (act === "hint") {
      state.hint = !state.hint;
      if (state.hint && state.view === "learn") state.hintUsed = true;
      render();
    } else if (act === "reset") {
      if (state.drill) bootDrill(GoLessons.byId[state.lessonId], state.drill, state.review);
      else bootLesson(state.lessonId);
      render();
    } else if (act === "again") {
      const parent = GoLessons.byId[state.lessonId];
      const drill = nextDrill(parent);
      if (drill) bootDrill(parent, drill, false);
      render();
    } else if (act === "track") {
      save.track = target.dataset.track === "path" ? "path" : "base";
      persist();
      const id = target.dataset.id;
      if (id && GoLessons.byId[id]) {
        if (!isOpen(id)) {
          state.toast = "闯关按顺序来。先从死活小题下起。";
          openToday();
        } else bootLesson(id);
      } else openToday();
      state.pathOpen = false;
      render();
    } else if (act === "lesson") {
      const id = target.dataset.id;
      if (!isOpen(id)) {
        state.toast = "先把上一手学会。每天一手，不用往前跳。";
        render();
        return;
      }
      bootLesson(id);
      state.pathOpen = false;
      render();
    } else if (act === "today") {
      openToday();
      render();
    } else if (act === "prev") {
      const list = ordered();
      const index = list.findIndex((lesson) => lesson.id === state.lessonId);
      if (index > 0) bootLesson(list[index - 1].id);
      render();
    } else if (act === "next") {
      const list = ordered();
      const index = list.findIndex((lesson) => lesson.id === state.lessonId);
      if (index === list.length - 1) {
        state.view = "sleep";
        render();
        return;
      }
      bootLesson(list[index + 1].id);
      render();
    } else if (act === "quiz") {
      const who = target.dataset.who;
      if (!state.quiz || state.quiz.revealed) return;
      if (who === "child") {
        state.quiz.revealed = true;
        state.quiz.bad = null;
        save.taught[state.lessonId] = Date.now();
        persist();
      } else {
        state.quiz.bad = who;
      }
      render();
    } else if (act === "reveal") {
      if (state.quiz) {
        state.quiz.revealed = true;
        state.quiz.gaveUp = true;
      }
      render();
    } else if (act === "speak") {
      const who = target.dataset.who || state.voice;
      let text = "";
      if (target.dataset.from === "practice" && state.practice) {
        const pack = practicePack(state.practice);
        text = pack ? pack[who] : "";
      } else {
        const lesson = target.dataset.lesson ? GoLessons.byId[target.dataset.lesson] : activeLesson();
        const field = target.dataset.field === "teach" ? "teach" : "prompt";
        text = lesson[field][who];
      }
      speak(text, who === "child" ? 0.88 : 0.96);
    } else if (act === "sleep") {
      state.view = "sleep";
      state.about = false;
      render();
    } else if (act === "practice") startPractice(target.dataset.id || "");
    else if (act === "story") {
      state.view = "story";
      state.about = false;
      render();
    } else if (act === "story-next") {
      state.storyIndex = Math.min(GoLessons.story.length - 1, state.storyIndex + 1);
      render();
    } else if (act === "story-prev") {
      state.storyIndex = Math.max(0, state.storyIndex - 1);
      render();
    }
    else if (act === "undo") {
      const practice = state.practice;
      if (!practice || !practice.history.length) return;
      botToken += 1;
      restore(practice, practice.history.pop());
      render();
    } else if (act === "toggle-path") {
      state.pathOpen = !state.pathOpen;
      render();
    } else if (act === "lamp") {
      save.lamp = lampOn() ? "off" : "on";
      persist();
      render();
    } else if (act === "about") {
      state.about = true;
      render();
    } else if (act === "close-about") {
      state.about = false;
      render();
    } else if (act === "seen") {
      save.seen = true;
      persist();
      render();
    } else if (act === "copy") {
      const text = "棋伴 · 睡前小抄\n\n" + sleepText();
      const done = () => {
        state.copied = true;
        render();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          state.toast = "没有复制成功。可以改用打印，或者自己抄下孩子的那一句。";
          render();
        });
      } else {
        state.toast = "这个浏览器不能直接复制。可以用打印留下小抄。";
        render();
      }
    } else if (act === "print") window.print();
    else if (act === "reset-all") {
      if (!window.confirm("学习记录和小抄都会清空。确定重新开始吗？")) return;
      save.done = {};
      save.drills = {};
      save.taught = {};
      save.streak = null;
      save.practiceWins = 0;
      save.clean = 0;
      save.seen = true;
      persist();
      bootLesson(ordered()[0].id);
      render();
    }
  }

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea")) return;
    const voice = { 1: "mom", 2: "child", 3: "pro" }[event.key];
    if (!voice) return;
    state.voice = voice;
    save.voice = voice;
    persist();
    render();
  });
  document.addEventListener("pointerover", (event) => {
    if (!event.target.closest) return;
    document.querySelectorAll(".pt.ghost").forEach((node) => node.classList.remove("ghost"));
    const point = event.target.closest(".pt");
    if (!point || point.querySelector(".stone")) return;
    if (state.view === "sleep" || state.solved) return;
    if (state.view === "practice" && state.practice && (state.practice.over || state.practice.thinking)) return;
    point.classList.add("ghost");
  });

  let holdTimer = 0;
  let holdPeek = false;

  function currentBoard() {
    if (state.view === "practice" && state.practice) return state.practice.board;
    if (state.session) return state.session.board;
    return null;
  }

  function showPeek(x, y) {
    const board = currentBoard();
    if (!board || !board[y] || !board[y][x]) {
      state.peek = null;
      render();
      return;
    }
    const group = GoEngine.groupAt(board, x, y);
    state.peek = {
      count: group.liberties,
      points: Array.from(group.libertyKeys).map((key) => key.split(",").map(Number)),
    };
    render();
  }

  document.addEventListener("pointerdown", (event) => {
    const point = event.target.closest && event.target.closest(".pt");
    if (!point) return;
    holdPeek = false;
    const x = Number(point.dataset.x);
    const y = Number(point.dataset.y);
    window.clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      holdPeek = true;
      showPeek(x, y);
    }, 380);
  });
  document.addEventListener("pointerup", () => window.clearTimeout(holdTimer));
  document.addEventListener("pointercancel", () => window.clearTimeout(holdTimer));
  window.addEventListener("resize", () => {
    applyPanes();
    fitBoard();
    alignLessonWithBoard();
  });

  document.addEventListener("pointerdown", (event) => {
    const split = event.target.closest && event.target.closest(".split");
    if (!split || window.innerWidth < 981 || event.button !== 0) return;
    if (event.detail === 2) {
      save.panes = { left: PANE_DEFAULT.left, right: PANE_DEFAULT.right };
      persist();
      applyPanes();
      fitBoard();
      alignLessonWithBoard();
      return;
    }
    event.preventDefault();
    const which = split.dataset.split;
    split.classList.add("dragging");
    document.body.classList.add("pane-drag");
    const move = (ev) => dragPane(which, ev.clientX);
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      split.classList.remove("dragging");
      document.body.classList.remove("pane-drag");
      split.removeEventListener("pointermove", move);
      persist();
      alignLessonWithBoard();
    };
    split.setPointerCapture(event.pointerId);
    split.addEventListener("pointermove", move);
    split.addEventListener("pointerup", end);
    split.addEventListener("pointercancel", end);
  });

  document.addEventListener("keydown", (event) => {
    const split = event.target.closest && event.target.closest(".split");
    if (!split) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const layout = document.querySelector(".layout");
    if (!layout) return;
    const rect = layout.getBoundingClientRect();
    const path = layout.querySelector(".path");
    const voices = layout.querySelector(".voices");
    const left = path ? path.getBoundingClientRect().width : 200;
    const right = voices ? voices.getBoundingClientRect().width : 240;
    const dir = event.key === "ArrowRight" ? 1 : -1;
    const step = event.shiftKey ? 24 : 12;
    if (split.dataset.split === "left") dragPane("left", rect.left + left + dir * step);
    else dragPane("right", rect.right - right + dir * step);
    persist();
  });

  openToday();
  render();
})();
