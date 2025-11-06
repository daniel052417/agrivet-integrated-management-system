import React, { useState, useEffect } from 'react';
import { settingsService } from '../../lib/settingsService';
import defaultLogo from '../../assets/logo.png';

interface CompanyLogoProps {
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  fallback?: string;
  showFallback?: boolean;
}

/**
 * Reusable CompanyLogo component that fetches and displays the company logo from settings.
 * Falls back to default logo if company logo is not set or fails to load.
 */
const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  alt = 'Company Logo',
  width,
  height,
  fallback = defaultLogo,
  showFallback = true
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        setIsLoading(true);
        const settings = await settingsService.getAllSettings();
        const companyLogo = settings.general?.companyLogo || settings.company_logo;
        
        if (companyLogo && typeof companyLogo === 'string') {
          setLogoUrl(companyLogo);
        } else {
          setLogoUrl(null);
        }
      } catch (err) {
        console.error('Error loading company logo:', err);
        setLogoUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogo();
  }, []);

  const handleImageError = () => {
    setError(true);
  };

  // Determine which logo to display
  const displayLogo = error || !logoUrl ? fallback : logoUrl;

  // Don't render anything if loading and no fallback
  if (isLoading && !showFallback) {
    return null;
  }

  // If no logo and fallback is disabled, return null
  if (!logoUrl && !showFallback && !error) {
    return null;
  }

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <img
      src={displayLogo}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
    />
  );
};

export default CompanyLogo;






