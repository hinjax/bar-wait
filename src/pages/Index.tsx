
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/Timer';
import { PubForm } from '@/components/PubForm';
import { History } from '@/components/History';
import { Clock, History as HistoryIcon } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-100 via-violet-100 to-blue-200">
      <Card className="w-full max-w-md p-8 glass-container">
        {step === 'home' && (
          <div className="space-y-8 text-center">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Service Time Tracker
              </h1>
              <p className="text-muted-foreground text-sm">
                Monitor wait times and rate service at your favorite establishments
              </p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => setStep('form')}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                size="lg"
              >
                <Clock className="mr-2 h-5 w-5" />
                Start New Timer
              </Button>
              <Button
                onClick={() => setStep('history')}
                variant="outline"
                className="w-full h-12 border-2 hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 transition-all duration-300"
              >
                <HistoryIcon className="mr-2 h-4 w-4" />
                View History
              </Button>
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
