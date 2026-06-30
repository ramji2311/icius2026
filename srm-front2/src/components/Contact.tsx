import { useEffect } from 'react';

import { Phone, Mail, MapPin, Send } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function Contact() {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div className="min-h-screen bg-linear-gradient-from-red-50 to-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-[#F5A051]" data-aos="fade-up">
          Contact Us
        </h1>
        <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
          Have questions about ICIUS 2026? We're here to help!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div data-aos="fade-right">
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] text-gray-700"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] text-gray-700"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051] text-gray-700"
                  placeholder="Your message"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-[#F5A051] hover:bg-[#e08c3e] text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center"
              >
                Send Message
                <Send className="ml-2 h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="space-y-8 bg-white p-8 rounded-lg shadow-md" data-aos="fade-left">
            <h2 className="text-2xl font-semibold mb-6 text-[#F5A051]">Get in Touch</h2>
            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-[#F5A051]" />
              <div>
                <h3 className="font-medium text-gray-800">Phone</h3>
                <p className="text-gray-600">+91 9445690101</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Mail className="w-6 h-6 text-[#F5A051]" />
              <div>
                <h3 className="font-medium text-gray-800">Email</h3>
                <p className="text-gray-600">icius2026@isius.org</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-[#F5A051]" />
              <div>
                <h3 className="font-medium text-gray-800">Address</h3>
                <p className="text-gray-600">KPR Institute of Engineering and Technology<br />Arasur, Coimbatore, Tamil Nadu, India</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20" data-aos="fade-up">
          <h2 className="text-2xl font-semibold mb-6 text-center text-[#F5A051]">Find Us on the Map</h2>
          <div className="w-full h-96 bg-white rounded-lg overflow-hidden shadow-md">
            <iframe
              title="Pondicherry Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62901.86987680514!2d79.79992981322392!3d11.933459729454849!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5361ab8e49cfcf%3A0xcc6bd326d2f0b04e!2sPuducherry!5e0!3m2!1sen!2sin!4v1675648243435!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
