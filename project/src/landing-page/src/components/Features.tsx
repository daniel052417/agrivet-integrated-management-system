import { ShoppingCart, BarChart3, Bell, TrendingUp, Smartphone, Zap } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const features = [
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: 'Online Ordering',
      description: 'Browse and purchase products directly from your phone or computer. Easy checkout and secure payment.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Real-Time Inventory',
      description: 'Track product availability and stock levels instantly. Never miss out on your essential supplies.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Notifications & Promotions',
      description: 'Get instant updates on new products, special offers, and exclusive deals delivered to your device.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Business Analytics',
      description: 'Monitor sales trends, customer insights, and performance metrics for informed decision-making.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content - Features */}
          <AnimatedSection animation="slideLeft" duration={0.8}>
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4 mr-2" />
                Progressive Web App
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Manage and Order{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                  Smarter
                </span>{' '}
                with Our PWA
              </h2>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Our Progressive Web App lets you order supplies, monitor sales, and track promotions 
                directly from your phone or computer. Experience the future of Agrivet management.
              </p>

              {/* Features List */}
              <div className="space-y-6 mb-8">
                {features.map((feature, index) => (
                  <AnimatedSection
                    key={index}
                    animation="slideLeft"
                    delay={0.1 * index}
                    duration={0.7}
                  >
                    <div className="group flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>

              <button className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <span onClick={() => window.location.href = 'http://localhost:3001/branch-selection'} className="font-semibold">Access PWA Now</span>
                <Zap size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              </button>
            </div>
          </AnimatedSection>

          {/* Right Content - Visual Representation */}
          <AnimatedSection animation="slideRight" delay={0.3} duration={0.8}>
            <div className="relative">
              {/* Phone Mockup */}
              <div className="relative mx-auto w-64 lg:w-80">
                {/* Phone Frame */}
                <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    {/* Status Bar */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 flex justify-between items-center">
                      <span className="text-white text-xs font-medium">9:41 AM</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">AgriVet</h4>
                          <p className="text-xs text-gray-600">Dashboard</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3">
                          <p className="text-xs text-gray-600 mb-1">Orders</p>
                          <p className="text-xl font-bold text-gray-900">124</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
                          <p className="text-xs text-gray-600 mb-1">Products</p>
                          <p className="text-xl font-bold text-gray-900">500+</p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-2">
                        <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                            <ShoppingCart size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">New Order</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                            <BarChart3 size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Analytics</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-8 -right-8 bg-white rounded-xl shadow-xl p-4 animate-float">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📱</div>
                    <p className="text-xs font-bold text-gray-900">iOS & Android</p>
                  </div>
                </div>

                <div className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-xl p-4 animate-float animation-delay-2000">
                  <div className="text-center">
                    <div className="text-2xl mb-1">⚡</div>
                    <p className="text-xs font-bold text-gray-900">Lightning Fast</p>
                  </div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl -z-10 transform rotate-6 scale-95 opacity-20"></div>
            </div>
          </AnimatedSection>
        </div>

        {/* Bottom CTA Banner */}
        <AnimatedSection animation="fadeInUp" delay={0.7} duration={0.8}>
          <div className="mt-20 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Download our PWA today and experience seamless Agrivet management at your fingertips
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                Install PWA
              </button>
              <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                View Demo
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Features;