import Hero from '../components/Hero';
import About from '../components/About';
import Products from '../components/Products';
import Features from '../components/Features';
import Branches from '../components/Branches';
import Promotions from '../components/Promotions';
import ContactForm from '../components/ContactForm';

const Home = () => {
  return (
    <div className="pt-16">
      <Hero />
      <About />
      <Products />
      <Features />
      <Branches />
      <Promotions />
      <ContactForm />
    </div>
  );
};

export default Home;