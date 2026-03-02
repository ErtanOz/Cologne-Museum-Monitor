async function main(): Promise<void> {
  const baseUrl = process.env.MUSEUM_API_BASE_URL ?? 'http://localhost:8787';

  const health = await fetch(`${baseUrl}/api/health`);
  if (!health.ok) {
    throw new Error(`Health check failed: ${health.status}`);
  }

  const museums = await fetch(`${baseUrl}/api/museums`);
  if (!museums.ok) {
    throw new Error(`Museums endpoint failed: ${museums.status}`);
  }

  console.log('API is reachable.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
