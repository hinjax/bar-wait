
import { Button } from '@/components/ui/button';
import { History as HistoryIcon, LogOut, Search } from 'lucide-react';
import { NearbyPlaces } from './NearbyPlaces';
import { ServiceAnalytics } from './ServiceAnalytics';

interface HomePageProps {
  showSearch: boolean;
  session: any;
  onSearchToggle: (show: boolean) => void;
  onStartTimer: (pubData: {
    name: string;
    formatted_address: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  onHistoryClick: () => void;
  onLogout: () => void;
}

export const HomePage = ({
  showSearch,
  session,
  onSearchToggle,
  onStartTimer,
  onHistoryClick,
  onLogout
}: HomePageProps) => {
  return (
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
          <ServiceAnalytics onStartTimer={onStartTimer} />
          <Button
            variant="ghost"
            onClick={() => onSearchToggle(false)}
            className="w-full"
          >
            Cancel Search
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            onClick={() => onSearchToggle(true)}
            className="w-full h-12 border-2 border-black text-black hover:bg-black/5 transition-all duration-300"
            variant="outline"
          >
            <Search className="mr-2 h-4 w-4 text-black" />
            Search Places
          </Button>
          <Button
            onClick={onHistoryClick}
            variant="outline"
            className="w-full h-12 border-2 border-black text-black hover:bg-black/5 transition-all duration-300"
          >
            <HistoryIcon className="mr-2 h-4 w-4 text-black" />
            View History
          </Button>
          {session && (
            <Button
              onClick={onLogout}
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
          <NearbyPlaces onStartTimer={onStartTimer} />
        </div>
      )}
    </div>
  );
};
