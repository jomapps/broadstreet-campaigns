import Link from 'next/link';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Networks', href: '/networks' },
  { name: 'Advertisers', href: '/advertisers' },
  { name: 'Advertisements', href: '/advertisements' },
  { name: 'Zones', href: '/zones' },
  { name: 'Campaigns', href: '/campaigns' },
];

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Broadstreet Publishing Dashboard'}
            </h1>
            
            <nav className="hidden md:flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Broadstreet API Connected
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
