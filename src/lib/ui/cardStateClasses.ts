export function cardStateClasses({ isLocal, isSelected }: { isLocal: boolean; isSelected: boolean }) {
  if (isLocal && isSelected) return 'border-blue-400 bg-blue-100 shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02]';
  if (isSelected) return 'border-blue-400 bg-blue-50 shadow-blue-200 hover:shadow-blue-300';
  if (isLocal) return 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02]';
  return 'border-gray-200 bg-white hover:shadow-gray-300';
}


