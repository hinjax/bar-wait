
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RecentEntry {
  pub_name: string;
  wait_time_seconds: number;
  rating: number;
  created_at: string;
}

export const RecentEntries = () => {
  const [entries, setEntries] = useState<RecentEntry[]>([]);

  useEffect(() => {
    const fetchRecentEntries = async () => {
      const { data, error } = await supabase
        .from('pub_visits')
        .select('pub_name, wait_time_seconds, rating, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setEntries(data);
      }
    };

    fetchRecentEntries();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Recent Service Times</h3>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg border border-black/10 bg-white/50 backdrop-blur-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{entry.pub_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(entry.wait_time_seconds)} wait time
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{entry.rating}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(entry.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
