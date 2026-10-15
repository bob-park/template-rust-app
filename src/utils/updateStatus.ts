// Type-only imports: erased at runtime, so node --test needs no alias resolution.
import type { UpdateStatus } from '@/domain/updater/apis/updater.dto';
import type { Dict } from '@/shared/i18n/en';

type Strings = Pick<Dict['updates'], 'idle' | 'checking' | 'upToDate' | 'ready' | 'failed'>;

export function describeUpdateStatus(status: UpdateStatus, s: Strings): string {
  switch (status.status) {
    case 'idle':
      return s.idle;
    case 'checking':
      return s.checking;
    case 'upToDate':
      return s.upToDate;
    case 'ready':
      return s.ready(status.version);
    case 'failed':
      return s.failed;
  }
}
