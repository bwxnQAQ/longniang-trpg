import type { ReactNode } from 'react';
import { shopItemOf } from '../../../shared/pets';

// 宠物的头像（V0.6.0）：上传的图，或者名字的第一个字；戴着装扮的话，装扮画在头像上面。
// 装扮是画在 100×100 的格子里的小图，格子比头像大一圈（帽子、灯笼能探出头像外面）。

const OUTFIT_ART: Record<string, ReactNode> = {
  // 红围巾：围在下巴底下，一条尾巴垂下来
  'outfit-scarf': (
    <g>
      <path d="M17 73 Q50 93 83 73 L85 82 Q50 102 15 82 Z" fill="#c0392b" />
      <path d="M17 73 Q50 93 83 73" fill="none" stroke="#8e2a20" strokeWidth="1.2" />
      <path d="M63 84 L73 99 L63 101 L57 87 Z" fill="#a93226" />
      <path d="M66 95 L70 101 M63 96 L66 101" stroke="#f3c4bc" strokeWidth="1" />
    </g>
  ),
  // 蝴蝶结：歪戴在右上角
  'outfit-bow': (
    <g transform="translate(76 15) rotate(18)">
      <path d="M0 0 L-15 -9 Q-18 0 -15 9 Z" fill="#e57399" stroke="#b44a6e" strokeWidth="1" />
      <path d="M0 0 L15 -9 Q18 0 15 9 Z" fill="#e57399" stroke="#b44a6e" strokeWidth="1" />
      <circle r="4.2" fill="#c2185b" />
    </g>
  ),
  // 小铃铛：挂在胸口
  'outfit-bell': (
    <g>
      <path d="M36 82 Q50 91 64 82" fill="none" stroke="#b23a2e" strokeWidth="3" strokeLinecap="round" />
      <path d="M43 93 Q43 83 50 83 Q57 83 57 93 L60 97 L40 97 Z" fill="#d9a521" stroke="#8f6418" strokeWidth="1" />
      <circle cx="50" cy="97.5" r="2.4" fill="#8f6418" />
      <path d="M46 88 Q48 85 51 85" fill="none" stroke="#f6dc8a" strokeWidth="1.2" />
    </g>
  ),
  // 书生帽：方顶的帽子，两条带子
  'outfit-scholar': (
    <g>
      <path d="M31 14 L69 14 L64 2 L36 2 Z" fill="#2c3440" />
      <rect x="25" y="13" width="50" height="6" rx="2" fill="#1d2330" />
      <path d="M72 16 Q82 22 86 32" fill="none" stroke="#1d2330" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 16 Q18 22 14 32" fill="none" stroke="#1d2330" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  // 南瓜帽（万圣节）
  'outfit-pumpkin': (
    <g>
      <ellipse cx="50" cy="10" rx="18" ry="11" fill="#e67e22" stroke="#a84f0c" strokeWidth="1" />
      <path d="M41 1.5 Q36 10 41 19 M59 1.5 Q64 10 59 19 M50 -1 L50 21" fill="none" stroke="#a84f0c" strokeWidth="1" />
      <path d="M50 0 Q50 -7 55 -9" fill="none" stroke="#3f7d3a" strokeWidth="3" strokeLinecap="round" />
      <path d="M43 9 L46 6 L49 9 Z M51 9 L54 6 L57 9 Z M44 13 Q50 17 56 13" fill="#3a2207" />
    </g>
  ),
  // 小幽灵披风（万圣节）：一只小幽灵趴在左上角
  'outfit-ghost': (
    <g>
      <path d="M4 34 Q3 6 21 6 Q39 6 38 34 L33 29 L28 34 L23 29 L18 34 L13 29 L8 34 Z" fill="#f5f7f9" stroke="#8a94a0" strokeWidth="1.2" />
      <ellipse cx="16" cy="18" rx="2.6" ry="3.4" fill="#1d2330" />
      <ellipse cx="27" cy="18" rx="2.6" ry="3.4" fill="#1d2330" />
      <ellipse cx="21.5" cy="25" rx="3" ry="2" fill="#e88a9a" />
    </g>
  ),
  // 圣诞帽
  'outfit-santa': (
    <g>
      <path d="M28 18 Q44 -10 80 6 Q66 6 72 18 Z" fill="#c62828" />
      <rect x="24" y="15" width="52" height="8" rx="4" fill="#fafafa" stroke="#d5d5d5" strokeWidth="1" />
      <circle cx="81" cy="7" r="5.5" fill="#fafafa" stroke="#d5d5d5" strokeWidth="1" />
    </g>
  ),
  // 小灯笼：挂在右上角
  'outfit-lantern': (
    <g>
      <path d="M80 -2 L80 6" stroke="#8f6418" strokeWidth="1.6" />
      <rect x="73" y="5" width="14" height="3" rx="1" fill="#d9a521" />
      <ellipse cx="80" cy="16" rx="10" ry="9" fill="#d32f2f" stroke="#9a1f1f" strokeWidth="1" />
      <path d="M80 7 L80 25 M73 9 Q70 16 73 23 M87 9 Q90 16 87 23" fill="none" stroke="#9a1f1f" strokeWidth="0.9" />
      <rect x="73" y="24" width="14" height="3" rx="1" fill="#d9a521" />
      <path d="M78 27 L77 35 M80 27 L80 36 M82 27 L83 35" stroke="#d9a521" strokeWidth="1.2" />
    </g>
  ),
};

function OutfitArt({ outfit }: { outfit: string }) {
  const art = OUTFIT_ART[outfit];
  if (!art) return null;
  return (
    <svg className="pet-figure-outfit" viewBox="0 -10 100 115" aria-hidden="true" focusable="false">
      {art}
    </svg>
  );
}

/**
 * 宠物的头像。size：large 宠物页（168），medium 主页（96），small 列表（40）。
 * 装扮的名字放在 title 里（鼠标停上去看得到），读屏读 alt。
 */
export function PetFigure({
  name,
  image,
  outfit,
  size = 'small',
}: {
  name: string;
  image: string | null;
  outfit: string | null;
  size?: 'large' | 'medium' | 'small';
}) {
  const wearing = outfit ? shopItemOf(outfit)?.name : null;
  return (
    <span className={`pet-figure pet-figure-${size}`} title={wearing ? `${name}戴着${wearing}` : undefined}>
      {image ? (
        <img src={image} alt={wearing ? `${name}（戴着${wearing}）` : name} />
      ) : (
        <span className="pet-figure-seal" role="img" aria-label={wearing ? `${name}（戴着${wearing}）` : name}>
          {[...name][0]}
        </span>
      )}
      {outfit && <OutfitArt outfit={outfit} />}
    </span>
  );
}
