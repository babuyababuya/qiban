(function () {
  const KEY = "qiban-go-v1";
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

  function loadSave() {
    const blank = {
      done: {},
      taught: {},
      voice: "mom",
      streak: null,
      practiceWins: 0,
      clean: 0,
      lamp: "auto",
      seen: false,
    };
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
      const next = Object.assign(blank, parsed);
      if (!next.done || typeof next.done !== "object") next.done = {};
      if (!next.taught || typeof next.taught !== "object") next.taught = {};
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
    return GoLessons.ordered();
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

  function rankInfo() {
    const done = Object.keys(save.done).length;
    const taught = Object.keys(save.taught).length;
    const wins = save.practiceWins || 0;
    const steps = [
      [0, "还没落子"],
      [1, "棋盘小豆"],
      [3, "会数气"],
      [6, "会提子"],
      [9, "懂窗户"],
      [12, "会拉手"],
      [16, "能讲清楚"],
    ];
    let name = steps[0][1];
    for (const [count, label] of steps) if (done >= count) name = label;
    if (done >= 16 && taught >= 10 && wins >= 1) name = "家中小高手";
    return { name, done, taught, wins, total: ordered().length };
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
    state.view = "learn";
    state.session = GoLessons.start(lesson);
    state.solved = false;
    state.feedback = null;
    state.quiz = null;
    state.hint = false;
    state.hintUsed = false;
    state.about = false;
    state.copied = false;
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
        const glow = options.glow && options.glow.some(([gx, gy]) => gx === x && gy === y);
        const marked = options.marks && options.marks.some(([mx, my]) => mx === x && my === y);
        const last = options.last && options.last.x === x && options.last.y === y && value;
        const ko = options.ko && options.ko.x === x && options.ko.y === y && !value;
        const stone = value === 1 ? "black" : value === 2 ? "white" : "";
        cells += `<button type="button" class="pt ${edges}${hinted ? " hint" : ""}" data-act="play" data-x="${x}" data-y="${y}" aria-label="第 ${y + 1} 行，第 ${x + 1} 列">
          <i class="h"></i><i class="v"></i>
          ${star ? '<i class="star"></i>' : ""}
          ${stone ? `<i class="stone ${stone}${glow ? " glow" : ""}${last ? " last" : ""}"></i>` : ""}
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
    if (lesson.task === "pick-all") {
      return lesson.accept.filter(([x, y]) => !state.session.marks.some(([mx, my]) => mx === x && my === y));
    }
    return lesson.accept || [];
  }

  function pathHtml() {
    const info = rankInfo();
    const chapters = GoLessons.chapters.map((chapter) => {
      const items = chapter.ids.map((id) => {
        const lesson = GoLessons.byId[id];
        const done = !!save.done[id];
        const taught = !!save.taught[id];
        const current = state.view === "learn" && state.lessonId === id;
        const locked = !isOpen(id);
        return `<button type="button" class="lesson-btn${current ? " current" : ""}${locked ? " locked" : ""}" data-act="lesson" data-id="${id}">
          <i class="pip${done ? " done" : ""}${taught ? " taught" : ""}${current ? " now" : ""}"></i>
          <span>${esc(lesson.title)}${locked ? "<small>先学会上一手</small>" : ""}</span>
        </button>`;
      }).join("");
      return `<div class="chapter"><b>${esc(chapter.title)}</b><span>${esc(chapter.blurb)}</span>${items}</div>`;
    }).join("");
    const later = GoLessons.later.map((item) => `<div class="later"><i class="pip"></i><span>${esc(item.title)}<small>${esc(item.blurb)}</small></span></div>`).join("");
    const practiceReady = !!save.done.l3;
    return `<section class="panel">
      <p class="meta">${PERIOD_NAME[period()]} · ${esc(streakText())}</p>
      <div class="rank">${esc(info.name)}</div>
      <p class="meta">学会 ${info.done}/${info.total} 手<br>能讲给孩子 ${info.taught} 句<br>无提示过关 ${save.clean || 0} 手<br>吃子棋胜 ${info.wins} 盘</p>
      <div class="path-actions">
        <button type="button" class="primary" data-act="today">回到今日这一手</button>
        <button type="button" data-act="practice">${practiceReady ? "下吃子棋" : "吃子棋未解锁"}</button>
        <button type="button" data-act="sleep">睡前小抄</button>
      </div>
    </section>
    <section class="panel">
      <h2>循序的路</h2>
      ${chapters}
      <div class="chapter"><b>再往后</b><span>方法不变：你先懂，再用孩子的话讲。</span>${later}</div>
      <button type="button" class="ghost-btn" data-act="reset-all">重新开始</button>
    </section>`;
  }

  function welcomeHtml() {
    if (save.seen) return "";
    return `<section class="welcome">
      <h2>每天一手，就够了</h2>
      <p>清晨、午后、灯下，都能打开。一手大约五分钟。你先学会，再用孩子听得懂的那一句讲给他。断网也能用。</p>
      <p><button type="button" class="primary" data-act="seen">从这一手开始</button></p>
    </section>`;
  }

  function learnHtml() {
    const lesson = GoLessons.byId[state.lessonId];
    const list = ordered();
    const index = list.findIndex((item) => item.id === lesson.id);
    const chapter = GoLessons.chapters.find((item) => item.ids.includes(lesson.id));
    const picking = lesson.task === "pick" || lesson.task === "pick-all";
    const colorName = lesson.toPlay === "W" ? "白" : "黑";
    const hand = picking
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
      const extra = taken ? `提掉了 ${taken} 颗。` : "这一手对了。";
      banner = `<div class="banner good" role="status">${extra}${state.hintUsed ? "" : " 没有看提示。"}</div>`;
    } else if (save.done[lesson.id]) {
      banner = `<div class="banner">这手学过。可以再摆一次，也可以直接去睡前小抄。</div>`;
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
      quiet: state.solved,
      shake: !!wrongNow,
    });
    const showNext = state.solved || !!save.done[lesson.id];
    return `${welcomeHtml()}
      <div class="board-wrap">
        <div class="hand">${picking ? "" : `<i class="stone ${stone}"></i>`}<span>${hand}</span></div>
        <div class="board-box">${board}</div>
        <p class="fine">下边数字是列，右边数字是行。点线的交叉点，不点格子中间。<br>${esc(chapter.title)} · 第 ${index + 1} / ${list.length} 手 · 大约 ${lesson.minutes} 分钟</p>
      </div>
      ${banner}
      <div class="playbar">
        <button type="button" class="path-toggle" data-act="toggle-path">${state.pathOpen ? "收起课程" : "全部课程 " + rankInfo().done + "/" + rankInfo().total}</button>
        <button type="button" data-act="hint">${state.hint ? "收起提示" : "看提示"}</button>
        <button type="button" data-act="reset">再摆一次</button>
        ${index > 0 ? '<button type="button" data-act="prev">上一手</button>' : ""}
        ${showNext ? `<button type="button" class="primary" data-act="next">${index === list.length - 1 ? "去睡前小抄" : "下一手"}</button>` : ""}
      </div>`;
  }

  function voiceHtml() {
    if (state.view === "sleep") return "";
    if (state.view === "practice") return practiceVoiceHtml();
    const lesson = GoLessons.byId[state.lessonId];
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
    if (practice.thinking) return MATCH.thinking;
    if (practice.event === "illegal" && practice.illegal) return practice.illegal;
    if (practice.over === "user") return MATCH.win;
    if (practice.over === "bot") return MATCH.lose;
    if (practice.over === "draw") return MATCH.draw;
    if (practice.event === "userCap") return MATCH.userCap;
    if (practice.event === "botCap") return MATCH.botCap;
    const advice = GoEngine.advise(practice.board, GoEngine.BLACK, practice.ko);
    return ADVICE[advice.kind] || MATCH.start;
  }

  function practiceVoiceHtml() {
    const pack = practicePack(state.practice);
    const switcher = VOICES.map((voice) => `<button type="button" class="${voice.id}${state.voice === voice.id ? " on" : ""}" data-act="voice" data-voice="${voice.id}">${voice.name}<small>${voice.key}</small></button>`).join("");
    const cards = VOICES.map((voice) => `<article class="card ${voice.id}${state.voice === voice.id ? " active" : ""}">
      <header><strong>${voice.name}</strong><button type="button" data-act="speak" data-who="${voice.id}" data-from="practice">朗读</button></header>
      <p>${esc(pack[voice.id])}</p>
    </article>`).join("");
    return `<div class="switcher">${switcher}</div><p class="meta">吃子棋也用这三种说法。规则仍然由棋盘判定。</p>${cards}`;
  }

  function practiceHtml() {
    const practice = state.practice;
    const board = boardHtml(practice.board, {
      turn: "B",
      last: practice.last,
      quiet: !!practice.over || practice.thinking,
    });
    const end = practice.over ? `<div class="banner good">${esc(practicePack(practice)[state.voice])}</div>` : "";
    return `<div class="board-wrap">
        <div class="score"><span>你提了 <b>${practice.caps[1]}</b> / ${GOAL}</span><span>棋伴提了 <b>${practice.caps[2]}</b> / ${GOAL}</span></div>
        <div class="hand"><i class="stone black"></i><span>${practice.over ? "这盘结束了" : practice.thinking ? "棋伴在下白子" : "你下黑子"}</span></div>
        <div class="board-box">${board}</div>
        <p class="fine">九路棋盘。先提满 5 颗子的一方赢。可以悔棋，悔的是你和棋伴的上一回合。</p>
      </div>
      ${end}
      <div class="playbar">
        <button type="button" class="path-toggle" data-act="toggle-path">全部课程</button>
        <button type="button" data-act="undo" ${practice.history.length ? "" : "disabled"}>悔棋</button>
        <button type="button" data-act="practice">再来一盘</button>
        <button type="button" class="primary" data-act="today">回到课程</button>
      </div>`;
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
        <p>十六手走完，你能看懂气、提子、打吃、眼、连接和劫。再往后的死活、手筋和收官，仍然用这个方法：你先懂，再用孩子的话讲。</p>
        <button type="button" class="primary" data-act="close-about">知道了</button>
      </article>
    </div>`;
  }

  function render() {
    document.body.classList.toggle("lamp", lampOn());
    const info = rankInfo();
    const lesson = GoLessons.byId[state.lessonId];
    document.title = state.view === "practice"
      ? "棋伴 · 吃子棋"
      : state.view === "sleep"
        ? "棋伴 · 睡前小抄"
        : "棋伴 · " + lesson.title;
    const stage = state.view === "sleep" ? sleepHtml() : state.view === "practice" ? practiceHtml() : learnHtml();
    const toast = state.toast ? `<div class="toast" role="status">${esc(state.toast)}</div>` : "";
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
          <button type="button" data-act="sleep">睡前小抄</button>
        </div>
      </header>
      ${toast}
      <div class="layout${state.pathOpen ? " path-open" : ""}${state.view === "sleep" ? " sleep" : ""}">
        <aside class="path">${pathHtml()}</aside>
        <main class="stage">${stage}</main>
        <aside class="voices">${voiceHtml()}</aside>
      </div>
      <p class="fine">离线可用 · 中国规则入门 · 气尽即提 · 不许自杀 · 劫不能马上提回 · 现在的段位：${esc(info.name)}</p>
    </div>${aboutHtml()}`;
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
    if (practice.caps[1] >= GOAL) practice.over = "user";
    else if (practice.caps[2] >= GOAL) practice.over = "bot";
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

  function startPractice() {
    if (!save.done.l3) {
      state.toast = "先学会「堵住最后一口气」，再来下吃子棋。";
      state.view = "learn";
      render();
      return;
    }
    botToken += 1;
    state.view = "practice";
    state.about = false;
    state.practice = {
      board: GoEngine.create(9),
      ko: null,
      caps: { 1: 0, 2: 0 },
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
      const move = GoEngine.botMove(practice.board, GoEngine.WHITE, practice.ko);
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
        practice.event = "botCap";
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
      practice.event = "userCap";
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
    if (state.view === "practice") {
      playPractice(x, y);
      return;
    }
    if (state.solved) return;
    const lesson = GoLessons.byId[state.lessonId];
    const result = GoLessons.judge(lesson, state.session, x, y);
    if (result.status === "success") {
      const first = !save.done[lesson.id];
      state.session = result.session;
      state.solved = true;
      state.feedback = { status: "success" };
      state.hint = false;
      if (first) markDone(lesson.id);
      const already = !!save.taught[lesson.id];
      state.quiz = {
        order: shuffle(lesson.id),
        bad: null,
        revealed: already,
        gaveUp: false,
      };
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
    if (act === "play") onPlay(Number(target.dataset.x), Number(target.dataset.y));
    else if (act === "voice") {
      state.voice = target.dataset.voice;
      save.voice = state.voice;
      persist();
      render();
    } else if (act === "hint") {
      state.hint = !state.hint;
      if (state.hint) state.hintUsed = true;
      render();
    } else if (act === "reset") {
      bootLesson(state.lessonId);
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
      bootLesson(ordered()[frontierIndex()].id);
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
      if (target.dataset.from === "practice" && state.practice) text = practicePack(state.practice)[who];
      else {
        const lesson = GoLessons.byId[target.dataset.lesson || state.lessonId];
        const field = target.dataset.field === "teach" ? "teach" : "prompt";
        text = lesson[field][who];
      }
      speak(text, who === "child" ? 0.88 : 0.96);
    } else if (act === "sleep") {
      state.view = "sleep";
      state.about = false;
      render();
    } else if (act === "practice") startPractice();
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

  bootLesson(ordered()[frontierIndex()].id);
  render();
})();
