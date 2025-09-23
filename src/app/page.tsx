import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      <SignedIn>
        {redirect('/dashboard')}
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Broadstreet Campaigns
              </h1>
              <p className="text-gray-600">
                Internal Management Tool
              </p>
            </div>

            {/* Main Card */}
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-gray-900">
                  Access Required
                </CardTitle>
                <CardDescription>
                  This is an internal tool for managing Broadstreet advertising campaigns.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Need Access?
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Contact the administrator at{' '}
                        <a
                          href="mailto:leo@fashmedien.de"
                          className="font-medium underline hover:text-amber-800"
                        >
                          leo@fashmedien.de
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <SignInButton mode="modal">
                    <Button className="w-full" size="lg">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignInButton>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
              <p>© 2024 FASH Medien Verlag GmbH</p>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
