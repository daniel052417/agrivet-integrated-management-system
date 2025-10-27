import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { useState } from 'react';
import SanIsidro from '../assets/SanIsidro.jpg';
import Poblacion from '../assets/Poblacion.jpg';
import Lawaan from '../assets/MainBranch.jpg';
import AnimatedSection from './AnimatedSection';

const Branches = () => {
  const [selectedBranch, setSelectedBranch] = useState(0);

  const branches = [
    {
      name: 'Lawaan 2 Branch',
      address: 'Talisay Avenue, Lawaan 2, Talisay City',
      phone: '+63 917 123 4567',
      hours: 'Mon-Sat: 7:00 AM - 6:00 PM',
      image: Lawaan,
      color: 'from-blue-500 to-cyan-500',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!4v1761219730700!6m8!1m7!1s0D5DGq2FmHnGSbElrkUqVA!2m2!1d10.25065433356093!2d123.8340852489282!3f32.83924786414099!4f-2.8572949547100706!5f0.7820865974627469',
      mapDirectionsUrl: 'https://maps.app.goo.gl/4pNH79d3mk19mcSo8',
    },
    {
      name: 'San Isidro Branch',
      address: 'Talisay Avenue, San Isidro, Talisay City',
      phone: '+63 917 234 5678',
      hours: 'Mon-Sat: 7:00 AM - 6:00 PM',
      image: SanIsidro,
      color: 'from-green-500 to-emerald-500',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!3m2!1sen!2sph!4v1761219384596!5m2!1sen!2sph!6m8!1m7!1szIrKGOSJU8jEzhraH7uCfA!2m2!1d10.25580328609661!2d123.8396315673356!3f276.63713317330536!4f-5.945391513063498!5f0.7820865974627469',
      mapDirectionsUrl: 'https://maps.app.goo.gl/KNuijimEB3AYdhH49',
    },
    {
      name: 'Poblacion Branch',
      address: 'Talisay Avenue, Poblacion, Talisay City',
      phone: '+63 917 345 6789',
      hours: 'Mon-Sat: 7:00 AM - 6:00 PM',
      image: Poblacion,
      color: 'from-purple-500 to-pink-500',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!3m2!1sen!2sph!4v1761219434244!5m2!1sen!2sph!6m8!1m7!1soy_dOdI1g_J_oZM_Uv0UpQ!2m2!1d10.24362187197966!2d123.8475391792054!3f181.71724749600864!4f-1.1484987921462988!5f0.7820865974627469',
      mapDirectionsUrl: 'https://maps.app.goo.gl/4kc1P5WDz7xBHZ7h6',
    },
  ];

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
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {branches.map((branch, index) => (
            <AnimatedSection
              key={index}
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
                      src={branch.image}
                      alt={branch.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${branch.color} opacity-80`}></div>
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
                      <p className="text-gray-700">{branch.address}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <a href={`tel:${branch.phone}`} className="text-gray-700 hover:text-green-600 transition-colors">
                        {branch.phone}
                      </a>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-gray-700">{branch.hours}</p>
                    </div>

                    
                      <a href={branch.mapDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-300 font-medium"
                    >
                      <Navigation size={18} />
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Interactive Map Section */}
        <AnimatedSection animation="zoomIn" delay={0.5} duration={0.8}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Google Maps Embed */}
            <div className="aspect-video relative overflow-hidden">
              <iframe
                src={branches[selectedBranch].mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
                title={`Map of ${branches[selectedBranch].name}`}
              ></iframe>
            </div>

            {/* Map Info Bar */}
            <div className="bg-gray-50 p-6 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Currently viewing</p>
                    <p className="text-lg font-bold text-gray-900">{branches[selectedBranch].name}</p>
                  </div>
                </div>
                
                
                  <a href={branches[selectedBranch].mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>

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