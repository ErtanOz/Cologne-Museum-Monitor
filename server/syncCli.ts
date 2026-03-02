import { RefreshReason } from '../types';
import { syncService } from './syncService';

const readArg = (name: string): string | null => {
  const token = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!token) {
    return null;
  }

  return token.split('=').slice(1).join('=');
};

const parseReason = (): RefreshReason => {
  const value = readArg('reason');

  if (value === 'manual' || value === 'page_load' || value === 'daily') {
    return value;
  }

  return 'daily';
};

const parseForce = (): boolean => {
  const value = readArg('force');
  if (!value) {
    return true;
  }

  return value === '1' || value.toLowerCase() === 'true';
};

async function main(): Promise<void> {
  const reason = parseReason();
  const force = parseForce();

  const result = await syncService.refresh({ reason, force });

  console.log(
    JSON.stringify(
      {
        ok: true,
        reason,
        force,
        syncedMuseums: result.data.length,
        lastSyncAt: result.diagnostics.lastSyncAt,
        partial: result.diagnostics.partial,
        warnings: result.diagnostics.warnings,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
