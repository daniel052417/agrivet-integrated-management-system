import { ShoppingBag, Stethoscope, Sprout, Heart, ArrowRight } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const Products = () => {
  const productCategories = [
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: 'Feeds & Supplements',
      description: 'Premium quality feeds for livestock, poultry, and pets. Nutritional supplements for optimal growth.',
      image: '🌾',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
      items: '150+ Products',
    },
    {
      icon: <Stethoscope className="w-8 h-8" />,
      title: 'Veterinary Supplies',
      description: 'Complete range of veterinary medicines, vaccines, and medical equipment for animal care.',
      image: '💊',
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50',
      items: '200+ Products',
    },
    {
      icon: <Sprout className="w-8 h-8" />,
      title: 'Pesticides & Fertilizers',
      description: 'Effective crop protection and soil enrichment solutions for better harvests.',
      image: '🌱',
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      items: '100+ Products',
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Pet Care Products',
      description: 'Everything your pets need - from food and toys to grooming supplies and accessories.',
      image: '🐾',
      color: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-50',
      items: '80+ Products',
    },
  ];

  const trustBadges = [
    { icon: '✓', text: 'Quality Assured' },
    { icon: '🚚', text: 'Fast Delivery' },
    { icon: '💯', text: 'Best Prices' },
    { icon: '🤝', text: 'Expert Support' },
  ];

  return (
    <section id="products" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection animation="fadeInUp" duration={0.6}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              Our Products
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Featured{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                Categories
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse our comprehensive selection of agricultural and veterinary products
            </p>
          </div>
        </AnimatedSection>

        {/* Product Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {productCategories.map((category, index) => (
            <AnimatedSection
              key={index}
              animation="slideUp"
              delay={0.1 * index}
              duration={0.7}
            >
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
                {/* Card Content */}
                <div className="p-6">
                  {/* Icon with Gradient Background */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {category.icon}
                  </div>

                  {/* Emoji Badge */}
                  <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                    {category.image}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
                    {category.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {category.description}
                  </p>

                  {/* Items Count */}
                  <div className={`inline-flex items-center px-3 py-1 ${category.bgColor} rounded-full text-sm font-medium mb-4`}>
                    {category.items}
                  </div>

                  {/* View More Link */}
                  <button className="flex items-center space-x-2 text-green-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                    <span>View Products</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-500 rounded-2xl transition-all duration-300"></div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Best Sellers Section */}
        <AnimatedSection animation="zoomIn" delay={0.5} duration={0.8}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 md:p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">Explore Our Full Catalog</h3>
            <p className="text-xl mb-8 text-white/90">
              Over 500+ quality products available for immediate purchase
            </p>
            <button className="px-8 py-4 bg-white text-green-600 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              View All Products
            </button>
          </div>
        </AnimatedSection>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {trustBadges.map((badge, index) => (
            <AnimatedSection
              key={index}
              animation="fadeInUp"
              delay={0.7 + (0.1 * index)}
              duration={0.6}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-gray-700 font-medium">{badge.text}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;