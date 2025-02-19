
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Timer } from '@/components/Timer';
import { PubForm } from '@/components/PubForm';
import { History } from '@/components/History';
import { HomePage } from '@/components/HomePage';

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
  const [step, setStep] = useState<'home' | 'form' | 'timer' | 'history'>('home');
  const [pubData, setPubData] = useState<PubData | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleStartTimer = (pubData: { 
    name: string; 
    formatted_address: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  }) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
      <Card className="w-full max-w-md p-8 glass-container">
        {step === 'home' && (
          <HomePage
            showSearch={showSearch}
            onSearchToggle={setShowSearch}
            onStartTimer={handleStartTimer}
            onHistoryClick={() => setStep('history')}
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
