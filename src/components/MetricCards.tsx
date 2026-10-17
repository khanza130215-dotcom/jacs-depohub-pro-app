import React from 'react';
import { MetricCardData } from '../types';
import { useLanguage } from '../utils/i18n';
import { Droplets, Box, Users, DollarSign, Truck, Gauge } from 'lucide-react';

interface MetricCardsProps {
  cards: MetricCardData[];
  activeCardId: string;
  onSelectCard: (id: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  cards,
  activeCardId,
  onSelectCard,
}) => {
  const { t } = useLanguage();
  const getCardIcon = (id: string, colorType: string) => {
    switch (id) {
      case 'galon':
        return <Droplets className="w-3.5 h-3.5" strokeWidth={2} />;
      case 'dus':
        return <Box className="w-3.5 h-3.5" strokeWidth={2} />;
      case 'karyawan':
        return <Users className="w-3.5 h-3.5" strokeWidth={2} />;
      case 'omzet':
        return <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />;
      case 'bongkar':
        return <Truck className="w-3.5 h-3.5" strokeWidth={2} />;
      case 'pengiriman':
        return <Gauge className="w-3.5 h-3.5" strokeWidth={2} />;
      default:
        return <Droplets className="w-3.5 h-3.5" strokeWidth={2} />;
    }
  };

  const getCardStyles = (colorType: string, isActive: boolean) => {
    if (!isActive) {
      const getIdleConfig = () => {
        switch (colorType) {
          case 'indigo':
            return {
              accentBorder: 'border-t-4 border-t-indigo-500',
              hoverClass: 'metric-card-hover-indigo hover:border-indigo-600',
            };
          case 'cyan':
            return {
              accentBorder: 'border-t-4 border-t-cyan-500',
              hoverClass: 'metric-card-hover-cyan hover:border-cyan-500',
            };
          case 'emerald':
            return {
              accentBorder: 'border-t-4 border-t-emerald-500',
              hoverClass: 'metric-card-hover-emerald hover:border-emerald-500',
            };
          case 'amber':
            return {
              accentBorder: 'border-t-4 border-t-amber-500',
              hoverClass: 'metric-card-hover-amber hover:border-amber-500',
            };
          case 'violet':
            return {
              accentBorder: 'border-t-4 border-t-purple-500',
              hoverClass: 'metric-card-hover-purple hover:border-purple-500',
            };
          case 'rose':
            return {
              accentBorder: 'border-t-4 border-t-rose-500',
              hoverClass: 'metric-card-hover-rose hover:border-rose-500',
            };
          default:
            return {
              accentBorder: 'border-t-4 border-t-cyan-500',
              hoverClass: 'metric-card-hover-cyan hover:border-cyan-500',
            };
        }
      };

      const idle = getIdleConfig();

      return {
        containerClass:
          `bg-slate-900/80 [body.light-theme_&]:bg-white border-2 border-slate-700/80 [body.light-theme_&]:border-slate-300 ${idle.accentBorder} ${idle.hoverClass} hover:-translate-y-0.5 transition-all duration-200 hover:bg-slate-850 [body.light-theme_&]:hover:bg-slate-50 [body.light-theme_&]:shadow-[0_0_0_1px_rgba(148,163,184,0.4),0_4px_14px_-2px_rgba(15,23,42,0.12)]`,
        glowStyle: undefined as React.CSSProperties | undefined,
        iconBox:
          'bg-slate-800/60 text-slate-400 border-slate-700/60 [body.light-theme_&]:bg-slate-100 [body.light-theme_&]:text-slate-600 [body.light-theme_&]:border-slate-200',
        activeBadge: null,
      };
    }

    switch (colorType) {
      case 'indigo':
        return {
          containerClass:
            'bg-slate-900/95 [body.light-theme_&]:bg-indigo-50/70 border-[2.5px] border-indigo-600 border-t-4 border-t-indigo-500 [body.light-theme_&]:border-indigo-600 [body.light-theme_&]:border-t-indigo-600 neon-glow-indigo hover:-translate-y-0.5 card-selected',
          glowStyle: {
            boxShadow:
              '0 0 0 1px rgba(99, 102, 241, 0.6), 0 0 18px rgba(99, 102, 241, 0.4), 0 6px 16px -2px rgba(99, 102, 241, 0.25)',
          },
          iconBox:
            'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 [body.light-theme_&]:bg-indigo-100 [body.light-theme_&]:text-indigo-800 [body.light-theme_&]:border-indigo-400',
          activeBadge:
            'bg-indigo-500/25 text-indigo-300 border-indigo-500/50 [body.light-theme_&]:bg-indigo-100/90 [body.light-theme_&]:text-indigo-900 [body.light-theme_&]:border-indigo-400',
        };
      case 'cyan':
        return {
          containerClass:
            'bg-slate-900/95 [body.light-theme_&]:bg-sky-50/70 border-[2.5px] border-cyan-500 border-t-4 border-t-cyan-400 [body.light-theme_&]:border-cyan-500 [body.light-theme_&]:border-t-cyan-500 neon-glow-cyan hover:-translate-y-0.5 card-selected',
          glowStyle: {
            boxShadow:
              '0 0 0 1px rgba(6, 182, 212, 0.6), 0 0 18px rgba(6, 182, 212, 0.4), 0 6px 16px -2px rgba(6, 182, 212, 0.25)',
          },
          iconBox:
            'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-800 [body.light-theme_&]:border-cyan-400',
          activeBadge:
            'bg-cyan-500/25 text-cyan-300 border-cyan-500/50 [body.light-theme_&]:bg-sky-100/90 [body.light-theme_&]:text-sky-900 [body.light-theme_&]:border-cyan-400',
        };
      case 'emerald':
        return {
          containerClass:
            'bg-slate-900/95 [body.light-theme_&]:bg-emerald-50/70 border-[2.5px] border-emerald-500 border-t-4 border-t-emerald-400 [body.light-theme_&]:border-emerald-500 [body.light-theme_&]:border-t-emerald-500 neon-glow-emerald hover:-translate-y-0.5 card-selected',
          glowStyle: {
            boxShadow:
              '0 0 0 1px rgba(16, 185, 129, 0.6), 0 0 18px rgba(16, 185, 129, 0.4), 0 6px 16px -2px rgba(16, 185, 129, 0.25)',
          },
          iconBox:
            'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800 [body.light-theme_&]:border-emerald-400',
          activeBadge:
            'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 [body.light-theme_&]:bg-emerald-100/90 [body.light-theme_&]:text-emerald-900 [body.light-theme_&]:border-emerald-400',
        };
      case 'amber':
        return {
          containerClass:
            'bg-slate-900/95 [body.light-theme_&]:bg-amber-50/70 border-[2.5px] border-amber-500 border-t-4 border-t-amber-400 [body.light-theme_&]:border-amber-500 [body.light-theme_&]:border-t-amber-500 neon-glow-amber hover:-translate-y-0.5 card-selected',
          glowStyle: {
            boxShadow:
              '0 0 0 1px rgba(245, 158, 11, 0.6), 0 0 18px rgba(245, 158, 11, 0.4), 0 6px 16px -2px rgba(245, 158, 11, 0.25)',
          },
          iconBox:
            'bg-amber-500/20 text-amber-300 border-amber-500/50 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800 [body.light-theme_&]:border-amber-400',
          activeBadge:
            'bg-amber-500/25 text-amber-300 border-amber-500/50 [body.light-theme_&]:bg-amber-100/90 [body.light-theme_&]:text-amber-900 [body.light-theme_&]:border-amber-400',
        };
      case 'violet':
        return {
          containerClass:
            'bg-slate-900/95 [body.light-theme_&]:bg-purple-50/70 border-[2.5px] border-purple-500 border-t-4 border-t-purple-400 [body.light-theme_&]:border-purple-500 [body.light-theme_&]:border-t-purple-500 neon-glow-purple hover:-translate-y-0.5 card-selected',
          glowStyle: {
            boxShadow:
              '0 0 0 1px rgba(168, 85, 247, 0.6), 0 0 18px rgba(168, 85, 247, 0.4), 0 6px 16px -2px rgba(168, 85, 247, 0.25)',
          },
          iconBox:
            'bg-purple-500/20 text-purple-300 border-purple-500/50 [body.light-theme_&]:bg-purple-100 [body.light-theme_&]:text-purple-800 [body.light-theme_&]:border-purple-400',
          activeBadge:
            'bg-purple-500/25 text-purple-300 border-purple-500/50 [body.light-theme_&]:bg-purple-100/90 [body.light-theme_&]:text-purple-900 [body.light-theme_&]:border-purple-400',
        };
      case 'rose':
        return {
          containerClass:
            'bg-slate-900/95 [body.light-theme_&]:bg-rose-50/70 border-[2.5px] border-rose-500 border-t-4 border-t-rose-400 [body.light-theme_&]:border-rose-500 [body.light-theme_&]:border-t-rose-500 neon-glow-rose hover:-translate-y-0.5 card-selected',
          glowStyle: {
            boxShadow:
              '0 0 0 1px rgba(244, 63, 94, 0.6), 0 0 18px rgba(244, 63, 94, 0.4), 0 6px 16px -2px rgba(244, 63, 94, 0.25)',
          },
          iconBox:
            'bg-rose-500/20 text-rose-300 border-rose-500/50 [body.light-theme_&]:bg-rose-100 [body.light-theme_&]:text-rose-800 [body.light-theme_&]:border-rose-400',
          activeBadge:
            'bg-rose-500/25 text-rose-300 border-rose-500/50 [body.light-theme_&]:bg-rose-100/90 [body.light-theme_&]:text-rose-900 [body.light-theme_&]:border-rose-400',
        };
      default:
        return {
          containerClass:
            'bg-slate-900/95 [body.light-theme_&]:bg-sky-50/70 border-[2.5px] border-cyan-500 border-t-4 border-t-cyan-400 [body.light-theme_&]:border-cyan-500 [body.light-theme_&]:border-t-cyan-500 neon-glow-cyan hover:-translate-y-0.5 card-selected',
          glowStyle: {
            boxShadow:
              '0 0 0 1px rgba(6, 182, 212, 0.6), 0 0 18px rgba(6, 182, 212, 0.4), 0 6px 16px -2px rgba(6, 182, 212, 0.25)',
          },
          iconBox:
            'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-800 [body.light-theme_&]:border-cyan-400',
          activeBadge:
            'bg-cyan-500/25 text-cyan-300 border-cyan-500/50 [body.light-theme_&]:bg-sky-100/90 [body.light-theme_&]:text-sky-900 [body.light-theme_&]:border-cyan-400',
        };
    }
  };

  return (
    <div id="dashboard-metric-cards" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
      {cards.map((card) => {
        const isActive = activeCardId === card.id;
        const styles = getCardStyles(card.colorType, isActive);

        return (
          <div
            key={card.id}
            id={`metric-card-${card.id}`}
            onClick={() => onSelectCard(card.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectCard(card.id);
              }
            }}
            style={styles.glowStyle}
            className={`p-2.5 rounded-xl backdrop-blur-md cursor-pointer transition-all duration-200 select-none flex flex-col justify-between relative overflow-hidden min-h-[105px] ${styles.containerClass}`}
          >
            {/* Top Indicator / Title & Icon & Active Badge */}
            <div className="flex flex-wrap items-center justify-between gap-x-1.5 gap-y-1 mb-1">
              <span className="text-[9.5px] sm:text-[10px] font-black tracking-wider uppercase text-slate-800 dark:text-slate-400 [body.light-theme_&]:text-slate-900 whitespace-nowrap">
                {t(`card_${card.id}_title`, card.title)}
              </span>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                {isActive && styles.activeBadge && (
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border shadow-xs whitespace-nowrap ${styles.activeBadge}`}>
                    {t('card_selected', '● TERPILIH')}
                  </span>
                )}
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-all ${styles.iconBox}`}
                >
                  {getCardIcon(card.id, card.colorType)}
                </div>
              </div>
            </div>

            {/* Metric Value in Monospace - Solid Jet Black in Light Mode */}
            <div className="my-0.5">
              <div className="text-sm sm:text-base xl:text-[15px] 2xl:text-base font-mono font-black tracking-tight leading-none text-slate-900 dark:text-white [body.light-theme_&]:text-slate-950 truncate" title={card.value}>
                {card.value}
              </div>
            </div>

            {/* Subtitle / Operational Detail - High Contrast in Light Mode */}
            <div className="text-[9.5px] text-slate-700 dark:text-slate-300 [body.light-theme_&]:text-slate-800 font-semibold line-clamp-1 mt-0.5">
              {card.subtitle || t(`card_${card.id}_sub`)}
            </div>

            {/* Metric Footer / Trend Badge - Clear Border and Slate-900 in Light Mode */}
            <div className="mt-1.5 pt-1 border-t border-slate-800/80 [body.light-theme_&]:border-slate-200/80 flex items-center justify-between text-[9px]">
              <span
                className={`inline-flex items-center gap-1 font-mono text-[8.5px] px-1.5 py-0.5 rounded border truncate max-w-full ${
                  card.trendUp
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 [body.light-theme_&]:bg-emerald-50 [body.light-theme_&]:border-emerald-300 [body.light-theme_&]:text-emerald-950 [body.light-theme_&]:font-bold'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-400 [body.light-theme_&]:bg-amber-50 [body.light-theme_&]:border-amber-300 [body.light-theme_&]:text-amber-950 [body.light-theme_&]:font-bold'
                }`}
              >
                {card.trend || t(`card_${card.id}_trend`)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
