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
      free: true,
      prompt: voice(
        "白棋已经有两扇窗，是活的。你可以试着去填窗，会发现下不进去。然后把黑子下在别的空位，哪里都可以。",
        "小白有两扇窗户，已经安全了。窗户里进不去。去别的空位放一颗黑豆豆。",
        "白已两眼活。点眼为禁着。请于他处任意落子。"
      ),
      teach: voice(
        "活棋的窗户填不进去。遇到两扇窗，就不要再想硬吃，去别的地方下棋。",
        "两扇窗户的小房子安全了，我们不闯进去，去别处放豆豆。",
        "两眼活棋不可硬点。当于他处着手。"
      ),
      wrong: voice(
        "别去填那两扇窗。窗以外的空位，下一手都可以。",
        "窗户先别闯。去别的空位放黑豆豆。",
        "勿点眼。请于他处落子。"
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
    free: true,
    make: makeKoSession,
    title: "刚提掉的，先别拿回",
    prompt: voice(
      "标着「劫」的空位，是刚被提掉的地方，白棋不能马上提回去。请在别的空位下一手，哪里都可以。",
      "写着红字的空位先不要放豆豆。去别的空位放一颗白豆豆。",
      "劫禁立即回提。请白棋于他处任意落子。"
    ),
    teach: voice(
      "刚提掉的空位不能马上填回去，这叫劫。先在别处下一手，才算守规矩。下一回合才可以再来争。",
      "刚拿走的地方先不要放回去。先去别的空位放一颗，等一下才可以回来玩。",
      "劫禁立即回提。他处落子之后，下一手方可再争此劫。"
    ),
    wrong: voice(
      "不要去填标着劫的地方。别处的空位都可以。马上拿回来是不许的。",
      "红字那里先别放。去别的空位放白豆豆。",
      "勿立即回提。请先于他处落子。"
    ),
  });

  raw.push({
    id: "l17",
    minutes: 5,
    task: "script",
    toPlay: "B",
    ...diagram(`
      . B B B .
      . B W W B
      . W . . B
      . . W B .
      . . . . .
    `),
    steps: [
      { at: [2, 2], reply: [3, 2] },
      { at: [2, 2] },
    ],
    title: "先送再提",
    prompt: voice(
      "先把一颗黑子送进缺口。白棋会把它吃掉。等它吃完，再下回原地，连着的白子就会一起被提掉。",
      "先送一颗豆豆进去。小白把它吃掉以后，你再放回刚才那里，一串都拿回家。",
      "倒扑。先弃一子，待对方提取后，于原点回提整块。"
    ),
    teach: voice(
      "有时要先送给对方一颗，它一吃，自己的气就没了。你再提回来的，是一整块。",
      "先把一颗豆豆送给它吃。它吃完，鼻孔就不够了，一串一起回家。",
      "倒扑：弃子诱敌提子，随即回提更大的一块。"
    ),
    wrong: voice(
      "先别在别处下。把黑子送进那两颗白子旁边的空位。",
      "先送一颗进去，就在小白旁边的缺口。",
      "请先于缺口弃子。"
    ),
    partial: voice(
      "送进去了。它吃掉了这一颗。现在下回刚才那个点，把连着的一起拿回来。",
      "豆豆送进去啦。再放回刚才那里，把一串拿回家。",
      "弃子已被提。请于原点倒扑。"
    ),
  });

  raw.push({
    id: "l18",
    minutes: 4,
    task: "pick",
    toPlay: "B",
    ...diagram(`
      W W W . . . .
      W O B . . . .
      . B B B B B .
      . B W W W B .
      . B W . W B .
      . B W W W B .
      . B B B B B .
    `),
    title: "窗边站着别人",
    prompt: voice(
      "下面那座房子有两扇真窗，先别点。请点出左上角那扇假窗：它旁边站着黑子，不算自己的窗。",
      "大房子的窗户是真的。请点左上角那扇假窗户，旁边站着黑豆豆。",
      "请指出假眼。左上空点邻接对方之子，非真眼。真眼不必点。"
    ),
    teach: voice(
      "窗的四边都得是自己人，才是真窗。有一边站着别人，看起来像窗，其实是假的，堵上也不算活。",
      "真的窗户旁边都是自己的豆豆。旁边站着别人的，是假窗户。",
      "真眼须正交四方皆为本方。一边为对方，则为假眼，不能当活棋的眼。"
    ),
    wrong: voice(
      "那不是假窗。假窗在左上角，紧挨着一颗黑子。房子中间的空心是真窗，先别点。",
      "去左上角，找旁边站着黑豆豆的那个空位。",
      "非假眼。请点左上邻接黑子的空点。"
    ),
  });

  raw.push({
    id: "l19",
    minutes: 5,
    task: "script",
    toPlay: "B",
    ...diagram(`
      . . B . . . .
      . B . . . . .
      B W . . . . .
      . B . . . . .
      . . B . . . .
      . . . . . . .
      . . . . . . .
    `),
    steps: [
      { at: [2, 1], reply: [2, 2] },
      { at: [3, 2], reply: [2, 3] },
      { at: [3, 3] },
    ],
    title: "顺着小路追",
    prompt: voice(
      "白子贴着边，只剩一口气。不要一下提掉，顺着它逃跑的方向追。追三步，第三步把它拿走。",
      "小白沿着边跑。你跟着追三步，最后一步把它吃掉。",
      "征子。沿其长出方向连续打吃，第三手提取。"
    ),
    teach: voice(
      "它每跑一步，你就在旁边再喊一次吃。这条小路很短，追三步就到头了。",
      "小白跑一步，你追一步。追三步，它就回家了。",
      "征子即连续打吃。逃出之路被边和己方子封住时，可一路提尽。"
    ),
    wrong: voice(
      "追的方向偏了。贴着它刚逃到的地方，再占下一口。",
      "跟着小白跑的方向追，不要跑到远处。",
      "征子方向有误。请续打其长出后的气。"
    ),
    partial: voice(
      "追对了。它又往前跑了一步。顺着再追。",
      "追上啦。小白又跑了。再追一步。",
      "打吃正确。对方已长，请继续。"
    ),
  });

  raw.push({
    id: "l20",
    minutes: 4,
    task: "move",
    toPlay: "B",
    ...diagram(`
      . . . . . . . . .
      . . . . . . . . .
      . . B . O . . . .
      . . . . . . . . .
      . . O . . . O . .
      . . . . . . . . .
      . . . . O . . . .
      . . . . . . . . .
      . . . . . . . . .
    `),
    title: "沿边走",
    prompt: voice(
      "左上角已经有一颗了。下一手走到边的中间，离最外面的边还有两条线。四条边的中间都可以。",
      "角落里已经有豆豆了。下一颗走到边边的中间，不要贴到最外面。",
      "角已有子。请于四边第三线之中点择一而占。"
    ),
    teach: voice(
      "角占过以后，下一步常常走到边上。边没有角那么金贵，但比棋盘最中间好守。",
      "宝贝放完角落，就沿着边边走。边边比大空地好守。",
      "金角之后常占边。第三线是占边的一种走法。"
    ),
    wrong: voice(
      "再走到边的中间一点。离边两条线，左右居中的那一个点，四边都可以。",
      "去边边的中间，不要放回最中间，也不要再挤在角里。",
      "请下在边的第三线中点。"
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
    if (lesson.task === "script") {
      if (!lesson.steps || !lesson.steps.length) throw new Error(lesson.id + " needs steps");
      if (!lesson.partial || !lesson.partial.mom) throw new Error(lesson.id + " needs partial");
    } else if ((lesson.task === "move" || lesson.task === "pick" || lesson.task === "pick-all") && !lesson.accept.length && !lesson.free) {
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
  const draftById = Object.fromEntries(built.map((lesson) => [lesson.id, lesson]));

  function again(parent) {
    return voice(
      "换一张棋盘，还是这件事。" + parent.prompt.mom,
      "换个地方，再找一次。" + parent.prompt.child,
      "图形已换。" + parent.prompt.pro
    );
  }

  function makeDrill(parent, spec) {
    const picture = spec.board ? diagram(spec.board) : null;
    const lesson = {
      id: spec.id,
      parentId: parent.id,
      minutes: 1,
      title: parent.title,
      task: spec.task || parent.task,
      toPlay: spec.toPlay || parent.toPlay,
      free: !!spec.free,
      minCapture: spec.minCapture,
      atari: spec.atari,
      ataris: spec.ataris || null,
      link: spec.link,
      showKo: spec.showKo,
      steps: spec.steps,
      make: spec.make,
      size: picture ? picture.size : 0,
      stones: picture ? picture.stones : [],
      accept: picture ? picture.accept : (spec.accept || []),
      glow: picture ? picture.glow : [],
      anchors: picture ? picture.anchors : [],
      eyes: picture ? picture.eyes : [],
      prompt: again(parent),
      teach: parent.teach,
      wrong: parent.wrong,
      partial: spec.partial || parent.partial || voice("这一步对了。接着下。", "对啦，再走一步。", "此步正确，请续下。"),
    };
    if (spec.make) {
      lesson.size = spec.make().board.length;
      lesson.accept = spec.accept || [];
    }
    return normalize(lesson);
  }

  const drillBoards = {
    l1: [
      { id: "l1a", board: ". . . . . . .\n. . . . . . .\n. . . . . . .\n. . . O . . .\n. . . . . . .\n. . . . . . .\n. . . . . . ." },
      { id: "l1b", board: ". . . . .\n. . . . .\n. . O . .\n. . . . .\n. . . . ." },
    ],
    l2: [
      { id: "l2a", task: "pick", board: "W O . . .\nO . . . .\n. . . . .\n. . . . .\n. . . . ." },
      { id: "l2b", task: "pick", board: ". . . . .\n. O . . .\nW O . . .\n. O . . .\n. . . . ." },
    ],
    l3: [
      { id: "l3a", minCapture: 1, board: "W O . . .\nB . . . .\n. . . . .\n. . . . .\n. . . . ." },
      { id: "l3b", minCapture: 1, board: ". O . . .\nB W B . .\n. B . . .\n. . . . .\n. . . . ." },
    ],
    l4: [
      { id: "l4a", minCapture: 1, board: ". . . . . .\n. W . . B .\n. . . B W B\n. . . . O .\n. . . . . .\n. . . . . ." },
      { id: "l4b", minCapture: 1, board: ". . . B W\n. . . . O\n. . . . B\n. . W . .\n. . . . ." },
    ],
    l5: [
      { id: "l5a", minCapture: 2, board: ". . B . .\n. B B . .\nB W B . .\nB W B . .\n. O . . ." },
      { id: "l5b", minCapture: 2, board: ". . . . . . .\n. . . . B . .\n. . . B W B .\n. . . B W B .\n. . . . O . .\n. . . . . . .\n. . . . . . ." },
    ],
    l6: [
      { id: "l6a", board: ". . . . .\n. W . . .\nW t W . .\n. O . . .\n. . . . ." },
      { id: "l6b", board: ". . t W .\n. . O W .\n. . . . .\n. . . . .\n. . . . ." },
    ],
    l7: [
      { id: "l7a", atari: "W", board: ". . . . .\n. B . . .\nB W O . .\n. O . . .\n. . . . ." },
      { id: "l7b", atari: "W", board: ". . B W O\n. . B O B\n. . . . .\n. . . . .\n. . . . ." },
    ],
    l8: [
      { id: "l8a", task: "pick", board: "B B . . .\nB O B . .\n. . . . .\n. . . . .\n. . . . ." },
      { id: "l8b", task: "pick", board: ". . . . .\n. . . B .\n. . B O B\n. . . . .\n. . . . ." },
    ],
    l9: [
      { id: "l9a", minCapture: 1, board: ". B B B .\n. B W B .\n. B O B .\n. B B B .\n. . . . ." },
      { id: "l9b", minCapture: 1, board: "W B . . .\nO B . . .\nB B . . .\n. . . . .\n. . . . ." },
    ],
    l10: [
      {
        id: "l10a",
        task: "pick-all",
        board: "B B B B B B B\nB W W W W W B\nB W O W O W B\nB W W W W W B\nB B B B B B B\n. . . . . . .\n. . . . . . .",
      },
      {
        id: "l10b",
        task: "pick-all",
        board: ". . . . . . . . .\n. . . . . . . . .\n. B B B B B B B .\n. B W W W W W B .\n. B W O W O W B .\n. B W W W W W B .\n. B B B B B B B .\n. . . . . . . . .\n. . . . . . . . .",
      },
    ],
    l11: [
      { id: "l11a", link: true, board: ". . . . .\nC O C . .\n. . . . .\n. . . . .\n. . . . ." },
      { id: "l11b", link: true, board: ". . C . .\n. . O . .\n. . C . .\n. . . . .\n. . . . ." },
    ],
    l12: [
      { id: "l12a", board: ". . . . .\n. W O W .\n. . . . .\n. . . . .\n. . . . ." },
      { id: "l12b", board: ". W . . .\n. O . . .\n. W . . .\n. . . . .\n. . . . ." },
    ],
    l13: [
      { id: "l13a", minCapture: 2, board: ". . . . . .\n. . . B . .\n. . B W B .\n. . . O . .\n. . B W B .\n. . . B . ." },
      { id: "l13b", minCapture: 2, board: ". . . . . . .\n. . . . . . .\n. . . B . . .\n. . B W B . .\n. . . O . . .\n. . B W B . .\n. . . B . . ." },
    ],
    l14: [
      { id: "l14a", board: ". . . . . . .\n. . . . . . .\n. . O . O . .\n. . . . . . .\n. . O . O . .\n. . . . . . .\n. . . . . . ." },
      { id: "l14b", board: ". . . . . . . . .\n. . . . . . . . .\n. . B . . . B . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . B . . . O . .\n. . . . . . . . .\n. . . . . . . . ." },
    ],
    l15: [
      { id: "l15a", task: "move", toPlay: "W", free: true, showKo: true, make: makeKoSession, accept: [[4, 4]] },
      { id: "l15b", task: "move", toPlay: "W", free: true, showKo: true, make: makeKoSession, accept: [[4, 3]] },
    ],
    l16: [
      {
        id: "l16a",
        task: "move",
        free: true,
        board: "O . . . . . .\nB B B B B B B\nB W W W W W B\nB W E W E W B\nB W W W W W B\nB B B B B B B\n. . . . . . .",
      },
      {
        id: "l16b",
        task: "move",
        free: true,
        board: ". . . . . . .\n. . . . . . .\n. B B B B B B\n. B W W W W B\n. B W E W E B\n. B W W W W B\n. O B B B B B",
      },
    ],
    l17: [
      {
        id: "l17a",
        task: "script",
        board: ". B B B .\nB W W B .\nB . . W .\n. B W . .\n. . . . .",
        steps: [
          { at: [2, 2], reply: [1, 2] },
          { at: [2, 2] },
        ],
      },
      {
        id: "l17b",
        task: "script",
        board: ". . . . .\n. B B B .\n. B W W B\n. W . . B\n. . W B .",
        steps: [
          { at: [2, 3], reply: [3, 3] },
          { at: [2, 3] },
        ],
      },
    ],
    l18: [
      { id: "l18a", task: "pick", board: ". . . . . . .\n. . . . . . .\n. . W W W . .\n. . W O B . .\n. . . . . . .\n. . . . . . .\n. . . . . . ." },
      { id: "l18b", task: "pick", board: ". . . B W W W\n. . . . B O W\n. . . . . . .\n. . . . . . .\n. . . . . . .\n. . . . . . .\n. . . . . . ." },
    ],
    l19: [
      {
        id: "l19a",
        task: "script",
        board: ". . . B . . .\n. . B . . . .\n. B W . . . .\n. . B . . . .\n. . . B . . .\n. . . . . . .\n. . . . . . .",
        steps: [
          { at: [3, 1], reply: [3, 2] },
          { at: [4, 2], reply: [3, 3] },
          { at: [4, 3] },
        ],
      },
      {
        id: "l19b",
        task: "script",
        board: ". . . . . . .\n. . B . . . .\n. B . . . . .\nB W . . . . .\n. B . . . . .\n. . B . . . .\n. . . . . . .",
        steps: [
          { at: [2, 2], reply: [2, 3] },
          { at: [3, 3], reply: [2, 4] },
          { at: [3, 4] },
        ],
      },
    ],
    l20: [
      { id: "l20a", board: ". . . . . . .\n. . . . . . .\n. . B O . . .\n. . O . O . .\n. . . . . . .\n. . . O . . .\n. . . . . . ." },
      { id: "l20b", board: ". . . . . . . . .\n. . . . . . . . .\n. . B . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . . . . . .\n. . . . O . . . .\n. . . . . . . . .\n. . . . . . . . ." },
    ],
  };

  built.forEach((lesson) => {
    const specs = drillBoards[lesson.id] || [];
    lesson.drills = specs.map((spec) => makeDrill(lesson, spec));
  });

  const chapters = [
    { id: "see", title: "认识棋盘", blurb: "子下在交叉上，气在上下左右。", ids: ["l1", "l2"] },
    { id: "take", title: "提子", blurb: "没气了就要拿起来。", ids: ["l3", "l4", "l5"] },
    { id: "atari", title: "打吃与逃", blurb: "只剩一口气，就该跑，或者喊吃。", ids: ["l6", "l7", "l8"] },
    { id: "eye", title: "窗与活棋", blurb: "一扇窗不够，两扇窗才安全。", ids: ["l9", "l10", "l16"] },
    { id: "link", title: "拉手与拦住", blurb: "自己要连上，对方要切开。", ids: ["l11", "l12", "l13"] },
    { id: "corner", title: "角和劫", blurb: "先占角。刚提掉的不能马上拿回。", ids: ["l14", "l15"] },
    { id: "magic", title: "四则魔法", blurb: "先送再提，假窗，追三步，走到边上。", ids: ["l17", "l18", "l19", "l20"] },
  ];

  const later = [
    { title: "死活小题", blurb: "一块棋到底活着还是死了。" },
    { title: "收官", blurb: "快下完的时候，每一口空都要数清楚。" },
  ];

  const practices = [
    {
      id: "one",
      need: "l3",
      title: "提掉这一颗",
      blurb: "它有两口气。先占一口，它若忘记跑，你再提。",
      goal: 1,
      style: "miss",
      line: [[3, 2], [2, 3]],
      ...diagram(`
        . . . . .
        . . B . .
        . B W . .
        . . . . .
        . . . . .
      `),
      intro: voice("先让它只剩一口气。它若忘了跑，下一手就能提。", "先堵住一个鼻孔。它若忘了跑，再吃掉它。", "先打吃。对方若不应，下一手提。"),
      win: voice("它忘了跑。最后一口气被你占上，这一颗拿回家了。", "它忘了逃跑。这颗豆豆回家啦。", "对方未长出，一子被提。"),
    },
    {
      id: "pair",
      need: "l5",
      title: "提掉一整块",
      blurb: "两颗拉着手。占掉最后的气，一起拿回家。",
      goal: 2,
      style: "miss",
      line: [[3, 3], [2, 4]],
      ...diagram(`
        . . . . .
        . . B . .
        . B W B .
        . B W . .
        . . . . .
      `),
      intro: voice("它们的气是一起算的。先占一口，看它们会不会把最后一口气补上。", "两个小白手拉手。先堵一个鼻孔。", "白块共气。先收气，再视其应手。"),
      win: voice("整块的最后一口气没了，两颗一起拿回家。", "两个豆豆一起回家啦。", "整块气尽，一并提取。"),
    },
    {
      id: "run",
      need: "l6",
      title: "先把自己救出去",
      blurb: "你只剩一口气。先跑，不然它就把你提掉。",
      goal: 1,
      style: "hunt",
      kind: "survive",
      anchor: [2, 2],
      line: [[2, 3]],
      ...diagram(`
        . . . . .
        . . W . .
        . W B W .
        . . . . .
        . . . . .
      `),
      intro: voice("你的黑子只剩一口气了。先接到下面，气才会变多。", "你的豆豆快不能喘气了。先逃到下面。", "黑已被打吃。请先长出。"),
      win: voice("跑出去了。气变多了，它这一下提不走你。", "跑掉啦。鼻孔又变多了。", "已长出，暂不被提。"),
    },
    {
      id: "window",
      need: "l10",
      title: "别去填窗",
      blurb: "两扇窗填不进。去提旁边那颗只剩一口气的。",
      goal: 1,
      style: "miss",
      line: [[5, 3]],
      ...diagram(`
        . . . . . . .
        . B B B B . .
        . B W W B . .
        . B W . B . .
        . B W . B W B
        . B W W B B .
        . B B B B . .
      `),
      intro: voice("中间的窗先别填。右边那颗白子只剩一口气，去占上。", "窗户别闯。去吃右边快喘不动的那颗。", "勿点眼。请提右侧一气之子。"),
      win: voice("窗没有填，那颗没气的被你提掉了。", "没去闯窗户，把快喘不动的吃掉了。", "未点眼，一气之子已提。"),
    },
    {
      id: "long",
      need: "l14",
      title: "九路吃子",
      blurb: "空棋盘。谁先提满 5 颗，谁就赢。",
      goal: 5,
      style: "greedy",
      size: 9,
      stones: [],
      accept: [],
      glow: [],
      anchors: [],
      eyes: [],
      intro: voice("这盘长一些。谁先提满 5 颗谁赢。平静的时候先数气，不必每步都找话说。", "黑豆豆先走。先吃满 5 颗的人赢。", "黑先。先提满 5 子者胜。"),
      win: voice("你先提满 5 颗。可以告诉孩子：没气的子，就要拿起来。", "你赢啦。没气的豆豆会被吃掉。", "黑先提满 5 子，胜。"),
    },
  ].map((item) => {
    if (!item.stones) item.stones = [];
    item.intro = item.intro;
    return item;
  });

  const story = [
    ["l14", "先把宝贝放进角里"],
    ["l2", "子会呼吸"],
    ["l7", "先喊一声吃"],
    ["l3", "堵住最后一口气"],
    ["l6", "快喘不动就跑"],
    ["l11", "拉起手"],
    ["l10", "两扇窗户"],
    ["l17", "先送再拿回"],
  ].map(([id, caption]) => ({
    id,
    caption,
    line: draftById[id].teach.child,
  }));

  const byId = Object.fromEntries(built.map((lesson) => [lesson.id, lesson]));

  const pathRaw = [
    {
      id: "p1",
      minutes: 4,
      task: "move",
      toPlay: "B",
      minCapture: 3,
      ...diagram(`
        W W B . .
        W O B . .
        B B . . .
        . . . . .
        . . . . .
      `),
      title: "死活小题",
      prompt: voice(
        "角上这三颗白子只剩中间一个缺口。把黑子放进缺口，整块就没气了。",
        "角落里的小白只剩一个小洞。把黑豆豆放进去，它们就回家了。",
        "角上白块仅余一气。请占该气，整块提取。"
      ),
      teach: voice(
        "死棋就是缺口已经被围死，只差你去占。这一块在角上，堵住缺口，三颗一起拿回家。",
        "小白被关在墙角，洞一堵上，就一起回家了。",
        "死棋：外气已尽，仅余被围之缺口。占上即提。"
      ),
      wrong: voice(
        "还没堵住那个缺口。看角上哪一个空位紧挨着三颗白子。",
        "洞还开着。去堵住角落里那个小洞。",
        "未占唯一缺口，不能整块提取。"
      ),
    },
    {
      id: "p2",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ataris: [[1, 1], [3, 1]],
      ...diagram(`
        . . . . .
        B W O W B
        . B . B .
        . . . . .
        . . . . .
      `),
      title: "双打",
      prompt: voice(
        "左右各有一块白棋。请下在中间这一点，让两块同时只剩一口气。这一手先别提子。",
        "两边各有一颗小白。下在正中间，让它们同时只剩一个鼻孔。先别拿走。",
        "左右两块白棋。请双打，使二者同时恰余一气。此手不提。"
      ),
      teach: voice(
        "一手同时叫吃两块，叫双打。对方下一手只能救一块，另一块就可以提了。",
        "你一下喊了两声吃。小白只能跑一颗，另一颗下一手就能拿回家。",
        "双打：一手同时打吃两块。对方仅能应其一。"
      ),
      wrong: voice(
        "那一下没有让两块都只剩一口气。下在两颗白子中间。",
        "还没同时叫住两边。下在正中间。",
        "未成双打。请落在使两块同时余一气之点。"
      ),
    },
    {
      id: "p3",
      minutes: 5,
      task: "move",
      toPlay: "B",
      minCapture: 5,
      ...diagram(`
        . B B B .
        B W W W B
        B W O W B
        B B B B .
        . . . . .
      `),
      title: "点进眼里",
      prompt: voice(
        "白棋中间只剩这一口。把黑子点进去，不是去填自己的窗，是占掉它最后的气，整块拿起来。",
        "小白中间有一个小洞。把黑豆豆点进去，它们就一起回家。",
        "白块仅余中空一气。请点入而提，非自填眼。"
      ),
      teach: voice(
        "看起来像一扇窗，其实是它最后一口气。点进去的这一子把整块提掉，自己还站得住。",
        "这个小洞是小白最后的鼻孔。点进去，豆豆们回家，你的豆豆还在。",
        "形似眼而实为最后一气。点入后提尽该块，己方有气，故可下。"
      ),
      wrong: voice(
        "还没点到那一口。看白子围住的正中间。",
        "洞在正中间。把豆豆点进去。",
        "未点中唯一之空。请落于白块中空。"
      ),
    },
    {
      id: "p4",
      minutes: 5,
      task: "move",
      toPlay: "B",
      minCapture: 5,
      ...diagram(`
        B B B B .
        B W O W B
        B W W W B
        . B B B .
        . . . . .
      `),
      title: "接不归",
      prompt: voice(
        "白棋中间空着，看起来像能把两边接上。请你先下在这个接点，整块反而被提走。",
        "小白想在中间拉手。你先站在那里，它们就一起回家了。",
        "白欲在中空联络。请先占接点，使其接不归而被提。"
      ),
      teach: voice(
        "接不归：它想连接的那一点，你先占上，连接没有做成，整块的气也没了。",
        "它想来拉手，你先站好。手没拉上，豆豆一起回家了。",
        "接不归：先手占其联络点，该块气尽被提。"
      ),
      wrong: voice(
        "还没占到它想连接的那一点。看两颗白子中间的空位。",
        "站到小白想拉手的那个空位上。",
        "未占联络点。请下在白块欲连接之处。"
      ),
    },
    {
      id: "p5",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ...diagram(`
        . . . . . . .
        . . . . . . .
        . . B . . . .
        . . . . O . .
        . . . O . . .
        . . . . . . .
        . . . . . . .
      `),
      title: "小飞守角",
      prompt: voice(
        "角上已经有一颗黑子。请再走一小飞：横着数两格、竖着数一格，或者横一竖二。两个空位都可以。",
        "角落里已经有一颗黑豆豆。再跳一小步：横着两步、竖着一步。两个地方都行。",
        "已有一子在角。请走小飞：斜向一、二路。两处皆可。"
      ),
      teach: voice(
        "小飞是横二竖一。从角上的子走出这一步，像给角落盖一个小屋顶，以后常用来守角。",
        "横着两步、竖着一步，叫小飞。给角落盖一个小屋顶。",
        "小飞：斜行一路、直进二路。常用于守角。"
      ),
      wrong: voice(
        "这一步不是小飞。从那颗黑子出发，横着两格再竖着一格。",
        "再量一量：横着两步，竖着一步。",
        "非小飞。应为横二竖一之点。"
      ),
    },
    {
      id: "p6",
      minutes: 4,
      task: "move",
      toPlay: "B",
      ...diagram(`
        B B B B W W W
        B O O O B W .
        B O O O B W W
        B B B B W . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
      `),
      title: "哪边空多",
      prompt: voice(
        "快下完的时候先数空。黑这边围住了六口，白那边更少。请到空多的这边，点任意一口。",
        "数一数空座位。黑豆豆这边的空位更多。去那边点一个。",
        "收官先比目数。黑方围空较多。请于黑空中任落一点。"
      ),
      teach: voice(
        "收官就是把已经围住的空补上。先去空多的一边，每一口都算数。白那边那几口，下一回再补。",
        "空位多的那边先放。一格一格放进去，像把座位坐满。",
        "收官自大处着手。先占目数较多之一方。"
      ),
      wrong: voice(
        "那边的空比较少。回到黑子围住的那几口，随便点一口。",
        "去空座位更多的那边。",
        "此点不在目数较多之一侧。"
      ),
    },
  ];

  const pathBuilt = pathRaw.map(normalize);
  const pathDrills = {
    p1: [
      {
        id: "p1a",
        minCapture: 3,
        board: ". . . . .\n. . . . .\n. . . B B\n. . B O W\n. . B W W",
      },
      {
        id: "p1b",
        minCapture: 3,
        board: ". . B W W\n. . B O W\n. . . B B\n. . . . .\n. . . . .",
      },
    ],
    p2: [
      {
        id: "p2a",
        ataris: [[2, 2], [4, 2]],
        board: ". . . . . . .\n. . . . . . .\n. B W O W B .\n. . B . B . .\n. . . . . . .\n. . . . . . .\n. . . . . . .",
      },
      {
        id: "p2b",
        ataris: [[1, 2], [3, 2]],
        board: ". . . . .\n. . . . .\nB W O W B\n. B . B .\n. . . . .",
      },
    ],
    p3: [
      {
        id: "p3a",
        minCapture: 5,
        board: ". . . . . . .\n. . B B B . .\n. B W W W B .\n. B W O W B .\n. B B B B . .\n. . . . . . .\n. . . . . . .",
      },
      {
        id: "p3b",
        minCapture: 5,
        board: ". . . . . . .\n. . . . . . .\n. . . B B B .\n. . B W W W B\n. . B W O W B\n. . B B B B .\n. . . . . . .",
      },
    ],
    p4: [
      {
        id: "p4a",
        minCapture: 5,
        board: ". . . . . . .\n. B B B B . .\n. B W O W B .\n. B W W W B .\n. . B B B . .\n. . . . . . .\n. . . . . . .",
      },
      {
        id: "p4b",
        minCapture: 5,
        board: ". . . . . . .\n. . . . . . .\n. . B B B B .\n. . B W O W B\n. . B W W W B\n. . . B B B .\n. . . . . . .",
      },
    ],
    p5: [
      {
        id: "p5a",
        board: ". . . . . . .\n. . . . . . .\n. . . B . . .\n. . . . . O .\n. . . . O . .\n. . . . . . .\n. . . . . . .",
      },
      {
        id: "p5b",
        board: ". . . . . . .\n. . . . . . .\n. . . . . . .\n. . B . . . .\n. . . . O . .\n. . . O . . .\n. . . . . . .",
      },
    ],
    p6: [
      {
        id: "p6a",
        board: ". . . . . . .\nW W W B B B B\n. W B O O O B\nW W B O O O B\n. W B B B B B\n. . . . . . .\n. . . . . . .",
      },
      {
        id: "p6b",
        board: ". . . . . . .\n. . . . . . .\nB B B B W W W\nB O O O B W .\nB O O O B W W\nB B B B W . .\n. . . . . . .",
      },
    ],
  };
  pathBuilt.forEach((lesson) => {
    lesson.drills = (pathDrills[lesson.id] || []).map((spec) => makeDrill(lesson, spec));
    byId[lesson.id] = lesson;
  });

  const pathChapters = [
    { id: "life", title: "死活", blurb: "先看一块棋还活着没有。缺口堵住，就是死了。", ids: ["p1", "p3"] },
    { id: "fork", title: "吃子花样", blurb: "一手照顾两块，或者占住它想连接的地方。", ids: ["p2", "p4"] },
    { id: "end", title: "布局和收官", blurb: "角上走小飞。快结束时，先去空多的一边。", ids: ["p5", "p6"] },
  ];

  function ordered() {
    return chapters.flatMap((chapter) => chapter.ids.map((id) => {
      if (!byId[id]) throw new Error("missing lesson " + id);
      return byId[id];
    }));
  }

  function pathOrdered() {
    return pathChapters.flatMap((chapter) => chapter.ids.map((id) => {
      if (!byId[id]) throw new Error("missing path lesson " + id);
      return byId[id];
    }));
  }

  function start(lesson) {
    if (lesson.make) return lesson.make();
    const board = E.create(lesson.size);
    for (const stone of lesson.stones) {
      board[stone.y][stone.x] = stone.c === "B" ? E.BLACK : E.WHITE;
    }
    return { board, ko: null, marks: [], last: null, capturedNow: [], step: 0 };
  }

  function judge(lesson, session, x, y) {
    const color = lesson.toPlay === "W" ? E.WHITE : E.BLACK;
    const size = session.board.length;
    if (x < 0 || y < 0 || x >= size || y >= size) return { status: "illegal", reason: "off", session };

    if (lesson.task === "script") {
      const step = session.step || 0;
      const spec = lesson.steps[step];
      if (!spec || x !== spec.at[0] || y !== spec.at[1]) return { status: "wrong", session };
      const played = E.playAt(session.board, x, y, color, session.ko);
      if (!played.ok) return { status: "illegal", reason: played.reason, session };
      let board = played.board;
      let ko = played.ko;
      let last = { x, y };
      if (spec.reply) {
        const opp = color === E.BLACK ? E.WHITE : E.BLACK;
        const reply = E.place(board, spec.reply[0], spec.reply[1], opp, ko);
        if (!reply.ok) return { status: "wrong", session };
        board = reply.board;
        ko = reply.ko;
        last = { x: spec.reply[0], y: spec.reply[1] };
      }
      const next = {
        board,
        ko,
        marks: session.marks,
        last,
        capturedNow: played.captured,
        step: step + 1,
      };
      if (step + 1 >= lesson.steps.length) {
        return { status: "success", captured: played.captured, session: next };
      }
      return { status: "continue", session: next };
    }

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
    if (lesson.free) {
      return {
        status: "success",
        captured: result.captured,
        session: {
          board: result.board,
          ko: result.ko,
          marks: session.marks,
          last: { x, y },
          capturedNow: result.captured,
          step: session.step || 0,
        },
      };
    }
    if (!has(lesson.accept, x, y)) return { status: "wrong", session };

    if (lesson.minCapture && result.captured.length < lesson.minCapture) {
      return { status: "wrong", session };
    }
    const atariPoints = lesson.ataris && lesson.ataris.length ? lesson.ataris : lesson.atari ? [lesson.atari] : null;
    if (atariPoints) {
      for (const [tx, ty] of atariPoints) {
        if (!result.board[ty] || !result.board[ty][tx]) return { status: "wrong", session };
        if (E.groupAt(result.board, tx, ty).liberties !== 1) return { status: "wrong", session };
      }
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
    pathChapters,
    later,
    lessons: built,
    byId,
    ordered,
    pathOrdered,
    start,
    judge,
    reasonLine,
    diagram,
    practices,
    story,
  };
});
