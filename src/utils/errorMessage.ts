// Type-only imports: erased at runtime, so node --test needs no alias resolution.
import type { AppError } from '@/shared/api/common.dto';
import type { Dict } from '@/shared/i18n/en';

/** User-facing text for an `AppError`, keyed by its `code`. Unknown codes get the generic text. */
export function errorMessage(err: AppError, errors: Dict['errors']): string {
  return (errors as Record<string, string>)[err.code] ?? errors.UNKNOWN;
}
