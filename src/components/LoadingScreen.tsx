
import { Card } from '@/components/ui/card';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">Loading...</div>
      </Card>
    </div>
  );
};
