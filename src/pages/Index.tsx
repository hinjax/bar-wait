
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/Timer';
import { PubForm } from '@/components/PubForm';
import { History } from '@/components/History';
import { NearbyPlaces } from '@/components/NearbyPlaces';
import { AuthUI } from '@/components/AuthUI';
import { History as HistoryIcon, LogOut, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ServiceAnalytics } from '@/components/ServiceAnalytics';

interface PubData {
  name: string;
  location: string;
  orderType: string;
  drinkDetails: string;
  formatted_address?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
}

const Index = () => {
  const [step, setStep] = useState<'home' | 'form' | 'timer' | 'history' | 'auth'>('home');
  const [pubData, setPubData] = useState<PubData | null>(null);
  const [session, setSession] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        setStep('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStartTimer = (pubData: { 
    name: string; 
    formatted_address: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!session) {
      toast.error('Please sign in to start a timer');
      setStep('auth');
      return;
    }

    setPubData({
      name: pubData.name,
      location: pubData.name,
      formatted_address: pubData.formatted_address,
      place_id: pubData.place_id,
      latitude: pubData.latitude,
      longitude: pubData.longitude,
      orderType: '',
      drinkDetails: ''
    });
    setStep('form');
    setShowSearch(false); // Reset search state when starting timer
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      setStep('auth');
    } catch (error: any) {
      toast.error(error.message || 'Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!session && step !== 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
        <Card className="w-full max-w-md p-8">
          <AuthUI onComplete={() => setStep('home')} />
        </Card>
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
        <Card className="w-full max-w-md p-8">
          <AuthUI onComplete={() => setStep('home')} />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
      <Card className="w-full max-w-md p-8 glass-container">
        {step === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-5xl font-bold tracking-tight text-black">
                Service Time Tracker
              </h1>
              <p className="text-muted-foreground text-sm">
                Monitor wait times and rate service at your favorite establishments
              </p>
            </div>

            {showSearch ? (
              <div className="space-y-4">
                <ServiceAnalytics 
                  onStartTimer={handleStartTimer}
                />
                <Button
                  variant="ghost"
                  onClick={() => setShowSearch(false)}
                  className="w-full"
                >
                  Cancel Search
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={() => setShowSearch(true)}
                  className="w-full h-12 border-2 border-black text-black hover:bg-black/5 transition-all duration-300"
                  variant="outline"
                >
                  <Search className="mr-2 h-4 w-4 text-black" />
                  Search Places
                </Button>
                <Button
                  onClick={() => session ? setStep('history') : setStep('auth')}
                  variant="outline"
                  className="w-full h-12 border-2 border-black text-black hover:bg-black/5 transition-all duration-300"
                >
                  <HistoryIcon className="mr-2 h-4 w-4 text-black" />
                  View History
                </Button>
                {session && (
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-black" />
                    Sign Out
                  </Button>
                )}
              </div>
            )}
            
            {!showSearch && (
              <div className="pt-4 border-t border-black/10">
                <NearbyPlaces onStartTimer={handleStartTimer} />
              </div>
            )}
          </div>
        )}

        {step === 'form' && (
          <PubForm
            initialData={pubData}
            onSubmit={(data) => {
              setPubData(data);
              setStep('timer');
            }}
            onBack={() => {
              setStep('home');
              setShowSearch(false);
            }}
          />
        )}

        {step === 'timer' && pubData && (
          <Timer
            pubData={pubData}
            onComplete={() => {
              setStep('home');
              setShowSearch(false);
            }}
            onBack={() => setStep('form')}
            autoStart={true}
          />
        )}

        {step === 'history' && (
          <History onBack={() => {
            setStep('home');
            setShowSearch(false);
          }} />
        )}
      </Card>
    </div>
  );
};

export default Index;
