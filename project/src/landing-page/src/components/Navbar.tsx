import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/logo.png';
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); 
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    // { name: 'Products', action: () => scrollToSection('products') },
    { name: 'Products', path: '/products' },
    { name: 'Branches', action: () => scrollToSection('branches') },
    { name: 'Promotions', action: () => scrollToSection('promotions') },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-lg py-3'
          : 'bg-white/95 backdrop-blur-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={Logo} 
              alt="Agrivet Logo" 
              className="w-12 h-12 object-contain transform group-hover:scale-110 transition-transform duration-300"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Tiongson</h1>
              <p className="text-xs text-gray-600">Agrivet Business</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  if (link.path) {
                    window.location.href = link.path;
                  } else if (link.action) {
                    link.action();
                  }
                }}
                className={`text-sm font-medium transition-colors duration-200 hover:text-green-600 ${
                  location.pathname === link.path
                    ? 'text-green-600'
                    : 'text-gray-700'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button onClick={() => window.location.href = 'http://localhost:3001/branch-selection'}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-green-600 transition-colors duration-200">
              <ShoppingCart size={20} />
              
              <span className="text-sm font-medium">Shop Now</span>
            </button>
            {/* <button className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200">
              <LogIn size={18} />
              <span className="text-sm font-medium">Login / PWA</span>
            </button> */}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96 mt-4' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col space-y-3 pb-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  if (link.path) {
                    window.location.href = link.path;
                  } else if (link.action) {
                    link.action();
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                  location.pathname === link.path
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </button>
            ))}
            <div className="flex flex-col space-y-2 pt-2 border-t">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <ShoppingCart size={20} />
                <span>Shop Now</span>
              </button>
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg">
                <LogIn size={18} />
                <span>Login / PWA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;