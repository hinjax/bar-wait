
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/Timer';
import { PubForm } from '@/components/PubForm';
import { History } from '@/components/History';
import { NearbyPlaces } from '@/components/NearbyPlaces';
import { AuthUI } from '@/components/AuthUI';
import { Clock, History as HistoryIcon, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      setStep('home');
    }
  };

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
            <div className="space-y-4">
              <Button
                onClick={() => session ? setStep('form') : setStep('auth')}
                className="w-full h-14 bg-black hover:bg-black/90 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                size="lg"
              >
                <Clock className="mr-2 h-5 w-5" />
                Start New Timer
              </Button>
              <Button
                onClick={() => session ? setStep('history') : setStep('auth')}
                variant="outline"
                className="w-full h-12 border-2 border-black text-black hover:bg-black/5 transition-all duration-300"
              >
                <HistoryIcon className="mr-2 h-4 w-4" />
                View History
              </Button>
              {session && (
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              )}
            </div>
            <div className="pt-4 border-t border-black/10">
              <NearbyPlaces />
            </div>
          </div>
        )}

        {step === 'form' && (
          <PubForm
            onSubmit={(data) => {
              setPubData(data);
              setStep('timer');
            }}
            onBack={() => setStep('home')}
          />
        )}

        {step === 'timer' && pubData && (
          <Timer
            pubData={pubData}
            onComplete={() => setStep('home')}
            onBack={() => setStep('form')}
          />
        )}

        {step === 'history' && (
          <History onBack={() => setStep('home')} />
        )}
      </Card>
    </div>
  );
};

export default Index;
