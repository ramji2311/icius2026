import { ArrowLeft, Mail, Globe, BookOpen, Award, Calendar } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import PageTransition from './PageTransition';
import { Link, useParams } from 'react-router-dom';
import G from "./images/g.jpg"
// Define speakers data
const speakersData = {
  'sam-goundar': {
    name: 'Prof. Dr. Sam Goundar',
    title: 'Senior Lecturer in Information Technology',
    affiliation: 'RMIT University',
    location: 'Vietnam',
    image: G,
    email: 'sam.goundar@rmit.edu.vn',
    website: 'https://www.rmit.edu.vn/faculty/goundar-sam',
    linkedin: 'https://www.linkedin.com/in/sam-goundar-1928223a/',
    bio: [
      "Professor Dr. Sam Goundar is an international academic and researcher with over 35 years of teaching experience across 13 universities in 11 different countries. He specializes in emerging technologies such as Artificial Intelligence, Blockchain, Educational Technologies, Data Science, and Cyber Security. As Editor-in-Chief of multiple international journals, including the International Journal of Blockchains and Cryptocurrencies and the International Journal of Fog Computing, he has made significant contributions to academic publishing.",
      "Dr. Goundar has authored and edited 20 books and published over 140 research articles in reputable journals and book chapters. His research excellence is reflected in his global collaborations and innovative contributions to advancing technology-driven education. He is renowned for his work in equitable and transformative education."
    ],
    expertise: [
      "Artificial Intelligence & Machine Learning",
      "Blockchain Technologies",
      "Educational Technologies",
      "Data Science & Analytics",
      "Cyber Security",
      "Technology-Driven Education"
    ],
    talkTitle: "The Future of AI and Blockchain in Transforming Global Education",
    talkAbstract: "This keynote will explore how emerging technologies like AI and blockchain are revolutionizing education systems worldwide. Dr. Goundar will discuss the potential of these technologies to create more equitable, accessible, and personalized learning experiences, while addressing challenges related to implementation, ethics, and digital divide considerations."
  }
  // More speakers can be added here
};

const SpeakerProfile = () => {
  const { speakerId } = useParams();
  const speaker = speakerId ? speakersData[speakerId as keyof typeof speakersData] : null;
  
  if (!speaker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Speaker Not Found</h2>
          <p className="text-gray-600 mb-6">The requested speaker profile does not exist or has been moved.</p>
          <Link 
            to="/keynote-speakers" 
            className="inline-flex items-center px-4 py-2 bg-[#F5A051] text-white rounded-md hover:bg-[#e08c3e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Speakers
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <Link 
              to="/keynote-speakers" 
              className="inline-flex items-center text-white hover:text-gray-200 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Speakers
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">Keynote Speaker</h1>
          </div>
        </div>
        
        <main className="container mx-auto py-12 px-4 max-w-6xl">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                <img
                  src={speaker.image}
                  alt={speaker.name}
                  className="w-60 h-60 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/300?text=${speaker.name.replace(/ /g, '+')}`;
                  }}
                />
              </div>
              
              <div className="md:w-2/3 md:pl-8">
                <h2 className="text-3xl font-bold text-gray-900">{speaker.name}</h2>
                <p className="text-xl text-[#F5A051] font-medium">{speaker.title}</p>
                <p className="text-lg text-gray-700 mt-1">{speaker.affiliation} • {speaker.location}</p>
                
                <div className="mt-4 space-y-2">
                  {speaker.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-[#F5A051] mr-3" />
                      <a 
                        href={`mailto:${speaker.email}`} 
                        className="text-blue-600 hover:underline"
                      >
                        {speaker.email}
                      </a>
                    </div>
                  )}
                  
                  {speaker.website && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-[#F5A051] mr-3" />
                      <a 
                        href={speaker.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        Faculty Profile
                      </a>
                    </div>
                  )}
                  
                  {speaker.linkedin && (
                    <div className="flex items-center">
                      <FaLinkedin className="w-5 h-5 text-[#F5A051] mr-3" />
                      <a
                        href={speaker.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="w-6 h-6 text-[#F5A051] mr-2" />
                Biography
              </h3>
              <div className="space-y-4">
                {speaker.bio.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-6 h-6 text-[#F5A051] mr-2" />
                Areas of Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {speaker.expertise.map((area, index) => (
                  <span 
                    key={index} 
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-8 bg-[#fcf8e3] p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-6 h-6 text-[#F5A051] mr-2" />
                Keynote Presentation
              </h3>
              <h4 className="text-xl font-bold text-[#F5A051] mb-2">{speaker.talkTitle}</h4>
              <p className="text-gray-700 leading-relaxed">{speaker.talkAbstract}</p>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default SpeakerProfile;
