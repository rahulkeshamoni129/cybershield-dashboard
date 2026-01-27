import { geoAttackData } from '@/data/mockData';
import { Progress } from '@/components/ui/progress';
import { Globe } from 'lucide-react';

interface TopSourcesTableProps {
  data?: { country: string; attacks: number }[];
}

const TopSourcesTable = ({ data }: TopSourcesTableProps) => {
  const sourceData = data && data.length > 0 ? data : geoAttackData;
  const maxAttacks = Math.max(...sourceData.map(d => d.attacks), 1);

  return (
    <div className="soc-card">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Top Attack Sources</h3>
          <p className="text-sm text-muted-foreground">By country of origin</p>
        </div>
      </div>

      <div className="space-y-4">
        {sourceData.map((item, index) => (
          <div key={item.country} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono w-4">{index + 1}</span>
                <span className="font-medium">{item.country}</span>
              </div>
              <span className="font-mono text-primary">{item.attacks.toLocaleString()}</span>
            </div>
            <Progress
              value={(item.attacks / maxAttacks) * 100}
              className="h-1.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSourcesTable;
