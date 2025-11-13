import { MapPin, Phone, Clock, Navigation, Loader2 } from 'lucide-react';
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
  const branchMapEmbedUrls: Record<string, string> = {
    'mohon': 'https://www.google.com/maps/embed?pb=!4v1763062440871!6m8!1m7!1s0D5DGq2FmHnGSbElrkUqVA!2m2!1d10.25065433356093!2d123.8340852489282!3f61.65461!4f0!5f0.7820865974627469',
    'san isidro': 'https://www.google.com/maps/embed?pb=!4v1763062462191!6m8!1m7!1su-8c79Npz9F9ZlmYz6Qv4A!2m2!1d10.25575864567557!2d123.839621346054!3f294.06165!4f0!5f0.7820865974627469',
    'poblacion': 'https://www.google.com/maps/embed?pb=!4v1763062393450!6m8!1m7!1stK2-Z9EFHZmSl-1kUxqoEg!2m2!1d10.243592137193!2d123.8475750357959!3f237.4895!4f0!5f0.7820865974627469',
  };

  // Helper function to get Google Maps embed URL for a branch
  const getMapEmbedUrl = (branchName: string, latitude: number | null, longitude: number | null): string => {
    // Normalize branch name for matching (lowercase, remove extra spaces)
    const normalizedName = branchName.toLowerCase().trim();
    
    // Try to find exact match or partial match
    for (const [key, url] of Object.entries(branchMapEmbedUrls)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return url;
      }
    }
    
    // Fallback: use coordinates if available
    if (latitude && longitude) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.5!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${latitude}%2C${longitude}!5e0!3m2!1sen!2sph!4v1234567890!5m2!1sen!2sph`;
    }
    
    // Final fallback: default to Mohon Branch
    return branchMapEmbedUrls['mohon'];
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
              const mapEmbedUrl = getMapEmbedUrl(branch.name, branch.latitude, branch.longitude);
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
              {/* Google Maps Embed */}
              <div className="aspect-video relative overflow-hidden">
                {(() => {
                  const selectedBranchData = branches[selectedBranch];
                  const fullAddress = `${selectedBranchData.address}, ${selectedBranchData.city}, ${selectedBranchData.province}${selectedBranchData.postal_code ? ` ${selectedBranchData.postal_code}` : ''}`;
                  const mapEmbedUrl = getMapEmbedUrl(selectedBranchData.name, selectedBranchData.latitude, selectedBranchData.longitude);
                  const mapDirectionsUrl = generateMapDirectionsUrl(selectedBranchData.latitude, selectedBranchData.longitude, fullAddress);
                  
                  return (
                    <>
                      <iframe
                        src={mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="absolute inset-0 w-full h-full"
                        title={`Map of ${selectedBranchData.name}`}
                      ></iframe>

                      {/* Map Info Bar */}
                      <div className="bg-gray-50 p-6 border-t border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Currently viewing</p>
                              <p className="text-lg font-bold text-gray-900">{selectedBranchData.name}</p>
                            </div>
                          </div>
                          
                          <a
                            href={mapDirectionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                          >
                            Open in Google Maps
                          </a>
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