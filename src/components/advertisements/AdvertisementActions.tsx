'use client';

export default function AdvertisementActions() {
  const handleSync = async () => {
    try {
      const response = await fetch('/api/sync/advertisements', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(`Successfully synced ${result.count} advertisements!`);
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
      Sync Advertisements
    </button>
  );
}
