import { MapPin, Phone, Clock, Navigation, Loader2, Map, Eye, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import SanIsidro from '../assets/SanIsidro.jpg';
import Poblacion from '../assets/Poblacion.jpg';
import Lawaan from '../assets/MainBranch.jpg';
import AnimatedSection from './AnimatedSection';
import { supabase, Branch } from '../lib/supabaseClient';

const Branches = () => {
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'map' | 'street'>('street'); // 'map' for map view, 'street' for street view
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Fallback images
  const fallbackImages = [Lawaan, SanIsidro, Poblacion];
  const gradientColors = [
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-purple-500',
  ];

  // Fetch branches from database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('branches')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        setBranches(data || []);
      } catch (err: any) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches');
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Helper function to format operating hours
  const formatOperatingHours = (operatingHours: any): string => {
    if (!operatingHours) {
      return 'Mon-Sat: 7:00 AM - 6:00 PM';
    }

    if (typeof operatingHours === 'string') {
      try {
        operatingHours = JSON.parse(operatingHours);
      } catch {
        return operatingHours;
      }
    }

    if (operatingHours && typeof operatingHours === 'object') {
      // Try to extract a readable format
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const hours = days.map(day => {
        const dayHours = operatingHours[day.toLowerCase()];
        if (dayHours && dayHours.open && dayHours.close) {
          return `${day}: ${dayHours.open} - ${dayHours.close}`;
        }
        return null;
      }).filter(Boolean);

      if (hours.length > 0) {
        return hours.join(', ');
      }
    }

    return 'Mon-Sat: 7:00 AM - 6:00 PM';
  };

  // Branch-specific Google Maps embed URLs
  const branchMapUrls: Record<string, { street: string; map: string }> = {
    'mohon': {
      street: 'https://www.google.com/maps/embed?pb=!4v1763605453149!6m8!1m7!1s0D5DGq2FmHnGSbElrkUqVA!2m2!1d10.25065433356093!2d123.8340852489282!3f26.85369128213887!4f-4.329887757206507!5f0.7820865974627469',
      map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.135495210314!2d123.8340852489282!3d10.25065433356093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a99d9a62e30699%3A0xcf6125ca3eda639b!2sTiongson%20Agrivet!5e0!3m2!1sen!2sph!4v1763605466483!5m2!1sen!2sph'
    },
    'san isidro': {
      street: 'https://www.google.com/maps/embed?pb=!4v1763605379302!6m8!1m7!1su-8c79Npz9F9ZlmYz6Qv4A!2m2!1d10.25575864567557!2d123.839621346054!3f294.06165!4f0!5f0.7820865974627469',
      map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.072227176911!2d123.839621346054!3d10.25575864567557!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a99df4e5c0f6f7%3A0x7cf680cf4a4ea0d6!2sTiongson%20Pet%20Store%20and%20General%20Merchandise!5e0!3m2!1sen!2sph!4v1763605422124!5m2!1sen!2sph'
    },
    'poblacion': {
      street: 'https://www.google.com/maps/embed?pb=!4v1763605335220!6m8!1m7!1stK2-Z9EFHZmSl-1kUxqoEg!2m2!1d10.243592137193!2d123.8475750357959!3f237.4895!4f0!5f0.7820865974627469',
      map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.222979871238!2d123.8475750357959!3d10.243592137193!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a99d001be0ca47%3A0xb7f2313a0cafe191!2sTiongson%20Rice%20%26%20Agrivet%20Supply!5e0!3m2!1sen!2sph!4v1763605351612!5m2!1sen!2sph'
    },
  };

  // Helper function to get Google Maps embed URL for a branch
  const getMapEmbedUrl = (branchName: string, latitude: number | null, longitude: number | null, viewMode: 'map' | 'street'): string => {
    // Normalize branch name for matching (lowercase, remove extra spaces)
    const normalizedName = branchName.toLowerCase().trim();
    
    // Try to find exact match or partial match
    for (const [key, urls] of Object.entries(branchMapUrls)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return viewMode === 'street' ? urls.street : urls.map;
      }
    }
    
    // Fallback: use coordinates to generate map embed if available
    if (latitude && longitude) {
      if (viewMode === 'map') {
        // Map view with pin - using Google Maps embed API format
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.5!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${latitude}%2C${longitude}!5e0!3m2!1sen!2sph!4v${Date.now()}!5m2!1sen!2sph`;
      } else {
        // Street view fallback - use coordinates
        return `https://www.google.com/maps/embed?pb=!4v${Date.now()}!6m8!1m7!1s0x0%3A0x0!2m2!1d${latitude}!2d${longitude}!3f0!4f0!5f0.7820865974627469`;
      }
    }
    
    // Final fallback: default to Mohon Branch
    return viewMode === 'street' ? branchMapUrls['mohon'].street : branchMapUrls['mohon'].map;
  };

  // Helper function to generate Google Maps link URL (for copying)
  const generateMapLinkUrl = (branchName: string, latitude: number | null, longitude: number | null, address: string): string => {
    // Normalize branch name for matching
    const normalizedName = branchName.toLowerCase().trim();
    
    // Try to match branch name to get the place ID or use coordinates
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    
    // Fallback to search by address
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  // Function to copy link to clipboard
  const copyLinkToClipboard = async (link: string, branchName: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(branchName);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Helper function to generate Google Maps directions URL
  const generateMapDirectionsUrl = (latitude: number | null, longitude: number | null, address: string): string => {
    if (!latitude || !longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  return (
    <section id="branches" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection animation="fadeInUp" duration={0.6}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              Find Us
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                Branch Locations
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Visit any of our branches across Talisay City for quality products and expert service
            </p>
          </div>
        </AnimatedSection>

        {/* Branches Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-96 mb-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 mb-12">
            <p className="text-gray-600">{error}</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex items-center justify-center h-96 mb-12">
            <p className="text-gray-600">No branches available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {branches.map((branch, index) => {
              const fullAddress = `${branch.address}, ${branch.city}, ${branch.province}${branch.postal_code ? ` ${branch.postal_code}` : ''}`;
              const hours = formatOperatingHours(branch.operating_hours);
              const imageUrl = null; // You can add image_url field to branches table later
              const fallbackImage = fallbackImages[index % fallbackImages.length];
              const gradientColor = gradientColors[index % gradientColors.length];
              const mapDirectionsUrl = generateMapDirectionsUrl(branch.latitude, branch.longitude, fullAddress);

              return (
                <AnimatedSection
                  key={branch.id}
                  animation="slideUp"
                  delay={0.1 * index}
                  duration={0.7}
                >
                  <div
                    onClick={() => setSelectedBranch(index)}
                    className={`group cursor-pointer transform transition-all duration-300 ${
                      selectedBranch === index ? 'scale-105' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full ${
                        selectedBranch === index ? 'ring-4 ring-green-500' : ''
                      }`}
                    >
                      {/* Branch Header with Image Background */}
                      <div className="relative h-48 overflow-hidden">
                        {/* Background Image */}
                        <img
                          src={imageUrl || fallbackImage}
                          alt={branch.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = fallbackImage;
                          }}
                        />
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t ${gradientColor} opacity-80`}></div>
                        {/* Branch Name */}
                        <div className="absolute inset-0 flex items-end justify-center p-6">
                          <h3 className="text-2xl font-bold text-white text-center drop-shadow-lg">
                            {branch.name}
                          </h3>
                        </div>
                      </div>

                      {/* Branch Info */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                          <p className="text-gray-700">{fullAddress}</p>
                        </div>

                        {branch.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <a href={`tel:${branch.phone}`} className="text-gray-700 hover:text-green-600 transition-colors">
                              {branch.phone}
                            </a>
                          </div>
                        )}

                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <p className="text-gray-700">{hours}</p>
                        </div>

                        <a
                          href={mapDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-300 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation size={18} />
                          <span>Get Directions</span>
                        </a>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const mapLink = generateMapLinkUrl(branch.name, branch.latitude, branch.longitude, fullAddress);
                            copyLinkToClipboard(mapLink, branch.name);
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-300 font-medium"
                        >
                          {copiedLink === branch.name ? (
                            <>
                              <Check size={18} className="text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={18} />
                              <span>Copy Link Address</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}

        {/* Interactive Map Section */}
        {branches.length > 0 && (
          <AnimatedSection animation="zoomIn" delay={0.5} duration={0.8}>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Map View Toggle */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Currently viewing</p>
                      <p className="text-lg font-bold text-gray-900">{branches[selectedBranch].name}</p>
                    </div>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-3 bg-white rounded-lg p-1 shadow-sm">
                    <button
                      onClick={() => setMapViewMode('street')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                        mapViewMode === 'street'
                          ? 'bg-green-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Eye size={18} />
                      <span className="text-sm font-medium">Street View</span>
                    </button>
                    <button
                      onClick={() => setMapViewMode('map')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                        mapViewMode === 'map'
                          ? 'bg-green-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Map size={18} />
                      <span className="text-sm font-medium">Map View</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Google Maps Embed */}
              <div className="aspect-video relative overflow-hidden">
                {(() => {
                  const selectedBranchData = branches[selectedBranch];
                  const fullAddress = `${selectedBranchData.address}, ${selectedBranchData.city}, ${selectedBranchData.province}${selectedBranchData.postal_code ? ` ${selectedBranchData.postal_code}` : ''}`;
                  const mapEmbedUrl = getMapEmbedUrl(selectedBranchData.name, selectedBranchData.latitude, selectedBranchData.longitude, mapViewMode);
                  const mapDirectionsUrl = generateMapDirectionsUrl(selectedBranchData.latitude, selectedBranchData.longitude, fullAddress);
                  const mapLinkUrl = generateMapLinkUrl(selectedBranchData.name, selectedBranchData.latitude, selectedBranchData.longitude, fullAddress);
                  
                  return (
                    <>
                      <iframe
                        key={`${selectedBranch}-${mapViewMode}`}
                        src={mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="absolute inset-0 w-full h-full"
                        title={`${mapViewMode === 'map' ? 'Map' : 'Street View'} of ${selectedBranchData.name}`}
                      ></iframe>

                      {/* Map Info Bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
                          <div className="text-white">
                            <p className="text-sm opacity-90">{fullAddress}</p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => copyLinkToClipboard(mapLinkUrl, selectedBranchData.name)}
                              className="px-4 py-2 bg-white/90 text-gray-700 rounded-lg font-medium hover:bg-white transition-all duration-200 flex items-center space-x-2"
                            >
                              {copiedLink === selectedBranchData.name ? (
                                <>
                                  <Check size={16} className="text-green-600" />
                                  <span className="text-green-600">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={16} />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                            <a
                              href={mapDirectionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                            >
                              <Navigation size={18} />
                              <span>Get Directions</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Service Hours Banner */}
        <AnimatedSection animation="fadeInUp" delay={0.7} duration={0.8}>
          <div className="mt-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">We're Here When You Need Us</h3>
            <p className="text-lg text-white/90">
              Open Monday to Saturday, 7:00 AM - 6:00 PM across all branches
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Branches;