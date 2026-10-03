(function (root, factory) {
  const api = typeof module === "object" && module.exports
    ? factory(require("./engine"))
    : factory(root.GoEngine);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.GoLessons = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (E) {
  const RULE = {
    occupied: {
      mom: "这里已经有子了。换一个空着的交叉点。",
      child: "这里已经坐了豆豆，去找空座位。",
      pro: "该点已有子，不能叠子。",
    },
    suicide: {
      mom: "这一下自己没有气，规则不让下。记成：不能把自己闷死。",
      child: "这个小口袋没有气，豆豆放进去会闷住，不能放。",
      pro: "自杀，禁着。落子后自身气尽，且提不到对方。",
    },
    eye: {
      mom: "这是对方围好的窗户。你填进去自己没气，下不进去。两扇窗都在，不能靠硬填来吃。",
      child: "这是小白的窗户，黑豆豆钻进去会闷住，进不去。",
      pro: "此为对方真眼。点眼属自杀。两眼活棋不可硬点。",
    },
    ownEye: {
      mom: "这是你自己的窗户。填上去就少一只眼，而且这一子没有气，不能下。",
      child: "这是你自己的小窗户，不能拿豆豆把它堵上。",
      pro: "自填真眼，自杀，禁着。",
    },
    ko: {
      mom: "刚被提掉的这一口，不能马上提回来。先到别处下一手。",
      child: "刚拿走的地方，不能马上放回去。先去别的空位放一颗。",
      pro: "劫。禁止立即回提，须先于他处落子。",
    },
    off: {
      mom: "点到棋盘外面了。",
      child: "要落在棋盘里面。",
      pro: "着点出界。",
    },
    stone: {
      mom: "点空着的交叉点，不要点在已经有的子上。",
      child: "点空白的地方，不要点在豆豆身上。",
      pro: "请选择空点。",
    },
  };

  function diagram(text) {
    const rows = text
      .trim()
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split(/\s+/));
    const size = rows.length;
    if (!size || rows.some((row) => row.length !== size)) {
      throw new Error("diagram is not square: " + rows.map((row) => row.length).join(","));
    }
    const stones = [];
    const accept = [];
    const glow = [];
    const anchors = [];
    const eyes = [];
    const known = new Set([".", "B", "W", "O", "T", "t", "C", "E"]);
    rows.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!known.has(cell)) throw new Error("bad diagram cell " + cell);
        if (cell === "B" || cell === "C" || cell === "t") stones.push({ x, y, c: "B" });
        if (cell === "W" || cell === "T") stones.push({ x, y, c: "W" });
        if (cell === "T" || cell === "t") glow.push([x, y]);
        if (cell === "C") anchors.push([x, y]);
        if (cell === "O") accept.push([x, y]);
        if (cell === "E") eyes.push([x, y]);
      });
    });
    return { size, stones, accept, glow, anchors, eyes };
  }

  function voice(mom, child, pro) {
    return { mom, child, pro };
  }

  const raw = [
    {
      id: "l1",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ...diagram(`
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . O . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
      `),
      title: "点亮最中间",
      prompt: voice(
        "线交叉的地方才能放子，不放在格子里面。请把黑子放在整个棋盘最中间。",
        "找棋盘的肚脐，把黑豆豆放在最中间。",
        "落子于交叉点。请下在天元。"
      ),
      teach: voice(
        "最中间这一点，以后叫天元。今天先记住一件事：子站在线的交叉上。",
        "豆豆要站在线交叉的小点上，站在最中间的肚脐那里。",
        "天元即棋盘中心。子下于交叉，不下于方格之中。"
      ),
      wrong: voice(
        "还没到正中间。横着竖着都数到第 5 条线，交叉的那一点。",
        "再找最中间，像桌子的肚脐。",
        "非天元。九路棋盘的天元在第五线交点。"
      ),
    },
    {
      id: "l2",
      minutes: 4,
      task: "pick",
      toPlay: "B",
      ...diagram(`
        . . . . .
        . . O . .
        . O T O .
        . . O . .
        . . . . .
      `),
      title: "子会呼吸",
      prompt: voice(
        "白子紧挨着的空位，就是它的气。上下左右算，斜角不算。请点任意一口气。",
        "小白靠着的空位就是它喘气的地方。点一个贴着它的空位，斜着的不算。",
        "气：与该子正交相邻的空点。斜角不计。请指出任意一气。"
      ),
      teach: voice(
        "气就是还能往旁边走的空位。气没了，子就留不住。斜着贴着的空位不算气。",
        "小白上下左右的空位，是它的鼻孔。斜对角不算。鼻孔没了，它就要回家。",
        "气尽则不能存子。气只计正交邻空，斜角非气。"
      ),
      wrong: voice(
        "斜着的不算。请点这颗白子紧挨着的上、下、左、右。",
        "要贴着小白的身体点，斜对角不算喘气。",
        "未中。气只在正交相邻的空点。"
      ),
    },
    {
      id: "l3",
      minutes: 4,
      task: "move",
      toPlay: "B",
      minCapture: 1,
      ...diagram(`
        . . . . .
        . . B . .
        . B W B .
        . . O . .
        . . . . .
      `),
      title: "堵住最后一口气",
      prompt: voice(
        "中间这颗白子只剩下面一口气。把那口气占上，它就要被拿起来。",
        "小白只剩下面一个鼻孔。用黑豆豆把它堵住。",
        "白一气。请占其最后一气而提。"
      ),
      teach: voice(
        "最后那口空位被你占住，白子就不能留在棋盘上了。把它拿起来，叫提子。",
        "鼻孔被堵住，小白掉下去啦。你把它拿回家。",
        "占尽最后一气，即可提子。提后该点转为空位。"
      ),
      wrong: voice(
        "还没堵住它最后那口气。看它哪一边还空着。",
        "小白的鼻孔还露在外面，去堵住那一个。",
        "未占最后一气，不能提。"
      ),
    },
    {
      id: "l4",
      minutes: 5,
      task: "move",
      toPlay: "B",
      minCapture: 1,
      ...diagram(`
        . . . . . . .
        . W . . B . .
        . B . B W B .
        . . . . O . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
      `),
      title: "还有气，就提不走",
      prompt: voice(
        "左上那颗白子还有好几口气，点它旁边不会被提走。请去提右下方只剩一口气的那颗。",
        "左边那颗还能喘好几下，吃不掉。去吃右边快喘不动的那颗。",
        "左上白子气数大于一。请提右侧一气之子。"
      ),
      teach: voice(
        "有气就能留着。只剩一口气，才一占就提。先数气，再动手。",
        "还能喘气的豆豆吃不掉。只剩一个鼻孔的，堵住就掉下去。",
        "气数大于一则不能提。先数气，再决定是否入气。"
      ),
      wrong: voice(
        "那一下提不走。去找只剩一口气的白子，占住它最后的空位。",
        "那颗还能喘气。找只剩一个鼻孔的小白。",
        "所着非提子之处。请点一气之最后空点。"
      ),
    },
    {
      id: "l5",
      minutes: 5,
      task: "move",
      toPlay: "B",
      minCapture: 2,
      ...diagram(`
        . . . . . .
        . . B . . .
        . B W B . .
        . B W B . .
        . . O . . .
        . . . . . .
      `),
      title: "拉着手，一起提",
      prompt: voice(
        "两颗白子连在一起，气是一起算的。它们只剩下面一口气，占上就能整块拿起来。",
        "两个小白手拉手，只剩一个鼻孔。堵住，它们一起回家。",
        "白为连通一块，共余一气。占该气则整块提。"
      ),
      teach: voice(
        "连在一起的子是一块，气一起算。最后一口气被占上，整块都要提掉。",
        "拉手的豆豆一起喘气。最后一个鼻孔堵住，两个一起掉下去。",
        "连通之棋为一块，气共有。气尽则整块提取，不以单子计。"
      ),
      wrong: voice(
        "要占它们共同剩下的那一口气，在下面那个空位。",
        "堵住它们一起用的那个鼻孔，在下面。",
        "请落在该块唯一的气上。"
      ),
    },
    {
      id: "l6",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ...diagram(`
        . . . . .
        . . W . .
        . W t W .
        . . O . .
        . . . . .
      `),
      title: "被叫吃了，先跑",
      prompt: voice(
        "你的黑子只剩一口气了。先接到下面的空位，把自己救出来。",
        "你的黑豆豆快不能喘气了。先逃到下面的空位。",
        "黑已被打吃。请长出，补上唯一一气。"
      ),
      teach: voice(
        "只剩一口气就危险了。先把自己连到空的地方，气就变多，对方不能马上提你。",
        "快喘不动就先逃跑。跑到旁边，鼻孔又变多了。",
        "打吃之后应先长出。长出则气数增加，暂不被提。"
      ),
      wrong: voice(
        "先别下远处。你的黑子只剩一口气，先往下面接上。",
        "先逃命。往下面空着的地方跑。",
        "自身一气。他处非急所，应先长。"
      ),
    },
    {
      id: "l7",
      minutes: 4,
      task: "move",
      toPlay: "B",
      atari: "W",
      ...diagram(`
        . . . . .
        . . B . .
        . B W O .
        . . O . .
        . . . . .
      `),
      title: "先喊一声吃",
      prompt: voice(
        "现在白子还有两口气，一下提不走。请再占一口，让它只剩一口气。先别把子拿走。",
        "小白还有两个鼻孔，一下吃不掉。再堵住一个，让它只剩一个。先别拿走。",
        "白有二气。请打吃，使其恰余一气。此手不提。"
      ),
      teach: voice(
        "让对方只剩一口气，叫打吃。打吃还没提走，下一步如果它不跑，才能提。",
        "只剩一个鼻孔的时候，就喊：我要吃啦。这一下先别拿走，等它不跑再拿。",
        "打吃：使对方恰余一气。尚未提子。对方若不应，下一手可提。"
      ),
      wrong: voice(
        "那一下还没让它只剩一口气。贴着白子，占住它的一口空位。",
        "再靠近小白一点，堵住它的一个鼻孔，先别拿走它。",
        "未成打吃。请选择能将其减至一气、且并不提子的着点。"
      ),
    },
    {
      id: "l8",
      minutes: 4,
      task: "pick",
      toPlay: "B",
      ...diagram(`
        . . . . .
        . . B . .
        . B O B .
        . . . . .
        . . . . .
      `),
      title: "三面的小口袋",
      prompt: voice(
        "三面是自己的子、一面开着的空位，像个小口袋。请点出这个口袋。",
        "找一个三面都是黑豆豆、只开一个口的小口袋，点它。",
        "请指出虎口：空点正交三面为本方子。"
      ),
      teach: voice(
        "这种三面围住的空位叫虎口。以后打吃，常常就是打在这样的口袋上。",
        "三面是自己人、只留一个口，就是小口袋。以后吃豆豆，常吃在口袋上。",
        "虎口即三面为己子的空点。打吃之着常落于虎口。"
      ),
      wrong: voice(
        "还不是。口袋要三面紧挨着自己的子，斜着围住不算。",
        "再找找：三面贴着黑豆豆，斜角不算。",
        "非虎口。只计正交三邻，斜角不算。"
      ),
    },
    {
      id: "l9",
      minutes: 5,
      task: "move",
      toPlay: "B",
      minCapture: 8,
      ...diagram(`
        . . . . . . .
        . B B B B B .
        . B W W W B .
        . B W O W B .
        . B W W W B .
        . B B B B B .
        . . . . . . .
      `),
      title: "只有一扇窗",
      prompt: voice(
        "这一块白棋被围住了，中间只剩一个空位，像只剩一扇窗。把窗填上。",
        "小白们挤在一起，只剩中间一扇小窗。把窗户堵上。",
        "白块仅余一眼，即仅余一气。请点眼提块。"
      ),
      teach: voice(
        "只剩一扇窗的棋是死的。窗就是它最后的气，填上，整块都被提掉。两扇窗才安全。",
        "只有一扇窗的小房子，窗户一堵，里面的豆豆就全部掉下去。两扇窗才不会被堵死。",
        "一眼之块，眼位即最后一气。填入则整块提。活棋至少需两只真眼。"
      ),
      wrong: voice(
        "整块只剩中间那一个空位。填进窗户里，它们就全部被提掉。",
        "堵中间那扇小窗，小白就会一起掉下去。",
        "急所在唯一眼位。他处不能提此块。"
      ),
    },
    {
      id: "l10",
      minutes: 5,
      task: "pick-all",
      toPlay: "B",
      ...diagram(`
        . . . . . . .
        B B B B B B B
        B W W W W W B
        B W O W O W B
        B W W W W W B
        B B B B B B B
        . . . . . . .
      `),
      title: "两扇真窗",
      prompt: voice(
        "上下左右都被同一块自己的子围住的空位，才是真窗。请把两扇真窗都点出来。",
        "真的小窗户，四边都是小白自己。两扇都点一点。",
        "真眼：空点正交四方皆为本方子。请指出两只真眼。"
      ),
      teach: voice(
        "两扇这样的窗都在，对方就填不进来，这块棋就是活的。窗要四边都是自己人，挨着对方的不算。",
        "有两扇真正的小窗户，房子就安全了。黑豆豆钻不进去。",
        "两只真眼即为活棋。对方点眼为自杀，不能硬提。"
      ),
      wrong: voice(
        "那不是真窗。真窗的上下左右都得是这白棋自己，不能挨着外面的空地乱点。",
        "那不是小窗户。要四边都贴着小白的那两个空心。",
        "非真眼。真眼须正交邻接皆为该块之棋。"
      ),
      partial: voice(
        "对，这是一扇。再把另一扇也点上。",
        "找到一扇小窗户啦，还有一扇。",
        "此眼正确。请再指出另一只真眼。"
      ),
    },
    {
      id: "l16",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ...diagram(`
        O . . . . . .
        B B B B B B B
        B W W W W W B
        B W E W E W B
        B W W W W W B
        B B B B B B B
        . . . . . . .
      `),
      title: "活棋，填不进",
      prompt: voice(
        "白棋已经有两扇窗，是活的。你可以试着去填窗，会发现下不进去。然后把黑子下在左上角。",
        "小白有两扇窗户，已经安全了。窗户里进不去。请把黑豆豆放在左上角。",
        "白已两眼活。点眼为禁着。请于左上角他投。"
      ),
      teach: voice(
        "活棋的窗户填不进去。遇到两扇窗，就不要再想硬吃，去别的地方下棋。",
        "两扇窗户的小房子安全了，我们不闯进去，去角落放豆豆。",
        "两眼活棋不可硬点。当于他处着手。"
      ),
      wrong: voice(
        "方向对：别去填窗。这一课请先下在最左上的那个空交叉点。",
        "窗户先别闯。去最左上角放一颗黑豆豆。",
        "请落在左上角空点。点眼不成着。"
      ),
    },
    {
      id: "l11",
      minutes: 4,
      task: "move",
      toPlay: "B",
      link: true,
      ...diagram(`
        . . . . .
        . . . . .
        . C O C .
        . . . . .
        . . . . .
      `),
      title: "把两颗连上",
      prompt: voice(
        "左右两颗黑子还是分开的。下在它们中间，让它们手拉手，变成一块。",
        "两个黑豆豆中间空着。你站到中间，让它们拉手。",
        "两子分离。请占其中间一着，使其连通。"
      ),
      teach: voice(
        "中间这一手叫连接。连成一块以后，气就一起算，不容易被拆开吃掉。",
        "拉起手就变成好朋友，一起喘气，不容易被吃掉。",
        "连接后两子同属一块，气共有，难以被分别攻击。"
      ),
      wrong: voice(
        "还没连上。下在左右两颗黑子正中间的空位。",
        "站到两个黑豆豆的中间去拉手。",
        "断点在两子之间，请占该点。"
      ),
    },
    {
      id: "l12",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ...diagram(`
        . . . . .
        . . B . .
        . W O W .
        . . B . .
        . . . . .
      `),
      title: "从中间拦住",
      prompt: voice(
        "左右两颗白子想在中间拉手。你下在中间，把这条路拦住。",
        "两个小白想握手。你站到中间，不让它们碰到。",
        "请切断：占白两子之间的空点。"
      ),
      teach: voice(
        "这一手叫切断。对方连不上，就还是两小块，以后可以分开对付。",
        "你站在中间，两个小白就拉不了手，还是分开的。",
        "切断之后对方不能连通，仍为两块，可分而击之。"
      ),
      wrong: voice(
        "路还没拦住。下在两颗白子的正中间。",
        "站到两个小白中间，不让它们握手。",
        "切断点在对方两子之间。"
      ),
    },
    {
      id: "l13",
      minutes: 5,
      task: "move",
      toPlay: "B",
      minCapture: 2,
      ...diagram(`
        . . B . .
        . B W B .
        . . O . .
        . B W B .
        . . B . .
      `),
      title: "一颗提两颗",
      prompt: voice(
        "中间这个空位，同时是上下两颗白子的最后一口气。下一颗黑子，两颗一起提。",
        "一颗黑豆豆可以同时堵住上下两个鼻孔。放在正中间。",
        "上下白均仅余中间一气。请一着双提。"
      ),
      teach: voice(
        "一个空位可以同时是两块棋的最后一口气。占上它，两颗一起回家。",
        "一个座位堵住了两个鼻孔，两颗小白一起掉下去啦。",
        "一子同时占去两块的最后一气，则双提。"
      ),
      wrong: voice(
        "还没打中。空位在两颗白子的正中间，那一下可以一起提。",
        "放在两个小白的正中间，一起把它们堵住。",
        "共同的最后一气在两子之间。"
      ),
    },
    {
      id: "l14",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ...diagram(`
        . . . . . . . . .
        . . . . . . . . .
        . . O . . . O . .
        . . . . . . . . .
        . . . . . . . . .
        . . . . . . . . .
        . . O . . . O . .
        . . . . . . . . .
        . . . . . . . . .
      `),
      title: "第一手下在角上",
      prompt: voice(
        "空棋盘的第一手，先占角落。请下在任意一个角里、离边两条线的交叉点上。四个角都可以。",
        "第一颗黑豆豆去角落里放，不要放在最中间。四个角落里那一点都可以。",
        "空枰第一手请占三三。四角三三均可。"
      ),
      teach: voice(
        "老话说金角、银边、草肚皮。角最重要，边其次，最中间最宽、也最难守。第一手先占角。",
        "宝贝先放进四个角落里。角落最金贵，中间的大空地以后再玩。",
        "金角银边草肚皮。三三位于角部第三线交点，是占角的一种下法。"
      ),
      wrong: voice(
        "再靠角一点。每个角里，从边数第三条线和第三条线交叉的地方，四个角都可以。",
        "去角落里面一点，不要放在中心，也不要贴着最外面的边。",
        "请下在四角三三，即第三线与第三线的交点。"
      ),
    },
  ];

  function makeKoSession() {
    const board = E.create(5);
    const put = (x, y, color) => {
      board[y][x] = color;
    };
    put(2, 1, E.WHITE);
    put(3, 1, E.BLACK);
    put(2, 0, E.BLACK);
    put(2, 2, E.BLACK);
    put(0, 1, E.WHITE);
    put(1, 0, E.WHITE);
    put(1, 2, E.WHITE);
    const captured = E.place(board, 1, 1, E.BLACK, null);
    if (!captured.ok || !captured.ko) throw new Error("ko lesson failed to build");
    return {
      board: captured.board,
      ko: captured.ko,
      marks: [],
      last: { x: 1, y: 1 },
      capturedNow: captured.captured,
    };
  }

  raw.push({
    id: "l15",
    minutes: 5,
    task: "move",
    toPlay: "W",
    size: 5,
    stones: [],
    accept: [[4, 4]],
    glow: [],
    anchors: [],
    eyes: [],
    showKo: true,
    make: makeKoSession,
    title: "刚提掉的，先别拿回",
    prompt: voice(
      "标着「劫」的空位，是刚被提掉的地方，白棋不能马上提回去。请把白子下到右下角。",
      "写着红字的空位先不要放豆豆。请把白豆豆放在右下角。",
      "劫材之处禁立即回提。请白棋他投于右下。"
    ),
    teach: voice(
      "刚提掉的空位不能马上填回去，这叫劫。先在别处下一手，才算守规矩。下一回合才可以再来争。",
      "刚拿走的地方先不要放回去。先去别的空位放一颗，等一下才可以回来玩。",
      "劫禁立即回提。他处落子之后，下一手方可再争此劫。"
    ),
    wrong: voice(
      "不要去填标着劫的地方。这一课请把白子下在右下角，先记住：马上拿回来是不许的。",
      "红字那里先别放。把白豆豆放到右下角。",
      "勿立即回提。请先于右下他投。"
    ),
  });

  function has(list, x, y) {
    return (list || []).some(([ax, ay]) => ax === x && ay === y);
  }

  function sameMarks(marks, accept) {
    if (marks.length !== accept.length) return false;
    return accept.every(([x, y]) => has(marks, x, y));
  }

  function normalize(lesson) {
    if (lesson.link && (!lesson.anchors || lesson.anchors.length !== 2)) {
      throw new Error(lesson.id + " needs two anchors");
    }
    if (lesson.atari === "W") {
      const whites = lesson.stones.filter((stone) => stone.c === "W");
      if (whites.length !== 1) throw new Error(lesson.id + " needs one white");
      lesson.atari = [whites[0].x, whites[0].y];
    }
    if ((lesson.task === "move" || lesson.task === "pick" || lesson.task === "pick-all") && !lesson.accept.length) {
      throw new Error(lesson.id + " has no answer");
    }
    for (const field of ["prompt", "teach", "wrong"]) {
      for (const key of ["mom", "child", "pro"]) {
        if (!lesson[field] || !lesson[field][key]) throw new Error(lesson.id + " " + field + " " + key);
      }
    }
    if (lesson.task === "pick-all" && (!lesson.partial || !lesson.partial.mom)) {
      throw new Error(lesson.id + " needs partial");
    }
    return lesson;
  }

  const built = raw.map(normalize);

  const chapters = [
    { id: "see", title: "认识棋盘", blurb: "子下在交叉上，气在上下左右。", ids: ["l1", "l2"] },
    { id: "take", title: "提子", blurb: "没气了就要拿起来。", ids: ["l3", "l4", "l5"] },
    { id: "atari", title: "打吃与逃", blurb: "只剩一口气，就该跑，或者喊吃。", ids: ["l6", "l7", "l8"] },
    { id: "eye", title: "窗与活棋", blurb: "一扇窗不够，两扇窗才安全。", ids: ["l9", "l10", "l16"] },
    { id: "link", title: "拉手与拦住", blurb: "自己要连上，对方要切开。", ids: ["l11", "l12", "l13"] },
    { id: "corner", title: "角和劫", blurb: "先占角。刚提掉的不能马上拿回。", ids: ["l14", "l15"] },
  ];

  const later = [
    { title: "死活小题", blurb: "一块棋到底活着还是死了。" },
    { title: "先送再提", blurb: "有时候先放一颗进去，才能把对方提回来。" },
    { title: "边和布局", blurb: "角占过了，下一步常常走上边。" },
    { title: "收官", blurb: "快下完的时候，每一口空都要数清楚。" },
  ];

  const byId = Object.fromEntries(built.map((lesson) => [lesson.id, lesson]));

  function ordered() {
    return chapters.flatMap((chapter) => chapter.ids.map((id) => {
      if (!byId[id]) throw new Error("missing lesson " + id);
      return byId[id];
    }));
  }

  function start(lesson) {
    if (lesson.make) return lesson.make();
    const board = E.create(lesson.size);
    for (const stone of lesson.stones) {
      board[stone.y][stone.x] = stone.c === "B" ? E.BLACK : E.WHITE;
    }
    return { board, ko: null, marks: [], last: null, capturedNow: [] };
  }

  function judge(lesson, session, x, y) {
    const color = lesson.toPlay === "W" ? E.WHITE : E.BLACK;
    const size = session.board.length;
    if (x < 0 || y < 0 || x >= size || y >= size) return { status: "illegal", reason: "off", session };

    if (lesson.task === "pick" || lesson.task === "pick-all") {
      if (session.board[y][x] !== E.EMPTY) return { status: "wrong", reason: "stone", session };
      if (!has(lesson.accept, x, y)) return { status: "wrong", session };
      if (has(session.marks, x, y)) return { status: "continue", session };
      const marks = session.marks.concat([[x, y]]);
      const next = { ...session, marks, last: { x, y } };
      if (lesson.task === "pick" || sameMarks(marks, lesson.accept)) {
        return { status: "success", session: next };
      }
      return { status: "continue", session: next };
    }

    const result = E.playAt(session.board, x, y, color, session.ko);
    if (!result.ok) return { status: "illegal", reason: result.reason, session };
    if (!has(lesson.accept, x, y)) return { status: "wrong", session };

    if (lesson.minCapture && result.captured.length < lesson.minCapture) {
      return { status: "wrong", session };
    }
    if (lesson.atari) {
      const [tx, ty] = lesson.atari;
      if (!result.board[ty][tx]) return { status: "wrong", session };
      if (E.groupAt(result.board, tx, ty).liberties !== 1) return { status: "wrong", session };
      if (result.captured.length) return { status: "wrong", session };
    }
    if (lesson.link) {
      const [a, b] = lesson.anchors;
      const group = E.groupAt(result.board, a[0], a[1]);
      const joined = group.group.some(([gx, gy]) => gx === b[0] && gy === b[1]);
      if (!joined) return { status: "wrong", session };
    }
    return {
      status: "success",
      captured: result.captured,
      session: {
        board: result.board,
        ko: result.ko,
        marks: session.marks,
        last: { x, y },
        capturedNow: result.captured,
      },
    };
  }

  function reasonLine(reason, voiceKey) {
    const pack = RULE[reason] || RULE.suicide;
    return pack[voiceKey] || pack.mom;
  }

  return {
    RULE,
    chapters,
    later,
    lessons: built,
    byId,
    ordered,
    start,
    judge,
    reasonLine,
    diagram,
  };
});
