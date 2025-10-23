import { Target, Eye, Award, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import SanIsidro from '../assets/SanIsidro.jpg';
import Poblacion from '../assets/Poblacion.jpg';
import Lawaan from '../assets/MainBranch.jpg';
import AnimatedSection from './AnimatedSection';

const About = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    { src: Lawaan, name: 'Lawaan II Branch' },
    { src: SanIsidro, name: 'San Isidoro Branch' },
    { src: Poblacion, name: 'Poblacion Branch' },
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 2000); // Change image every 4 seconds

    return () => clearInterval(timer);
  }, [images.length]);

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Our Mission',
      description: 'To provide quality farm and pet care products that empower our community to grow and thrive.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Our Vision',
      description: 'To be the leading Agrivet service provider in the region, trusted by farmers and pet owners.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Our Values',
      description: 'Quality, integrity, and customer satisfaction guide everything we do.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Our Community',
      description: 'Serving Talisay City and beyond with dedication and expertise for over 10 years.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection animation="fadeInUp" duration={0.6}>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              About{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                AgriVet
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              For over 10 years, we've been providing quality farm and pet care products across Talisay City.
            </p>
          </div>
        </AnimatedSection>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Image Slideshow */}
          <AnimatedSection animation="slideLeft" delay={0.2} duration={0.8}>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Images */}
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Image Label Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <p className="text-white text-xl font-bold">{image.name}</p>
                      <p className="text-white/80 text-sm">Our Talisay Locations</p>
                    </div>
                  </div>
                ))}

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-white w-8' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`View ${images[index].name}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-green-100 rounded-2xl -z-10"></div>
            </div>
          </AnimatedSection>

          {/* Text Content */}
          <AnimatedSection animation="slideRight" delay={0.4} duration={0.8}>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Helping Our Community Grow
              </h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                AgriVet has been a trusted partner for farmers and pet owners throughout Talisay City. 
                We understand the unique needs of our agricultural community and provide comprehensive 
                solutions for both farm and companion animal care.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our commitment goes beyond just selling products. We offer expert advice, quality 
                assurance, and a customer-first approach that has made us the go-to choice for 
                agricultural and veterinary supplies in the region.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-green-600 mb-1">10+</p>
                  <p className="text-sm text-gray-700">Years of Service</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-emerald-600 mb-1">3</p>
                  <p className="text-sm text-gray-700">Branch Locations</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Mission, Vision, Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection 
              key={index}
              animation="fadeInUp" 
              delay={0.6 + index * 0.1}
              duration={0.6}
            >
              <div className="group bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-green-500 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;