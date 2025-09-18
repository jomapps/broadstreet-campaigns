export function getCounts(result: any) {
  return {
    cleanup: Number(result?.results?.cleanup?.count) || 0,
    networks: Number(result?.results?.networks?.count) || 0,
    advertisers: Number(result?.results?.advertisers?.count) || 0,
    zones: Number(result?.results?.zones?.count) || 0,
    campaigns: Number(result?.results?.campaigns?.count) || 0,
    advertisements: Number(result?.results?.advertisements?.count) || 0,
    placements: Number(result?.results?.placements?.count) || 0,
  };
}



