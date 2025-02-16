
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/Timer';
import { PubForm } from '@/components/PubForm';
import { History } from '@/components/History';
import { Clock } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-neutral-100">
      <Card className="w-full max-w-md p-6 glass-container">
        {step === 'home' && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter">Pub Queue Logger</h1>
              <p className="text-muted-foreground">Track your wait times at local pubs</p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => setStep('form')}
                className="w-full glass-button"
                size="lg"
              >
                <Clock className="mr-2 h-4 w-4" />
                Start New Timer
              </Button>
              <Button
                onClick={() => setStep('history')}
                variant="outline"
                className="w-full"
              >
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
