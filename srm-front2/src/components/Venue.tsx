import PageTransition from './PageTransition';
import { MapPin, Mail, Calendar } from 'lucide-react';
import VenuePic from './images/kpr/3.png';
import MadrasHighCourt from './images/kpr/venue.png';

const Venue = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">

        <div className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Venue</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
              International Conference on Intelligent Unmanned Systems - ICIUS 2026<br />
              <span className="text-lg">26-27 November 2026 | Coimbatore, India</span>
            </p>
          </div>
        </div>

        {/* Main Venue Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#F5A051]">Conference Location</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* KPR Venue Image */}
              <div className="relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <img
                  src={VenuePic}
                  alt="KPR Institute - Conference Venue"
                  className="w-full object-contain p-8 bg-gray-50 h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">KPR Institute of Engineering and Technology</h3>
                  <p>Coimbatore, Tamil Nadu, India</p>
                </div>
              </div>

              {/* Conference Dates Image */}
              <div className="relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <img
                  src={MadrasHighCourt}
                  alt="Conference Dates - 26-27 November 2026"
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">Conference Dates</h3>
                  <p>26-27 November 2026</p>
                </div>
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">KPR INSTITUTE OF ENGINEERING AND TECHNOLOGY</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-start mb-4">
                    <MapPin className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>KPR Institute of Engineering and Technology</strong><br />
                      Arasur, Coimbatore - 641407<br />
                      Tamil Nadu, India
                    </p>
                  </div>

                  <div className="flex items-start mb-4">
                    <Calendar className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700"><strong>26-27 November 2026</strong></p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">About the Venue</h4>
                  <p className="text-gray-700 mb-4">
                    KPR Institute of Engineering and Technology (KPRIET) is a leading institution in Coimbatore, India,
                    dedicated to providing quality engineering education and fostering innovation. The campus offers
                    world-class facilities for academic discourse, research presentations, and professional networking.
                  </p>

                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Facilities Include:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Multi-purpose Auditoriums and Seminar Halls</li>
                    <li>Advanced Computing Centers and Laboratories</li>
                    <li>Smart Classrooms with Digital Learning Tools</li>
                    <li>Library with vast academic resources</li>
                    <li>On-campus dining and cafeteria services</li>
                    <li>Excellent connectivity to Coimbatore city and airport</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Conference Information</h3>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Event Details</h4>
                    <ul className="space-y-3 text-gray-700">
                      <li><strong>Venue:</strong> KPR Institute of Engineering and Technology</li>
                      <li><strong>Location:</strong> Coimbatore, India</li>
                      <li><strong>Dates:</strong> 26-27 November 2026</li>
                      <li><strong>Conference Type:</strong> International Conference</li>
                      <li><strong>Format:</strong> In-person + Virtual Hybrid</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Important Dates</h4>
                    <ul className="space-y-3 text-gray-700">
                      <li><strong>Extended Abstract:</strong> 30 June 2026</li>
                      <li><strong>Full Paper Submission:</strong> 30 July 2026</li>
                      <li><strong>Acceptance Notification:</strong> 15 August 2026</li>
                      <li><strong>Conference Days:</strong> 26-27 November 2026</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Information */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Getting to KPRIET</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">By Air:</h4>
                  <p className="text-gray-700 mb-4">
                    Coimbatore International Airport (CJB) is the nearest airport, located approximately 15 km from the institution.
                    It serves flights from major Indian cities and international destinations in Southeast Asia and Middle East.
                  </p>

                  <h4 className="text-lg font-semibold text-gray-800 mb-3">By Rail:</h4>
                  <p className="text-gray-700 mb-4">
                    Coimbatore Junction (CBE) and Coimbatore North Junction are the major railway stations connecting the city to all parts of India.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Local Transport:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Pre-paid Taxis from Airport and Railway Station</li>
                    <li>App-based cabs (Ola, Uber)</li>
                    <li>Public transport buses</li>
                    <li>Institutional shuttle services (contact organizers)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#F5A051]">Venue-Related Inquiries</h2>

            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <p className="text-lg text-gray-700 mb-4">
                For any questions related to the venue, accommodations, or travel assistance, please contact:
              </p>

              <div className="inline-flex items-center justify-center bg-[#F5A051]/10 px-6 py-3 rounded-lg">
                <Mail className="w-5 h-5 text-[#F5A051] mr-2" />
                <a href="mailto:icius2026@isius.org" className="text-lg font-medium text-[#F5A051]">
                  icius2026@isius.org
                </a>
              </div>

              <p className="mt-4 text-gray-600">
                The conference organizing committee will be happy to assist you with venue-related arrangements.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Venue;
