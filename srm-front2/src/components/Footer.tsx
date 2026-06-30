// import React from 'react'
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import SmallLogo from './images/lo.png'


const Footer = () => {
  return (
    <div>

      <footer className="bg-[#0B1829] text-white py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Conference Title Section */}
          <div>
            <div className="flex items-center mb-4">
              <img src={SmallLogo} alt="ICIUS Logo" className="h-12 mr-3" />
              <h2 className="text-2xl font-bold">ICIUS-2026</h2>
            </div>
            <p className="text-gray-300 mb-6">
              The vision behind organising this conference is to provide an excellent forum for
              researchers, scientists and industrialists from interdisciplinary areas to showcase
              their current contributions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-[#F5A051] transition-colors">
                <div className="w-10 h-10 border border-gray-600 rounded-full flex items-center justify-center">
                  <FaTwitter size={20} />
                </div>
              </a>
              <a href="#" className="hover:text-[#F5A051] transition-colors">
                <div className="w-10 h-10 border border-gray-600 rounded-full flex items-center justify-center">
                  <FaFacebook size={20} />
                </div>
              </a>
              <a href="#" className="hover:text-[#F5A051] transition-colors">
                <div className="w-10 h-10 border border-gray-600 rounded-full flex items-center justify-center">
                  <FaInstagram size={20} />
                </div>
              </a>
              <a href="#" className="hover:text-[#F5A051] transition-colors">
                <div className="w-10 h-10 border border-gray-600 rounded-full flex items-center justify-center">
                  <FaLinkedin size={20} />
                </div>
              </a>
            </div>
          </div>

          {/* Useful Links Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Useful Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Home</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Call For Papers</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Paper Submission</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Registrations</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Committee</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Keynote speakers</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Contact</a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-[#F5A051] transition-colors">Venue</a>
              </li>
            </ul>
          </div>

          {/* Contact Us Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <div className="text-gray-300">
              <p className="mb-2">KPR Institute of Engineering and Technology</p>
              <p className="mb-2">Coimbatore, Tamil Nadu, India</p>
              <p className="mb-2">
                <span className="font-bold">Phone:</span> +91 9445690101
              </p>
              <p>
                <span className="font-bold">Email:</span> icius2026@isius.org
              </p>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-gray-800">
          <div className="text-center text-gray-400 text-sm">
            <p>© Copyright 2026. All Rights Reserved</p>
            <p>ICIUS 2026</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Footer
