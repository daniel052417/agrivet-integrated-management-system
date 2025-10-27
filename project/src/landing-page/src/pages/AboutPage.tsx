import { Target, Eye, Award, Users, Heart, TrendingUp } from 'lucide-react';
import MainBranch from '../assets/MainBranch.jpg';
import AnimatedSection from '../components/AnimatedSection';

const AboutPage = () => {
  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Customer First',
      description: 'We prioritize our customers needs and satisfaction above all else.',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Quality Assurance',
      description: 'Every product meets our strict quality standards before reaching you.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community Focus',
      description: 'Supporting local farmers and pet owners is at the heart of what we do.',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Innovation',
      description: 'Embracing technology to provide better service and convenience.',
    },
  ];

  const team = [
    { role: 'Founder & CEO', name: 'Maria Santos', image: '👨‍💼' },
    { role: 'Operations Manager', name: 'Juan Dela Cruz', image: '👩‍💼' },
    { role: 'Veterinarian', name: 'Dr. Ana Reyes', image: '👨‍⚕️' },
    { role: 'Customer Service', name: 'Pedro Garcia', image: '👩‍💻' },
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fadeInUp" duration={0.8}>
            <div className="text-center">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                About{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                  Tiongson Agrivet
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                For over a decade, we've been the trusted partner for farmers and pet owners 
                across Talisay City, providing quality products and expert service.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="slideLeft" delay={0.2} duration={0.8}>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                <p className="text-lg text-gray-600 mb-4">
                  AgriVet was founded in 2020 with a simple mission: to provide quality agricultural 
                  and veterinary supplies to our local community. What started as a small store in 
                  Talisay City has grown into a trusted network of three branches serving hundreds 
                  of customers daily.
                </p>
                <p className="text-lg text-gray-600 mb-4">
                  Our founder, Ervhin Tiongson & Melanie Tiongson, grew up in a farming family and understood the challenges 
                  farmers face in sourcing quality supplies. She envisioned a one-stop shop where 
                  farmers and pet owners could find everything they need, backed by expert advice 
                  and excellent customer service.
                </p>
                <p className="text-lg text-gray-600">
                  Today, we continue that vision by combining traditional values with modern technology, 
                  offering both in-store and online shopping experiences through our Progressive Web App.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="slideRight" delay={0.4} duration={0.8}>
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={MainBranch} 
                    alt="Tiongson Agrivet Main Branch" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-900/40 to-transparent flex items-end justify-center p-8">
                    <div className="text-center text-white">
                      <p className="text-4xl font-bold mb-2">Since 2020</p>
                      <p className="text-lg">Serving Talisay City</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <AnimatedSection animation="slideUp" delay={0.2} duration={0.7}>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-lg text-gray-600">
                  To provide quality farm and pet care products that empower our community to grow 
                  and thrive. We strive to be more than just a supplier—we aim to be a partner in 
                  our customers' success, offering expert advice, competitive prices, and exceptional service.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="slideUp" delay={0.4} duration={0.7}>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white mb-6">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-lg text-gray-600">
                  To be the leading Agrivet service provider in the region, trusted by farmers and 
                  pet owners for our commitment to quality, innovation, and community development. 
                  We envision a future where technology and traditional expertise work together to 
                  serve our customers better.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fadeInUp" duration={0.6}>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                These principles guide everything we do
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <AnimatedSection
                key={index}
                animation="slideUp"
                delay={0.1 * index}
                duration={0.6}
              >
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fadeInUp" duration={0.6}>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Dedicated professionals committed to your success
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <AnimatedSection
                key={index}
                animation="zoomIn"
                delay={0.1 * index}
                duration={0.5}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-7xl mb-4">{member.image}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-green-600 font-medium">{member.role}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fadeInUp" duration={0.8}>
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Visit any of our branches or shop online through our PWA
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-green-600 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  Visit Our Stores
                </button>
                <button className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  Shop Online
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;