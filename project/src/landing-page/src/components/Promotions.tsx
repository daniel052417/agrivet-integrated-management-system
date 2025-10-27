import { Tag, TrendingUp, Gift, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnimatedSection from './AnimatedSection';

const Promotions = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const promotions = [
    {
      title: '🔥 October Mega Sale',
      subtitle: '10% Off All Feeds',
      description: 'Stock up on premium feeds and supplements. Limited time offer for all livestock and poultry feeds!',
      discount: '10% OFF',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      validUntil: 'Valid until Oct 31, 2025',
    },
    {
      title: '🐶 Pet Vaccination Drive',
      subtitle: 'This Weekend Only',
      description: 'Free consultation and special rates on pet vaccines. Bring your pets for a health check-up!',
      discount: 'FREE',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      validUntil: 'Oct 25-26, 2025',
    },
    {
      title: '🌾 Farm Starter Bundle',
      subtitle: 'Everything You Need',
      description: 'Complete farm starter package with feeds, supplements, and fertilizers at an unbeatable price.',
      discount: '25% OFF',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      validUntil: 'Limited Stocks',
    },
    {
      title: '💊 Veterinary Essentials',
      subtitle: 'Buy More, Save More',
      description: 'Buy 3 veterinary products and get the 4th item at 50% off. Build your medicine cabinet!',
      discount: 'BOGO 50%',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      validUntil: 'Valid until Nov 15, 2025',
    },
  ];

  const promotionCards = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Flash Deals',
      description: 'Limited time offers updated daily',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: 'Loyalty Rewards',
      description: 'Earn points with every purchase',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: <Tag className="w-6 h-6" />,
      title: 'Bundle Offers',
      description: 'Save more when you buy together',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promotions.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              {/* Slides Container */}
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {promotions.map((promo, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <div className={`bg-gradient-to-r ${promo.color} p-12 md:p-16`}>
                      <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                          {/* Left Content */}
                          <div className="text-white">
                            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                              {promo.validUntil}
                            </div>
                            <h3 className="text-4xl lg:text-5xl font-bold mb-4">{promo.title}</h3>
                            <p className="text-2xl font-semibold mb-4 text-white/90">{promo.subtitle}</p>
                            <p className="text-lg mb-6 text-white/80">{promo.description}</p>
                            <button className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                              <span>Shop Now</span>
                              <ArrowRight size={20} />
                            </button>
                          </div>

                          {/* Right Content - Discount Badge */}
                          <div className="flex items-center justify-center">
                            <div className="relative">
                              <div className="w-64 h-64 bg-white rounded-full flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform duration-300">
                                <div className="text-center">
                                  <p className="text-6xl font-bold text-gray-900 mb-2">{promo.discount}</p>
                                  <p className="text-lg font-semibold text-gray-600">Special Deal</p>
                                </div>
                              </div>
                              {/* Decorative circles */}
                              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/30 rounded-full"></div>
                              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/30 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg"
              >
                <ChevronLeft className="text-gray-900" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg"
              >
                <ChevronRight className="text-gray-900" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
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
            </div>
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
                <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
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

        {/* Newsletter Signup */}
        <AnimatedSection animation="fadeInUp" delay={0.7} duration={0.8}>
          <div className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Never Miss a Deal!</h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter and get exclusive promotions delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Promotions;