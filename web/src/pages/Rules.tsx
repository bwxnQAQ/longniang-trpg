import { useEffect } from 'react';
import { sign } from '../format';
import { Link } from '../router';
import {
  ASSIST_BONUS,
  ATTRIBUTE_MAX,
  ATTRIBUTES,
  OUTCOME_LABEL,
  OUTCOME_MEANING,
  outcomeOdds,
  PARTIAL_AT,
  SPECIALTY_COUNT,
  STARTING_VALUES,
  SUCCESS_AT,
  ATTRIBUTE_NAME,
} from '../../../shared/rules';
import { DIFFICULTY_LABEL, LANGUAGE_LABEL, SCENARIO_CATEGORIES, VOICE_LABEL } from '../../../shared/game';
import {
  ARMOR_PER_REDUCTION,
  ATTRIBUTES2,
  BAG_MAX,
  CARD2_MAX,
  CARD2_SPECIALTIES,
  CARD2_SPECIALTY_COST,
  CARD2_SPECIALTY_GROUPS,
  CARD2_SPECIALTY_MAX,
  CARD2_START_MAX,
  CARD2_START_MIN,
  CARD2_START_TOTAL,
  CONSUMABLES,
  DUEL_DAILY,
  DUEL_REWARD,
  DYING_TURNS,
  EQUIP_SLOT_LABEL,
  EQUIP_SLOTS,
  LARGE_RECOMMENDED,
  LEVEL_MAX,
  MODIFIER2_MAX,
  MODIFIER2_MIN,
  RARITY_BONUS,
  RARITY_LABEL,
  REDUCTION_MAX,
  ROLE2_MAX,
  ROLE2_MIN,
  ROLE2_TOTAL,
  SEVERITY,
  SMALL_MAX_PLAYERS,
  WEAKNESS_BONUS,
  growthPoints,
} from '../../../shared/rules2';
import { ENERGY_PER_HOUR, GAME_MIN_ACTIONS, GAME_REWARD_CRYSTALS, JOB_TIERS, PET_STAT_MAX, SATIETY_PER_HOUR, TRIPS } from '../../../shared/pets';
import { LEVEL_MAX_5E, MOD5E_LEVEL, POINT_BUY_TOTAL, SRD_ATTRIBUTION, SRD_NOTE, STANDARD_ARRAY } from '../../../shared/5e/core';
import { CLASS_KEYS } from '../../../shared/5e/types';

const percent = (p: number) => `${Math.round(p * 100)}%`;
const BONUS_ROWS = [-1, 0, 1, 2, 3];

/** 规则说明。数字都从 shared/rules.ts 来，改规则时这一页会跟着变。 */
export function RulesPage() {
  useEffect(() => {
    document.title = '规则 - 龙娘跑团';
  }, []);

  return (
    <div className="rules-layout">
      <nav className="rules-toc" aria-label="规则目录">
        <p className="rules-toc-title">目录</p>
        <ul>
          {TOC.map(([id, title]) => (
            <li key={id}>
              <a href={`#${id}`}>{title}</a>
            </li>
          ))}
        </ul>
        <p className="hint">
          网站的<Link to="/terms">使用规则</Link>单独一页。
        </p>
      </nav>
    <article className="rules">
      <div className="page-head">
        <h1>规则</h1>
      </div>
      <p className="rules-lead">
        龙娘跑团用一套自创的轻规则。你只需要说角色想做什么；要不要掷骰、加减多少由主持 AI 决定，掷骰和算数由程序完成，谁也做不了手脚。「模组」里的 5E
        模组用兼容第五版的规则，普通剧本也能换成这套规则玩，见<a href="#five">5E 模组</a>。
      </p>

      <section id="attributes">
        <h2>属性</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">属性</th>
                <th scope="col">管什么</th>
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTES2.map((a) => (
                <tr key={a.key}>
                  <th scope="row">{a.name}</th>
                  <td>{a.covers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          剧本里现成的身份，七项属性是剧本定好的，按这个身份的实际情况分：擅长的高、不擅长的低，每项 {sign(ROLE2_MIN)}～{sign(ROLE2_MAX)}，七项加起来正好 {ROLE2_TOTAL}（和新做的角色卡一样多）。地下城里用自己做的<a href="#cards">角色卡</a>，属性靠刷地下城成长，不封顶。
        </p>
        <p className="hint">
          V0.7.0 以前开始的对局、导入的老剧本照旧用第一版：{ATTRIBUTES.map((a) => a.name).join('、')}五项属性（{STARTING_VALUES.map(sign).join('、')}，成长最高
          {sign(ATTRIBUTE_MAX)}），伤势和心智各三格。
        </p>
      </section>

      <section id="checks">
        <h2>检定</h2>
        <p>只有结果不确定、失败了也有意思的时候才检定；能直接做到的事不用掷骰。</p>
        <p>检定时掷两颗六面骰（2d6），再加上：</p>
        <ul>
          <li>对应的属性；</li>
          <li>专长：行动符合你的某个专长，+1；</li>
          <li>装备：身上加这一项属性检定的装备（项链、披风、护腕、靴子、戒指、饰品、副手的灯），加最高的那一件的加值；</li>
          <li>
            情境修正：主持按情况给 {sign(MODIFIER2_MIN)}～{sign(MODIFIER2_MAX)}；
          </li>
          <li>协助：同一地点有别的角色花一个行动帮你，{sign(ASSIST_BONUS)}，失败的后果也要一起担；</li>
          <li>减值：带减值的状态标签；地下城还有难度和人手不足的减值（见<a href="#dungeons">地下城</a>）。</li>
        </ul>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">结果</th>
                <th scope="col">条件</th>
                <th scope="col">意思</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{OUTCOME_LABEL.critical}</th>
                <td>两颗骰子都是 6</td>
                <td>{OUTCOME_MEANING.critical}</td>
              </tr>
              <tr>
                <th scope="row">{OUTCOME_LABEL.success}</th>
                <td>总点数 {SUCCESS_AT} 以上</td>
                <td>{OUTCOME_MEANING.success}</td>
              </tr>
              <tr>
                <th scope="row">{OUTCOME_LABEL.partial}</th>
                <td>
                  总点数 {PARTIAL_AT}～{SUCCESS_AT - 1}
                </td>
                <td>{OUTCOME_MEANING.partial}</td>
              </tr>
              <tr>
                <th scope="row">{OUTCOME_LABEL.failure}</th>
                <td>总点数 {PARTIAL_AT - 1} 以下</td>
                <td>{OUTCOME_MEANING.failure}</td>
              </tr>
              <tr>
                <th scope="row">{OUTCOME_LABEL.fumble}</th>
                <td>两颗骰子都是 1</td>
                <td>{OUTCOME_MEANING.fumble}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="hint">两个 6 不管加减多少都是大成功，两个 1 不管加减多少都是大失败。</p>

        <h3>大概的概率</h3>
        <div className="table-wrap">
          <table className="table table-numbers">
            <thead>
              <tr>
                <th scope="col">加减值合计</th>
                <th scope="col">成功</th>
                <th scope="col">有代价的成功</th>
                <th scope="col">失败</th>
              </tr>
            </thead>
            <tbody>
              {BONUS_ROWS.map((bonus) => {
                const odds = outcomeOdds(bonus);
                return (
                  <tr key={bonus}>
                    <th scope="row">{sign(bonus)}</th>
                    <td>{percent(odds.critical + odds.success)}</td>
                    <td>{percent(odds.partial)}</td>
                    <td>{percent(odds.failure + odds.fumble)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="hint">“成功”里包括大成功，“失败”里包括大失败。</p>
      </section>

      <section id="versus">
        <h2>对抗和暗骰</h2>
        <ul>
          <li>对抗：和别人正面较量时（玩家对玩家也一样），双方各掷一次，总点数高的赢，平局维持原状。</li>
          <li>暗骰：有些检定由程序暗中掷，你只看到叙述，看不到点数。</li>
        </ul>
      </section>

      <section id="harm">
        <h2>生命值和精神值</h2>
        <ul>
          <li>生命值 = 10 + 体质 × 2，精神值 = 10 + 意志 × 2。</li>
          <li>
            受伤扣生命值，惊吓、迷惑、恐惧扣精神值。主持按情况给轻、中、重：
            {(['light', 'medium', 'heavy'] as const).map((k) => `${SEVERITY[k].name} ${SEVERITY[k].min}～${SEVERITY[k].max}`).join('，')} 点，程序掷具体扣多少；难度高的地下城每次再多扣一点。
          </li>
          <li>
            护甲：头、肩、胸、手、腰、腿的护甲和副手的盾牌各有护甲值（稀有度的加值，盾牌算两倍），加起来除以 {ARMOR_PER_REDUCTION}、有零头进一，就是扣生命值时减几点；最好的那一件护甲的加值比这个高时按那一件算，最多减 {REDUCTION_MAX}。打中了至少扣 1 点。中毒、坠落这类护甲挡不住。
          </li>
          <li>
            生命值到 0 倒地濒死：同一个地方再结算 {DYING_TURNS} 次行动还没人救（喂药水，或者包扎的检定成功），就死了；倒地的人再挨打也会死。倒地的人只能挣扎求生、呼救。
          </li>
          <li>精神值到 0：下一次行动失控（主持照失控来写），之后回到 1。</li>
          <li>恢复：休息、包扎、安抚能回一些；药水、清心丸回得多。具体由主持按情节判断。</li>
          <li>状态标签：角色身上的特殊状态（中毒、疲惫、被缠住……），由主持加上或去掉，会写明有什么影响。</li>
        </ul>
      </section>

      <section id="combat">
        <h2>战斗</h2>
        <ul>
          <li>剧本写了会动手的敌人才有战斗。开打时，在场的人和敌人各掷 2d6 + 敏捷排先后手。</li>
          <li>攻击：2d6 + 力量（近战）或敏捷（远程、快刺）+ 主手武器的加值（武器是同一项属性的才加），掷到敌人的防御就打中；伤害是 1d6 + 武器加值，大成功翻倍。</li>
          <li>敌人分小怪、精英、首领，生命值、防御、攻击由程序按难度算好记账。你结算一次行动，和你交手的敌人通常各还手一次：掷到你的防御（7 + 敏捷）就打中。</li>
          <li>
            首领有弱点（地下城每一局随机一种），查到并用上时攻击 {sign(WEAKNESS_BONUS)}、伤害再翻倍。大型地下城的首领开打时有护盾，要大家照剧本的方式配合才能破开。
          </li>
          <li>技能：角色卡学会的技能花精神值使用（攻击、横扫、治疗、护身、鼓舞……），效果由程序执行。</li>
        </ul>
      </section>

      <section id="actions">
        <h2>行动和时间</h2>
        <ul>
          <li>在输入框里写下角色要做的事，交给主持人。以「？」开头的是在场外问主持人问题：不花游戏时间，回答只有你看得到。没加「？」、但主持人看出你其实是在问问题，也会当成提问来回答，这一轮你还可以交行动。</li>
          <li>
            人没到齐时是计时模式：提交行动后要等一段现实时间才出结果。默认现实 1 小时等于游戏 1 小时，每个行动等 15 分钟到 2 小时，房主开团时可以改。
          </li>
          <li>每个角色同一时间只能有一个行动在进行，行动次数不限。</li>
          <li>这一局的人都在线时，自动切到回合模式：每人提交这一轮的行动，到齐了一起结算，不用等。</li>
          <li>
            勾了「不计时」的对局（建对局时勾，开局以后房主在「设置」→「计时」里也能改），人不齐也按回合结算：在线的人交齐了就结算，不在的人这一轮不行动，已经交了的照样一起结算（刷新页面、网络断一下不算离开，一小会儿里连回来照样等他）；游戏时间只按行动的耗时往前走。
          </li>
          <li>交行动时可以勾上「悄悄做」：同一地点的人只知道你交了行动，看不到你写了什么；结果也只有你自己看得到。在场的人有没有察觉，由主持判断，察觉到的人会单独收到消息。</li>
          <li>房主随时可以开局，不用等所有人都到齐、都选好身份。开局以后才来的人，选好身份就直接加入故事。</li>
          <li>对白、聊天、看线索、把线索告诉别人、把东西交给别人、写笔记都不算行动，不用等。</li>
        </ul>
      </section>

      <section id="together">
        <h2>和其他玩家一起玩</h2>
        <ul>
          <li>对白：角色当面说的话。同一地点的角色马上就能看到，不用等主持人；也可以只说给在场的某一个人听（悄悄话）。主持人之后结算时也知道你们说过什么。</li>
          <li>
            协助：同一地点有人交了行动、还在等结果，你可以点「协助」。你这一次的行动就是帮他，跟着他的行动一起结算，他的检定 {sign(ASSIST_BONUS)}，成败的后果你们一起承担。
          </li>
          <li>给东西：随身物品可以交给同一地点的其他角色，马上生效。</li>
          <li>告诉线索：你知道的线索可以告诉指定的人或者全队，不用在同一个地方。在「线索」里点「告诉别人」，或者在拿到线索的那段记录下面点。</li>
          <li>场外聊天在右边的「聊天」里，主持人不会把它当成角色的言行。</li>
          <li>AI 队友：身份比来的人多时，房主可以把没人选的身份交给 AI 演。主持人顺带演这个角色，跟着大家行动，只在牵扯到他、或者他该出面的时候说一两句，不抢戏，也不替玩家做决定。他没有角色卡，不交行动，回合不用等他；不能把东西、线索交给他，想让他帮忙，就写在行动或者对白里。</li>
          <li>约团：一局要分几次玩完时，房主在标题旁边的「约时间」里列几个候选时间，大家勾能来、也许、来不了，房主定下一个；定下以后大家收到通知，开始前 30 分钟再提醒一次。时间按你自己设备的时区显示。</li>
          <li>名场面和战报：喜欢的叙述、对白点旁边的 ☆ 收藏起来，「名场面」里能翻回去看；页头的「战报」把这一局做成一张图片，放上角色、掷骰的统计和挑的名场面，结局勾了才放。</li>
        </ul>
      </section>

      <section id="style">
        <h2>主持风格和朗读</h2>
        <ul>
          <li>房主可以在对局的「设置」里改主持风格，改了以后的结算按新的来，记录里会写一句。</li>
          <li>文风：{Object.values(VOICE_LABEL).join('、')}。</li>
          <li>
            难度：{DIFFICULTY_LABEL.easy}（情境修正给得多一些，失败的后果轻一些，卡住时多给机会）、{DIFFICULTY_LABEL.normal}、{DIFFICULTY_LABEL.hard}
            （情境修正从严，莽撞要吃减值，代价实在）。
          </li>
          <li>角色会不会死：关掉以后，生命值到 0 只会倒地，总有被救回来的机会。</li>
          <li>语言：{Object.values(LANGUAGE_LABEL).join('、')}，叙述和 NPC 的话用这种语言写。</li>
          <li>叙述旁边的「朗读」用浏览器自带的语音念出来；开了「自动朗读」，新来的叙述自动念，不花额度。</li>
        </ul>
      </section>

      <section id="sheet">
        <h2>车卡</h2>
        <ol>
          <li>从剧本给的身份里选一个。每个身份的属性、专长、外貌都是剧本定好的，选的时候就看得到，不能改。</li>
          <li>身份的秘密和目标，选定以后才看得到，别的玩家看不到。选定以后不能再换身份。</li>
          <li>给角色起个名字。开局之前还可以改名字。</li>
          <li>地下城不用起名字：选身份以后，选一张自己的角色卡，再选带哪些道具。</li>
          <li>没人选的身份，房主可以在开局前交给 AI 演，交出去的身份开局前玩家选不了；开局以后房主不能再改，晚到的玩家可以接替 AI 演的身份，从这个队友现在的位置接着玩。地下城、5E 模组、用 5E 规则玩的剧本不能交给 AI。</li>
          <li>
            养了宠物的可以带上它，见<a href="#pets">宠物</a>。
          </li>
        </ol>
        <p className="hint">每个身份正好有 {SPECIALTY_COUNT} 个专长：行动正好用上专长时检定 +1。</p>
      </section>

      <section id="dungeons">
        <h2>地下城</h2>
        <ul>
          <li>顶栏「地下城」里的地下城也是完整的剧本，只能带自己的角色卡进去，可以反复刷，有局外培养：打出来的成长点、装备、宝箱都留在角色和账号上。每一局的真相、遇敌和宝物的位置、首领的弱点都可能不一样，有时还会碰上奇遇。</li>
          <li>
            难度 1～{LEVEL_MAX}：每个地下城按攻略难度固定一个，不能选。难度 N 的地下城所有检定、攻击 −(N−1)，敌人也更强，掉的东西更好。
          </li>
          <li>
            小型最多 {SMALL_MAX_PLAYERS} 人；大型推荐 {LARGE_RECOMMENDED} 人，少一个人检定再 −1，首领要几个人配合才打得过。传奇装备只在大型里掉。
          </li>
          <li>进去时最多带 {BAG_MAX} 个道具（{CONSUMABLES.map((c) => c.name).join('、')}），用掉就没了。</li>
          <li>
            结局分通关、逃出来、失败。活着通关的拿全部成长点（小型 难度+1，大型 2×(难度+1)；难度 3 的小型是 {growthPoints(3, 'small', 'clear')} 点）和宝箱；逃出来成长点减半、没有宝箱；失败、死了什么都没有。
          </li>
          <li>这一局捡到的装备、道具、秘籍、龙晶，活着走到结局（失败的除外）才能带出去；已经有的装备折成龙晶。捡到的道具当场就能用，用掉的就带不出去了；装备要带出去以后才能穿。</li>
          <li>打完以后可以「再刷一次」：同一个地下城、叫上同一批人再开一局。</li>
        </ul>
      </section>

      <section id="cards">
        <h2>角色卡</h2>
        <ul>
          <li>
            每个正式账号最多做 {CARD2_MAX} 张角色卡，在「我的角色」里。新卡七项属性每项 {sign(CARD2_START_MIN)}～{sign(CARD2_START_MAX)}，加起来正好 {CARD2_START_TOTAL}，再从专长列表里选两个（{CARD2_SPECIALTY_GROUPS.length} 组一共 {CARD2_SPECIALTIES.length} 个：{CARD2_SPECIALTY_GROUPS.map((g) => g.name).join('、')}）。
          </li>
          <li>成长：属性 +1 要花「现在的值 + 1」点成长点（至少 1 点），越高越贵，但不封顶；学新专长也从列表里选，花 {CARD2_SPECIALTY_COST} 点，最多 {CARD2_SPECIALTY_MAX} 个。</li>
          <li>
            装备像网游的人物栏，身上 16 个格子：{[...new Set(EQUIP_SLOTS.map((k) => EQUIP_SLOT_LABEL[k]))].join('、')}（戒指、饰品各两个格子），在「我的角色」里点格子换。主手的武器加它那一项属性的攻击和伤害；护甲和盾牌减伤（见<a href="#harm">生命值和精神值</a>）；别的加它那一项属性的检定，同一项属性只算最高的那一件。稀有度：
            {(['common', 'fine', 'rare', 'epic', 'legendary'] as const).map((r) => `${RARITY_LABEL[r]} +${RARITY_BONUS[r]}`).join('、')}；传奇的还有特别的本事。普通装备在商城买，别的从地下城里捡、从宝箱里开。
          </li>
          <li>技能：只能从秘籍学，在「我的角色」里研读。秘籍藏在地下城里。</li>
          <li>宝箱：只能靠通关地下城得到，不能买；开出龙晶，再加道具或装备。</li>
          <li>
            切磋：拿自己的卡和别人的卡比三轮，每轮随机一项属性，2d6 + 属性 + 对应的装备（同一项属性的主手武器和最好的那件加检定的；比体质时再加减伤），大的赢；带着的宠物在输掉的那一轮帮着重掷一次。每天最多主动切磋 {DUEL_DAILY} 次，赢的得 {DUEL_REWARD} 龙晶。
          </li>
          <li>「排行」里有角色的战力榜和切磋胜场榜。</li>
        </ul>
      </section>

      <section id="five">
        <h2>5E 模组</h2>
        <p>
          「模组」里的 5E 模组用兼容第五版的 5E 规则：六项属性、技能和熟练加值、d20 检定、先攻和回合、法术位都照第五版，角色 1～{LEVEL_MAX_5E} 级。掷骰和算数照样由程序完成，你只需要说角色想做什么。
        </p>
        <h3>5E 角色卡</h3>
        <ul>
          <li>
            在「我的角色」的「5E 角色」里做，每个正式账号最多 {CARD2_MAX} 张：选职业（{CLASS_KEYS.length} 个）、种族、背景，属性用标准数组（{STANDARD_ARRAY.join('、')} 各用一次）或者购点（{POINT_BUY_TOTAL} 点），再选技能、法术和起始装备。没选完、选得不对的地方标在步骤上，也可以点「按推荐填好」。
          </li>
          <li>5E 模组只能带自己的 5E 角色卡进去，进去时生命值、法术位、能力都是满的。</li>
          <li>
            「模组」里的 5E 模组走到结局，自己交过至少 {GAME_MIN_ACTIONS} 个行动、活着的角色：身上的东西和钱换成这一局结束时的（用掉的没了，找到的留下），再得到一次升级，在「5E 角色」里选这一级的新能力，最高 {LEVEL_MAX_5E} 级。死了的角色卡保持进模组之前的样子。自己导入、让 AI 写的 5E 模组能玩，但不升级、不带走东西。
          </li>
          <li>没打过模组的 1 级卡可以重做。长休时能换的（准备的法术、拿的武器、穿的护甲）不在模组里的时候随时能改。</li>
        </ul>
        <h3>普通剧本用 5E 规则玩</h3>
        <ul>
          <li>普通剧本（地下城、5E 模组以外的）开局时勾上「用 5E 规则玩」，或者房主在开团准备里打开它，这一局就按 5E 规则来。开局以后不能再换；换规则时大家选好的身份会清空，交给 AI 演的身份也会取消。</li>
          <li>每个身份转成一个 {MOD5E_LEVEL} 级的 5E 角色：职业、属性、技能照身份的属性和专长来；没有法术的世界观里，谁都不会施法。选身份时看得到转好的角色，你只起名字，不用自己的 5E 角色卡。</li>
          <li>线索的检定换成 5E 的技能和难度（DC）；剧本里的敌人换成第五版里最接近的怪物，没写成敌人的人物动起手来，用「普通人」「会打架的人」「官差兵丁」「练家子」这几种通用的数据。</li>
          <li>打完不升级、不带走东西；玩完的局数、结局图鉴、宠物的成长照旧算在原来的剧本上。</li>
        </ul>
        <h3>检定和战斗</h3>
        <ul>
          <li>检定：d20 + 属性调整值（属性减 10 除以 2，向下取整），擅长的技能再加熟练加值，达到难度（DC）就成功。优势掷两颗取高的，劣势取低的。</li>
          <li>攻击：d20 + 调整值 + 熟练加值，达到目标的护甲等级（AC）就打中；掷到 20 是重击，伤害骰翻倍。</li>
          <li>先攻：开打时在场的角色和怪物掷 d20 + 敏捷调整值排顺序。你的一次结算就是你的一个回合：移动，做一个动作，有附赠动作的再做一个附赠动作；轮到排在你后面的怪物，主持人让它们行动。大家都行动过就是新的一轮。</li>
          <li>法术：施法用法术位，长休回满；戏法不用法术位。专注的法术同时只能有一个，受伤时要过专注豁免。</li>
          <li>生命值到 0 倒地昏迷，开始掷死亡豁免：三次成功稳定下来，三次失败死亡，掷到 20 醒过来；任何治疗都能让人醒过来。房主关掉「角色会不会死」时，最多倒地。</li>
          <li>休息：短休至少 1 小时，可以花生命骰回血，有些能力回来；长休 8 小时，一天一次，回满生命值、法术位和能力。</li>
          <li>宝藏只有剧本里写的。钱按金币、银币、铜币算，在模组里也能买卖普通装备。</li>
        </ul>
        <p className="rules-srd">{SRD_NOTE}</p>
        <p className="rules-srd" lang="en">
          {SRD_ATTRIBUTION}
        </p>
      </section>

      <section id="secrets">
        <h2>谁知道什么</h2>
        <ul>
          <li>你找到的线索默认只有你知道。可以告诉指定的人或者全队，不用在同一个地方；主持 AI 也会知道他们知道了。</li>
          <li>只发给你的叙述只有你知道。想让别人知道，就在游戏里说出来。</li>
          <li>笔记默认其他玩家看不到，主持 AI 也看不到；可以分享给这一局的人，他们只能看、不能改。</li>
          <li>暗骰的结果只发给本人。</li>
          <li>收藏的名场面只有自己看得到。战报里的行动、检定只算你看得到的；只有你知道的条目和悄悄话默认不放进战报，自己勾了才放。</li>
          <li>AI 队友知道他那个身份的秘密，到合适的时候才在故事里透露。</li>
          <li>
            房主可以撤回或重新结算最近一次结算，也可以手动修正角色的数值和线索归属。房主要查看别人的角色状态、别人找到的线索时，记录里会写明「房主查看了……」，大家都看得到。
          </li>
          <li>不在这一局里的人观看公开的对局时，只看得到故事：开场、每次行动的结算、公开的对白和结局。看不到谁的身份秘密、悄悄话、场外聊天和场外问答，也看不到角色卡和线索。</li>
        </ul>
      </section>

      <section id="pets">
        <h2>宠物</h2>
        <ul>
          <li>每个正式账号可以养一只宠物，它不属于哪个剧本，一直跟着你。</li>
          <li>
            玩完一个剧本（走到结局，自己交过至少 {GAME_MIN_ACTIONS} 个行动），剧本分区对应的属性 +1，另外得 {GAME_REWARD_CRYSTALS} 龙晶，一局只算一次：
            {SCENARIO_CATEGORIES.map((c) => `${c.name}长${ATTRIBUTE_NAME[c.attribute]}`).join('、')}。没写分区的剧本只给龙晶。
          </li>
          <li>
            饱食度每小时降 {SATIETY_PER_HOUR}，精力每小时回 {ENERGY_PER_HOUR}（打工、远行的时候不回），都在 0～{PET_STAT_MAX} 之间。
          </li>
          <li>
            打工：每项属性有三档工，属性到 {JOB_TIERS[1].need}、{JOB_TIERS[2].need}、{JOB_TIERS[3].need} 才能做。去的时候花掉精力和饱食度，做完得龙晶；中途不干了没有工钱。
          </li>
          <li>
            远行：「{TRIPS.near.name}」{TRIPS.near.hours} 小时，「{TRIPS.far.name}」{TRIPS.far.hours} 小时。回来带龙晶和一张明信片，出远门还可能带吃的；中途叫回来什么也带不回来。
          </li>
          <li>
            龙晶是整个网站通用的货币，在<Link to="/shop">商城</Link>里买吃的、提神茶、改名卡、地下城道具、装备、装扮、头像框、骰子皮肤、称号，也能换 AI
            额度（每人每月、全站每月都有上限，管理员可以关掉）。买到的东西在「我的背包」里：喂宠物、给宠物改名字都在那里；头像框、骰子、称号、宠物装扮在「我的装扮」里戴。
          </li>
          <li>
            建角色时可以带上宠物，它会在故事里陪着你，不替你找线索、拿主意。宠物的名字和介绍会发给主持 AI，带进剧本之前先检查。
          </li>
          <li>
            宠物出手：交行动时勾上，这次检定失败了（对抗输了），宠物扑上去帮忙再掷一次，宠物这一项属性到 3 再 +1、到 6 再 +2。每局只能用一次。
          </li>
          <li>带着宠物玩完一局，它会写一篇日记，只有你看得到。</li>
        </ul>
      </section>
    </article>
    </div>
  );
}

const TOC: [string, string][] = [
  ['attributes', '属性'],
  ['checks', '检定'],
  ['versus', '对抗和暗骰'],
  ['harm', '生命值和精神值'],
  ['combat', '战斗'],
  ['actions', '行动和时间'],
  ['together', '和其他玩家一起玩'],
  ['style', '主持风格和朗读'],
  ['sheet', '车卡'],
  ['dungeons', '地下城'],
  ['cards', '角色卡'],
  ['five', '5E 模组'],
  ['secrets', '谁知道什么'],
  ['pets', '宠物'],
];
