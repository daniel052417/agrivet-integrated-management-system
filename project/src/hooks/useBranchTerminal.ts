import { useState, useEffect } from 'react';
import { branchTerminalService, BranchTerminalData } from '../lib/branchTerminalService';
import { CustomUser } from '../lib/customAuth';

interface UseBranchTerminalReturn {
  branchTerminalData: BranchTerminalData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useBranchTerminal = (user: CustomUser | null): UseBranchTerminalReturn => {
  const [branchTerminalData, setBranchTerminalData] = useState<BranchTerminalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) {
      setBranchTerminalData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await branchTerminalService.getBranchTerminalData(
        user.id, 
        user.branch_id
      );

      setBranchTerminalData(data);
    } catch (err: any) {
      console.error('Error fetching branch/terminal data:', err);
      setError(err.message || 'Failed to load branch/terminal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, user?.branch_id]);

  return {
    branchTerminalData,
    loading,
    error,
    refresh: fetchData
  };
};
