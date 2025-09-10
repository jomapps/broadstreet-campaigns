'use client';

export default function ZoneActions() {
  const handleSync = async () => {
    try {
      const response = await fetch('/api/sync/zones', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(`Successfully synced ${result.count} zones!`);
        window.location.reload();
      } else {
        alert('Sync failed. Check console for details.');
      }
    } catch (error) {
      alert('Sync failed. Check console for details.');
      console.error('Sync error:', error);
    }
  };

  return (
    <button
      onClick={handleSync}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
    >
      Sync Zones
    </button>
  );
}
