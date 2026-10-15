import type { Dict } from '@/shared/i18n/en';

export const ko: Dict = {
  settings: {
    title: '설정',
    tabs: { general: '일반', updates: '업데이트' },
    theme: '테마',
    language: '언어',
    launchAtLogin: '로그인 시 자동 실행',
    system: '시스템',
    light: '라이트',
    dark: '다크',
  },
  updates: {
    title: '업데이트',
    version: (v: string) => `버전 ${v}`,
    check: '업데이트 확인',
    restart: '업데이트 후 재시작',
    auto: '자동으로 업데이트 확인',
    idle: '아직 확인하지 않음',
    checking: '확인 중…',
    upToDate: '최신 버전',
    ready: (v: string) => `버전 ${v} 준비됨`,
    failed: '업데이트 확인 실패',
  },
};
