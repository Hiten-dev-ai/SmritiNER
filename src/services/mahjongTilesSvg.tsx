import React from 'react';
import type { TileIdentity } from './mahjongEngine';

interface TileSvgProps {
  identity: TileIdentity;
  theme: 'ner-heritage' | 'classic-ivory';
  className?: string;
  largePrint?: boolean;
}

export const TileArtwork: React.FC<TileSvgProps> = ({
  identity,
  theme,
  className = 'w-full h-full',
  largePrint = false,
}) => {
  const { symbolKey, number, suit, isFlower, isSeason } = identity;

  // -----------------------------------------------------------------
  // CLASSIC IVORY THEME (Traditional vector Mahjong style)
  // -----------------------------------------------------------------
  if (theme === 'classic-ivory') {
    // CIRCLES (Dots)
    if (suit === 'nature' || suit === 'circles') {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {number === 1 && (
            <g>
              <circle cx="50" cy="50" r="32" fill="#047857" stroke="#065f46" strokeWidth="4" />
              <circle cx="50" cy="50" r="18" fill="#f59e0b" />
              <circle cx="50" cy="50" r="8" fill="#dc2626" />
            </g>
          )}
          {number === 2 && (
            <g>
              <circle cx="50" cy="28" r="16" fill="#047857" stroke="#065f46" strokeWidth="3" />
              <circle cx="50" cy="72" r="16" fill="#dc2626" stroke="#b91c1c" strokeWidth="3" />
            </g>
          )}
          {number === 3 && (
            <g>
              <circle cx="28" cy="26" r="13" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="13" fill="#dc2626" stroke="#b91c1c" strokeWidth="2.5" />
              <circle cx="72" cy="74" r="13" fill="#047857" stroke="#065f46" strokeWidth="2.5" />
            </g>
          )}
          {number === 4 && (
            <g>
              <circle cx="30" cy="30" r="14" fill="#0284c7" />
              <circle cx="70" cy="30" r="14" fill="#047857" />
              <circle cx="30" cy="70" r="14" fill="#047857" />
              <circle cx="70" cy="70" r="14" fill="#0284c7" />
            </g>
          )}
          {number === 5 && (
            <g>
              <circle cx="28" cy="28" r="12" fill="#0284c7" />
              <circle cx="72" cy="28" r="12" fill="#047857" />
              <circle cx="50" cy="50" r="15" fill="#dc2626" />
              <circle cx="28" cy="72" r="12" fill="#047857" />
              <circle cx="72" cy="72" r="12" fill="#0284c7" />
            </g>
          )}
          {number === 6 && (
            <g>
              <circle cx="32" cy="24" r="12" fill="#047857" />
              <circle cx="68" cy="24" r="12" fill="#047857" />
              <circle cx="32" cy="50" r="12" fill="#dc2626" />
              <circle cx="68" cy="50" r="12" fill="#dc2626" />
              <circle cx="32" cy="76" r="12" fill="#dc2626" />
              <circle cx="68" cy="76" r="12" fill="#dc2626" />
            </g>
          )}
          {number === 7 && (
            <g>
              <circle cx="25" cy="20" r="10" fill="#047857" />
              <circle cx="50" cy="26" r="10" fill="#047857" />
              <circle cx="75" cy="32" r="10" fill="#047857" />
              <circle cx="32" cy="56" r="11" fill="#dc2626" />
              <circle cx="68" cy="56" r="11" fill="#dc2626" />
              <circle cx="32" cy="80" r="11" fill="#dc2626" />
              <circle cx="68" cy="80" r="11" fill="#dc2626" />
            </g>
          )}
          {number === 8 && (
            <g>
              <circle cx="32" cy="18" r="10" fill="#0284c7" />
              <circle cx="68" cy="18" r="10" fill="#0284c7" />
              <circle cx="32" cy="39" r="10" fill="#0284c7" />
              <circle cx="68" cy="39" r="10" fill="#0284c7" />
              <circle cx="32" cy="61" r="10" fill="#0284c7" />
              <circle cx="68" cy="61" r="10" fill="#0284c7" />
              <circle cx="32" cy="82" r="10" fill="#0284c7" />
              <circle cx="68" cy="82" r="10" fill="#0284c7" />
            </g>
          )}
          {number === 9 && (
            <g>
              {[0, 1, 2].map((r) =>
                [0, 1, 2].map((c) => (
                  <circle
                    key={`${r}-${c}`}
                    cx={25 + c * 25}
                    cy={25 + r * 25}
                    r="10"
                    fill={r === 0 ? '#047857' : r === 1 ? '#dc2626' : '#0284c7'}
                  />
                ))
              )}
            </g>
          )}
          {number && (
            <g>
              <rect x="3" y="3" width={largePrint ? "22" : "18"} height={largePrint ? "22" : "18"} rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <text x={largePrint ? "14" : "12"} y={largePrint ? "20" : "17"} fontSize={largePrint ? "18" : "14"} fontWeight="900" fill="#0f172a" textAnchor="middle">
                {number}
              </text>
            </g>
          )}
        </svg>
      );
    }

    // BAMBOO (Sticks)
    if (suit === 'culture' || suit === 'bamboo') {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {number === 1 && (
            <g>
              <path d="M50 20 C60 20 68 28 68 40 C68 60 50 78 50 78 C50 78 32 60 32 40 C32 28 40 20 50 20 Z" fill="#047857" />
              <circle cx="50" cy="34" r="8" fill="#dc2626" />
              <circle cx="50" cy="34" r="4" fill="#fef08a" />
              <path d="M46 76 L54 76 L50 86 Z" fill="#b45309" />
            </g>
          )}
          {number === 2 && (
            <g>
              <rect x="44" y="15" width="12" height="30" rx="3" fill="#047857" />
              <rect x="44" y="55" width="12" height="30" rx="3" fill="#0284c7" />
            </g>
          )}
          {number === 3 && (
            <g>
              <rect x="44" y="15" width="12" height="28" rx="3" fill="#0284c7" />
              <rect x="28" y="55" width="12" height="28" rx="3" fill="#047857" />
              <rect x="60" y="55" width="12" height="28" rx="3" fill="#047857" />
            </g>
          )}
          {number === 4 && (
            <g>
              <rect x="28" y="15" width="11" height="30" rx="2" fill="#0284c7" />
              <rect x="61" y="15" width="11" height="30" rx="2" fill="#047857" />
              <rect x="28" y="55" width="11" height="30" rx="2" fill="#047857" />
              <rect x="61" y="55" width="11" height="30" rx="2" fill="#0284c7" />
            </g>
          )}
          {number === 5 && (
            <g>
              <rect x="24" y="15" width="10" height="28" rx="2" fill="#047857" />
              <rect x="66" y="15" width="10" height="28" rx="2" fill="#0284c7" />
              <rect x="45" y="36" width="10" height="28" rx="2" fill="#dc2626" />
              <rect x="24" y="57" width="10" height="28" rx="2" fill="#0284c7" />
              <rect x="66" y="57" width="10" height="28" rx="2" fill="#047857" />
            </g>
          )}
          {number === 6 && (
            <g>
              <rect x="24" y="15" width="10" height="30" rx="2" fill="#047857" />
              <rect x="45" y="15" width="10" height="30" rx="2" fill="#047857" />
              <rect x="66" y="15" width="10" height="30" rx="2" fill="#047857" />
              <rect x="24" y="55" width="10" height="30" rx="2" fill="#047857" />
              <rect x="45" y="55" width="10" height="30" rx="2" fill="#047857" />
              <rect x="66" y="55" width="10" height="30" rx="2" fill="#047857" />
            </g>
          )}
          {number === 7 && (
            <g>
              <rect x="45" y="12" width="10" height="24" rx="2" fill="#dc2626" />
              <rect x="24" y="42" width="10" height="22" rx="2" fill="#047857" />
              <rect x="45" y="42" width="10" height="22" rx="2" fill="#047857" />
              <rect x="66" y="42" width="10" height="22" rx="2" fill="#047857" />
              <rect x="24" y="70" width="10" height="22" rx="2" fill="#047857" />
              <rect x="45" y="70" width="10" height="22" rx="2" fill="#047857" />
              <rect x="66" y="70" width="10" height="22" rx="2" fill="#047857" />
            </g>
          )}
          {number === 8 && (
            <g>
              <rect x="20" y="18" width="10" height="28" rx="2" fill="#047857" transform="rotate(-15 25 32)" />
              <rect x="42" y="18" width="10" height="28" rx="2" fill="#0284c7" />
              <rect x="64" y="18" width="10" height="28" rx="2" fill="#047857" transform="rotate(15 69 32)" />
              <rect x="20" y="54" width="10" height="28" rx="2" fill="#0284c7" transform="rotate(15 25 68)" />
              <rect x="42" y="54" width="10" height="28" rx="2" fill="#047857" />
              <rect x="64" y="54" width="10" height="28" rx="2" fill="#0284c7" transform="rotate(-15 69 68)" />
            </g>
          )}
          {number === 9 && (
            <g>
              {[0, 1, 2].map((r) =>
                [0, 1, 2].map((c) => (
                  <rect
                    key={`${r}-${c}`}
                    x={24 + c * 21}
                    y={16 + r * 26}
                    width="10"
                    height="20"
                    rx="2"
                    fill={c === 1 ? '#0284c7' : '#047857'}
                  />
                ))
              )}
            </g>
          )}
          {number && (
            <g>
              <rect x="3" y="3" width={largePrint ? "22" : "18"} height={largePrint ? "22" : "18"} rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <text x={largePrint ? "14" : "12"} y={largePrint ? "20" : "17"} fontSize={largePrint ? "18" : "14"} fontWeight="900" fill="#0f172a" textAnchor="middle">
                {number}
              </text>
            </g>
          )}
        </svg>
      );
    }

    // CHARACTERS (Craps / Wan)
    if (suit === 'daily' || suit === 'characters') {
      const chineseChars = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
      const char = chineseChars[(number || 1) - 1];
      return (
        <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="42" fontSize="34" fontWeight="900" fill="#0284c7" textAnchor="middle" dominantBaseline="central">
            {char}
          </text>
          <text x="50" y="78" fontSize="28" fontWeight="900" fill="#dc2626" textAnchor="middle" dominantBaseline="central">
            萬
          </text>
          {number && (
            <g>
              <rect x="3" y="3" width={largePrint ? "22" : "18"} height={largePrint ? "22" : "18"} rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <text x={largePrint ? "14" : "12"} y={largePrint ? "20" : "17"} fontSize={largePrint ? "18" : "14"} fontWeight="900" fill="#0f172a" textAnchor="middle">
                {number}
              </text>
            </g>
          )}
        </svg>
      );
    }

    // WINDS
    if (suit === 'winds') {
      const windChar =
        symbolKey === 'wind_east' ? '東' : symbolKey === 'wind_south' ? '南' : symbolKey === 'wind_west' ? '西' : '北';
      return (
        <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="55" fontSize="48" fontWeight="900" fill="#0f172a" textAnchor="middle" dominantBaseline="central">
            {windChar}
          </text>
        </svg>
      );
    }

    // DRAGONS
    if (suit === 'dragons') {
      if (symbolKey === 'dragon_red') {
        return (
          <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
            <text x="50" y="55" fontSize="54" fontWeight="900" fill="#dc2626" textAnchor="middle" dominantBaseline="central">
              中
            </text>
          </svg>
        );
      }
      if (symbolKey === 'dragon_green') {
        return (
          <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
            <text x="50" y="55" fontSize="54" fontWeight="900" fill="#047857" textAnchor="middle" dominantBaseline="central">
              發
            </text>
          </svg>
        );
      }
      // White dragon
      return (
        <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="18" width="60" height="64" rx="4" fill="none" stroke="#0284c7" strokeWidth="6" strokeDasharray="12 4" />
        </svg>
      );
    }

    // FLOWERS & SEASONS
    if (isFlower || isSeason) {
      return (
        <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="34" fill={isFlower ? '#fdf2f8' : '#eff6ff'} stroke={isFlower ? '#db2777' : '#2563eb'} strokeWidth="3.5" />
          <text x="50" y="52" fontSize="36" textAnchor="middle" dominantBaseline="central">
            {isFlower ? '🌸' : '🌤️'}
          </text>
        </svg>
      );
    }
  }

  // -----------------------------------------------------------------
  // NER HERITAGE THEME (Consistent vector cultural symbols)
  // -----------------------------------------------------------------

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      {/* Corner suit / family badge */}
      {number && (
        <g>
          <rect x="3" y="3" width={largePrint ? "22" : "18"} height={largePrint ? "22" : "18"} rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <text
            x={largePrint ? "14" : "12"}
            y={largePrint ? "20" : "17"}
            fontSize={largePrint ? "18" : "14"}
            fontWeight="900"
            fill="#0f172a"
            textAnchor="middle"
          >
            {number}
          </text>
        </g>
      )}

      {/* NATURE SUIT */}
      {symbolKey === 'rhino' && (
        <g fill="#334155">
          <path d="M22 65 C22 45 35 32 60 32 C75 32 82 40 85 50 L88 45 L90 52 L84 56 C80 70 70 75 55 75 L30 75 Z" />
          <path d="M85 45 L92 35 L86 50 Z" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
          <circle cx="70" cy="45" r="3" fill="#f8fafc" />
        </g>
      )}

      {symbolKey === 'hornbill' && (
        <g>
          <path d="M45 25 C60 25 75 35 75 55 C75 75 60 85 45 85 C35 85 30 75 30 55 Z" fill="#0f172a" />
          <path d="M55 20 Q85 15 90 35 Q75 42 58 38 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
          <path d="M65 30 L95 40 L65 45 Z" fill="#f97316" />
          <circle cx="55" cy="35" r="4" fill="#ffffff" />
          <circle cx="56" cy="35" r="2" fill="#0f172a" />
        </g>
      )}

      {symbolKey === 'orchid' && (
        <g>
          <path d="M50 85 Q50 30 75 20" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={45 + (i % 2) * 14} cy={35 + i * 10} r="9" fill="#f43f5e" opacity="0.9" />
          ))}
          <circle cx="52" cy="50" r="4" fill="#fef08a" />
        </g>
      )}

      {symbolKey === 'bamboo' && (
        <g stroke="#16a34a" strokeWidth="6" strokeLinecap="round">
          <line x1="38" y1="18" x2="38" y2="82" />
          <line x1="62" y1="18" x2="62" y2="82" />
          <line x1="32" y1="40" x2="44" y2="40" strokeWidth="3" />
          <line x1="32" y1="62" x2="44" y2="62" strokeWidth="3" />
          <line x1="56" y1="35" x2="68" y2="35" strokeWidth="3" />
          <line x1="56" y1="58" x2="68" y2="58" strokeWidth="3" />
        </g>
      )}

      {symbolKey === 'boat' && (
        <g>
          <path d="M15 62 Q50 78 85 62 L78 72 Q50 84 22 72 Z" fill="#854d0e" stroke="#713f12" strokeWidth="2" />
          <path d="M40 38 Q50 32 60 38 L60 62 L40 62 Z" fill="#ca8a04" />
          <line x1="30" y1="35" x2="65" y2="80" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {symbolKey === 'lotus' && (
        <g>
          <path d="M50 25 C35 45 40 70 50 80 C60 70 65 45 50 25 Z" fill="#ec4899" />
          <path d="M30 45 C25 60 35 75 50 80 C40 65 35 55 30 45 Z" fill="#f472b6" />
          <path d="M70 45 C75 60 65 75 50 80 C60 65 65 55 70 45 Z" fill="#f472b6" />
        </g>
      )}

      {symbolKey === 'butterfly' && (
        <g>
          <path d="M50 40 Q25 15 20 40 Q20 65 50 55 Q80 65 80 40 Q75 15 50 40 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
          <ellipse cx="50" cy="52" rx="4" ry="16" fill="#0f172a" />
        </g>
      )}

      {symbolKey === 'tea_bush' && (
        <g>
          <path d="M30 75 Q50 45 50 30 Q50 45 70 75 Z" fill="#15803d" />
          <circle cx="50" cy="40" r="16" fill="#22c55e" />
          <circle cx="38" cy="52" r="14" fill="#16a34a" />
          <circle cx="62" cy="52" r="14" fill="#16a34a" />
        </g>
      )}

      {symbolKey === 'banyan' && (
        <g>
          <path d="M44 85 L44 55 Q30 45 30 30 Q50 15 70 30 Q70 45 56 55 L56 85 Z" fill="#15803d" stroke="#166534" strokeWidth="2" />
          <line x1="36" y1="42" x2="36" y2="78" stroke="#854d0e" strokeWidth="2" />
          <line x1="64" y1="42" x2="64" y2="78" stroke="#854d0e" strokeWidth="2" />
        </g>
      )}

      {/* CULTURE SUIT */}
      {symbolKey === 'japi' && (
        <g>
          <path d="M50 20 L85 75 L15 75 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="3" />
          <circle cx="50" cy="55" r="10" fill="#dc2626" />
          <line x1="50" y1="20" x2="50" y2="75" stroke="#ca8a04" strokeWidth="2" />
        </g>
      )}

      {symbolKey === 'dhol' && (
        <g>
          <ellipse cx="50" cy="50" rx="34" ry="20" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="22" cy="50" rx="6" ry="18" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="78" cy="50" rx="6" ry="18" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
          <path d="M22 34 L78 66 M22 66 L78 34" stroke="#fef3c7" strokeWidth="2" />
        </g>
      )}

      {symbolKey === 'gamosa' && (
        <g>
          <rect x="22" y="24" width="56" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="22" y="24" width="56" height="12" fill="#dc2626" />
          <rect x="22" y="64" width="56" height="12" fill="#dc2626" />
          <path d="M30 30 L36 26 L42 30 L48 26 L54 30 L60 26 L66 30 L72 26" stroke="#ffffff" strokeWidth="2" />
        </g>
      )}

      {symbolKey === 'mask' && (
        <g>
          <path d="M50 18 Q75 18 75 45 Q75 75 50 82 Q25 75 25 45 Q25 18 50 18 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="3" />
          <circle cx="40" cy="40" r="5" fill="#ffffff" />
          <circle cx="60" cy="40" r="5" fill="#ffffff" />
          <circle cx="40" cy="40" r="2.5" fill="#000000" />
          <circle cx="60" cy="40" r="2.5" fill="#000000" />
          <path d="M40 64 Q50 72 60 64" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {symbolKey === 'bell_metal' && (
        <g>
          <ellipse cx="50" cy="40" rx="30" ry="12" fill="#eab308" stroke="#a16207" strokeWidth="3" />
          <path d="M20 40 Q25 75 50 78 Q75 75 80 40 Z" fill="#ca8a04" stroke="#a16207" strokeWidth="3" />
        </g>
      )}

      {symbolKey === 'basket' && (
        <g stroke="#92400e" strokeWidth="3">
          <path d="M24 35 L32 78 L68 78 L76 35 Z" fill="#fde68a" />
          <line x1="30" y1="48" x2="70" y2="48" />
          <line x1="31" y1="62" x2="69" y2="62" />
          <path d="M32 35 Q50 18 68 35" fill="none" strokeWidth="4" />
        </g>
      )}

      {symbolKey === 'lamp' && (
        <g>
          <ellipse cx="50" cy="65" rx="26" ry="12" fill="#c2410c" stroke="#9a3412" strokeWidth="2" />
          <path d="M50 20 Q60 38 50 54 Q40 38 50 20 Z" fill="#eab308" />
          <circle cx="50" cy="45" r="4" fill="#ef4444" />
        </g>
      )}

      {symbolKey === 'loom' && (
        <g stroke="#78350f" strokeWidth="3">
          <rect x="25" y="30" width="50" height="40" rx="4" fill="#fef3c7" />
          <line x1="35" y1="30" x2="35" y2="70" stroke="#dc2626" />
          <line x1="45" y1="30" x2="45" y2="70" stroke="#16a34a" />
          <line x1="55" y1="30" x2="55" y2="70" stroke="#2563eb" />
          <line x1="65" y1="30" x2="65" y2="70" stroke="#eab308" />
        </g>
      )}

      {symbolKey === 'pepa' && (
        <g>
          <path d="M30 75 Q40 30 75 25 L80 35 Q50 40 40 80 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="78" cy="30" rx="8" ry="12" fill="#ca8a04" />
        </g>
      )}

      {/* DAILY SUIT */}
      {symbolKey === 'cup' && (
        <g>
          <path d="M25 35 L30 75 Q50 82 70 75 L75 35 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          <path d="M72 40 Q88 50 70 65" fill="none" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 20 Q42 26 40 32 M50 18 Q52 25 50 32 M60 20 Q62 26 60 32" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {symbolKey === 'kettle' && (
        <g>
          <ellipse cx="50" cy="58" rx="26" ry="20" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <path d="M32 38 Q50 20 68 38" fill="none" stroke="#0f172a" strokeWidth="4" />
          <path d="M26 50 Q10 45 15 35" fill="none" stroke="#0369a1" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {symbolKey === 'biscuit' && (
        <g>
          <circle cx="50" cy="50" r="28" fill="#d97706" stroke="#b45309" strokeWidth="3" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i * Math.PI) / 4;
            return <circle key={i} cx={50 + Math.cos(angle) * 16} cy={50 + Math.sin(angle) * 16} r="2.5" fill="#78350f" />;
          })}
        </g>
      )}

      {symbolKey === 'milk' && (
        <g>
          <path d="M32 25 L36 78 L64 78 L68 25 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <path d="M34 45 Q50 50 66 45 L64 78 L36 78 Z" fill="#e2e8f0" />
        </g>
      )}

      {symbolKey === 'spoon' && (
        <g stroke="#64748b" strokeWidth="3" strokeLinecap="round">
          <ellipse cx="65" cy="32" rx="14" ry="10" fill="#e2e8f0" transform="rotate(-30 65 32)" />
          <line x1="55" y1="40" x2="25" y2="78" strokeWidth="5" />
        </g>
      )}

      {symbolKey === 'rice' && (
        <g>
          <path d="M24 50 Q50 82 76 50 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
          <ellipse cx="50" cy="48" rx="26" ry="12" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="50" cy="46" r="3" fill="#15803d" />
        </g>
      )}

      {symbolKey === 'key' && (
        <g stroke="#ca8a04" strokeWidth="4" strokeLinecap="round">
          <circle cx="36" cy="38" r="14" fill="none" strokeWidth="5" />
          <line x1="46" y1="48" x2="72" y2="74" strokeWidth="5" />
          <line x1="64" y1="66" x2="70" y2="60" strokeWidth="4" />
          <line x1="70" y1="72" x2="76" y2="66" strokeWidth="4" />
        </g>
      )}

      {symbolKey === 'radio' && (
        <g>
          <rect x="20" y="35" width="60" height="42" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <circle cx="38" cy="56" r="12" fill="#fef3c7" stroke="#451a03" strokeWidth="2" />
          <line x1="28" y1="20" x2="45" y2="35" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {symbolKey === 'umbrella' && (
        <g>
          <path d="M20 50 Q50 18 80 50 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <line x1="50" y1="22" x2="50" y2="75" stroke="#0f172a" strokeWidth="3" />
          <path d="M50 75 Q50 84 42 84" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {/* WILD FLOWERS */}
      {isFlower && (
        <g>
          <circle cx="50" cy="50" r="34" fill="#fdf2f8" stroke="#db2777" strokeWidth="3.5" />
          <text x="50" y="52" fontSize="36" textAnchor="middle" dominantBaseline="central">
            🌸
          </text>
        </g>
      )}

      {/* WILD SEASONS */}
      {isSeason && (
        <g>
          <circle cx="50" cy="50" r="34" fill="#eff6ff" stroke="#2563eb" strokeWidth="3.5" />
          <text x="50" y="52" fontSize="36" textAnchor="middle" dominantBaseline="central">
            🌤️
          </text>
        </g>
      )}

      {/* WINDS & DRAGONS FALLBACK IN NER THEME */}
      {suit === 'winds' && (
        <g>
          <circle cx="50" cy="50" r="32" fill="#f8fafc" stroke="#475569" strokeWidth="3" />
          <text x="50" y="52" fontSize="34" textAnchor="middle" dominantBaseline="central">
            🧭
          </text>
        </g>
      )}

      {suit === 'dragons' && (
        <g>
          <circle cx="50" cy="50" r="32" fill="#f8fafc" stroke="#475569" strokeWidth="3" />
          <text x="50" y="52" fontSize="34" textAnchor="middle" dominantBaseline="central">
            {symbolKey === 'dragon_red' ? '🏮' : symbolKey === 'dragon_green' ? '🐉' : '🪞'}
          </text>
        </g>
      )}
    </svg>
  );
};
