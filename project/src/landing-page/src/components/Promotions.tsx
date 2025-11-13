import { Tag, TrendingUp, Gift, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnimatedSection from './AnimatedSection';
import { supabase, Promotion } from '../lib/supabaseClient';

const Promotions = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch promotions from database
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];

        const { data, error: fetchError } = await supabase
          .from('promotions')
          .select('*')
          .eq('show_on_landing_page', true)
          .eq('is_active', true)
          .lte('start_date', today)
          .gte('end_date', today)
          .in('status', ['active', 'upcoming'])
          .order('pin_to_top', { ascending: false })
          .order('display_priority', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;

        setPromotions(data || []);
      } catch (err: any) {
        console.error('Error fetching promotions:', err);
        setError('Failed to load promotions');
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (end < today) {
      return 'Expired';
    }
    
    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (startFormatted === endFormatted) {
      return `Valid until ${endFormatted}`;
    }
    
    return `Valid until ${endFormatted}`;
  };

  // Helper function to get gradient color based on promotion type
  const getGradientColor = (promotionType: string, index: number): string => {
    const colors = [
      'from-orange-500 to-red-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-purple-500 to-pink-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-500',
    ];
    
    if (promotionType === 'new_item') return 'from-green-500 to-emerald-500';
    if (promotionType === 'restock') return 'from-blue-500 to-cyan-500';
    if (promotionType === 'event') return 'from-purple-500 to-pink-500';
    
    return colors[index % colors.length];
  };

  // Helper function to extract discount info from description or title
  const extractDiscount = (promotion: Promotion): string => {
    // Try to extract from button_text or title
    if (promotion.button_text) {
      return promotion.button_text;
    }
    
    // Try to extract percentage or discount from title/description
    const titleMatch = promotion.title.match(/(\d+)%|(\d+)\s*off/i);
    if (titleMatch) {
      return titleMatch[0].toUpperCase();
    }
    
    const descMatch = promotion.description.match(/(\d+)%|(\d+)\s*off|free|bogo/i);
    if (descMatch) {
      return descMatch[0].toUpperCase();
    }
    
    return 'SPECIAL';
  };

  const promotionCards = [
    {
      icon: '🆕',
      title: 'New Arrivals',
      description: 'Be the first to check out our latest products and collections.',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: '♻️',
      title: 'Back in Stock',
      description: 'Your favorites are here again — don\'t miss out this time.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: '🔔',
      title: 'Upcoming Restocks',
      description: 'Get notified when popular items return.',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const nextSlide = () => {
    if (promotions.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % promotions.length);
    }
  };

  const prevSlide = () => {
    if (promotions.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + promotions.length) % promotions.length);
    }
  };

  // Auto-advance slideshow when there are multiple promotions
  useEffect(() => {
    if (promotions.length <= 1) return;
    
    // Get autoplay settings from current promotion, or use defaults
    const currentPromo = promotions[currentSlide];
    const autoplay = currentPromo?.slideshow_autoplay ?? true; // Default to true
    const speed = currentPromo?.slideshow_speed ?? 5000; // Default to 5 seconds
    
    // Auto-advance if autoplay is enabled (or default true)
    if (autoplay) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % promotions.length);
      }, speed);
      return () => clearInterval(timer);
    }
  }, [promotions, currentSlide]);

  return (
    <section id="promotions" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection animation="fadeInUp" duration={0.6}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
              <Tag className="w-4 h-4 mr-2" />
              Special Offers
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Latest{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Promotions
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't miss out on our exclusive deals and limited-time offers
            </p>
          </div>
        </AnimatedSection>

        {/* Main Carousel */}
        <AnimatedSection animation="zoomIn" delay={0.2} duration={0.8}>
          <div className="relative mb-12">
            {loading ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
                <p className="text-gray-600">{error}</p>
              </div>
            ) : promotions.length === 0 ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
                <p className="text-gray-600">No promotions available at this time</p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                {/* Slides Container */}
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {promotions.map((promo, index) => {
                    const gradientColor = getGradientColor(promo.promotion_type, index);
                    const discountText = extractDiscount(promo);
                    const validUntil = formatDateRange(promo.start_date, promo.end_date);
                    const imageUrl = promo.image_urls && promo.image_urls.length > 0 
                      ? promo.image_urls[0] 
                      : promo.image_url;
                    
                    return (
                      <div key={promo.id} className="w-full flex-shrink-0">
                        <div className={`bg-gradient-to-r ${gradientColor} p-12 md:p-16 relative overflow-hidden`}>
                          {/* Background Image Overlay */}
                          {imageUrl && (
                            <div 
                              className="absolute inset-0 opacity-20 bg-cover bg-center"
                              style={{ backgroundImage: `url(${imageUrl})` }}
                            />
                          )}
                          <div className="max-w-4xl mx-auto relative z-10">
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                              {/* Left Content */}
                              <div className="text-white">
                                <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                                  {validUntil}
                                </div>
                                <h3 className="text-4xl lg:text-5xl font-bold mb-4">{promo.title}</h3>
                                {promo.button_text && (
                                  <p className="text-2xl font-semibold mb-4 text-white/90">{promo.button_text}</p>
                                )}
                                <p className="text-lg mb-6 text-white/80">{promo.description}</p>
                                <a 
                                  href={promo.button_link || 'https://tiongsononline.vercel.app/branch-selection'}
                                  target={promo.button_link ? '_blank' : undefined}
                                  rel={promo.button_link ? 'noopener noreferrer' : undefined}
                                  className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                  <span>{promo.button_text || 'Shop Now'}</span>
                                  <ArrowRight size={20} />
                                </a>
                              </div>

                              {/* Right Content - Discount Badge or Image */}
                              <div className="flex items-center justify-center">
                                {imageUrl ? (
                                  <div className="relative">
                                    <img 
                                      src={imageUrl} 
                                      alt={promo.title}
                                      className="w-64 h-64 object-cover rounded-full shadow-2xl transform hover:rotate-12 transition-transform duration-300"
                                    />
                                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/30 rounded-full"></div>
                                    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/30 rounded-full"></div>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <div className="w-64 h-64 bg-white rounded-full flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform duration-300">
                                      <div className="text-center">
                                        <p className="text-6xl font-bold text-gray-900 mb-2">{discountText}</p>
                                        <p className="text-lg font-semibold text-gray-600">Special Deal</p>
                                      </div>
                                    </div>
                                    {/* Decorative circles */}
                                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/30 rounded-full"></div>
                                    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/30 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                {promotions.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg z-20"
                    >
                      <ChevronLeft className="text-gray-900" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg z-20"
                    >
                      <ChevronRight className="text-gray-900" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                      {promotions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            currentSlide === index ? 'bg-white w-8' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Promotion Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotionCards.map((card, index) => (
            <AnimatedSection
              key={index}
              animation="slideUp"
              delay={0.4 + (0.1 * index)}
              duration={0.6}
            >
              <div className="group bg-white rounded-xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-2">
                <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 text-2xl`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600 mb-4">{card.description}</p>
                <button className="text-green-600 font-medium flex items-center space-x-1 group-hover:translate-x-2 transition-transform duration-300">
                  <span>Learn more</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Promotions;