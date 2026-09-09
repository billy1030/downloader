export type ThemeMode = 'day' | 'night' | 'warm';

export interface ThemeColors {
  bg: string;
  bgSubtle: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  headerBg: string;
  headerBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  inputFocusRing: string;
  brandBtn: string;
  brandBtnHover: string;
  brandGlow: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  modalBg: string;
  drawerBg: string;
  accent: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  day: {
    bg: 'bg-[#f8fafc]',
    bgSubtle: 'bg-[#f1f5f9]',
    card: 'bg-white',
    cardBorder: 'border-slate-200/90',
    cardHover: 'hover:border-slate-300 shadow-sm hover:shadow-md',
    headerBg: 'bg-white/95',
    headerBorder: 'border-slate-200',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    inputBg: 'bg-slate-50',
    inputBorder: 'border-slate-300',
    inputFocusRing: 'focus:border-indigo-600 focus:ring-indigo-500/20',
    brandBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25',
    brandBtnHover: 'hover:bg-indigo-700',
    brandGlow: 'bg-indigo-500/10',
    pillBg: 'bg-slate-100',
    pillBorder: 'border-slate-200',
    pillText: 'text-slate-600',
    modalBg: 'bg-white border-slate-200 text-slate-900',
    drawerBg: 'bg-white border-slate-200 text-slate-900',
    accent: 'text-indigo-600',
  },
  night: {
    bg: 'bg-[#07090e]',
    bgSubtle: 'bg-[#0c1017]',
    card: 'bg-[#0c1017]',
    cardBorder: 'border-slate-800/80',
    cardHover: 'hover:border-slate-700',
    headerBg: 'bg-[#0c1017]/95',
    headerBorder: 'border-slate-800/80',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    inputBg: 'bg-slate-900/90',
    inputBorder: 'border-slate-800',
    inputFocusRing: 'focus:border-indigo-500 focus:ring-indigo-500/20',
    brandBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
    brandBtnHover: 'hover:bg-indigo-500',
    brandGlow: 'bg-indigo-600/10',
    pillBg: 'bg-slate-800/60',
    pillBorder: 'border-slate-800',
    pillText: 'text-slate-400',
    modalBg: 'bg-[#0c1017] border-slate-800 text-slate-100',
    drawerBg: 'bg-[#0c1017] border-slate-800 text-slate-100',
    accent: 'text-indigo-400',
  },
  warm: {
    bg: 'bg-[#faf6f0]',
    bgSubtle: 'bg-[#f4ede4]',
    card: 'bg-[#fffdfa]',
    cardBorder: 'border-[#e8decb]',
    cardHover: 'hover:border-[#d9cbb2] shadow-sm hover:shadow-md',
    headerBg: 'bg-[#fffdfa]/95',
    headerBorder: 'border-[#e8decb]',
    textPrimary: 'text-[#2e261f]',
    textSecondary: 'text-[#695d52]',
    textMuted: 'text-[#9c8e82]',
    inputBg: 'bg-[#fdfaf5]',
    inputBorder: 'border-[#ded4c1]',
    inputFocusRing: 'focus:border-[#d97706] focus:ring-amber-500/20',
    brandBtn: 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-amber-600/25',
    brandBtnHover: 'hover:bg-[#b45309]',
    brandGlow: 'bg-amber-500/10',
    pillBg: 'bg-[#ede5d8]',
    pillBorder: 'border-[#ded4c1]',
    pillText: 'text-[#695d52]',
    modalBg: 'bg-[#fffdfa] border-[#e8decb] text-[#2e261f]',
    drawerBg: 'bg-[#fffdfa] border-[#e8decb] text-[#2e261f]',
    accent: 'text-[#d97706]',
  }
};
