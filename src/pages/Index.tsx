
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Timer } from '@/components/Timer';
import { PubForm } from '@/components/PubForm';
import { History } from '@/components/History';
import { AuthUI } from '@/components/AuthUI';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HomePage } from '@/components/HomePage';
import { LoadingScreen } from '@/components/LoadingScreen';

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
    setShowSearch(false);
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
    return <LoadingScreen />;
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
          <HomePage
            showSearch={showSearch}
            session={session}
            onSearchToggle={setShowSearch}
            onStartTimer={handleStartTimer}
            onHistoryClick={() => session ? setStep('history') : setStep('auth')}
            onLogout={handleLogout}
          />
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
          <History 
            onBack={() => {
              setStep('home');
              setShowSearch(false);
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Index;
