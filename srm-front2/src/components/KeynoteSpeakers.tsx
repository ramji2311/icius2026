import { useState } from 'react';
import { Scroll, Globe, Mail, BookOpen, Award, ChevronDown, ChevronUp } from 'lucide-react';
import PageTransition from './PageTransition';
// import Speaker1 from "./images/speaker/s1.png"
// import Speaker2 from "./images/g.jpg"
// import Speaker3 from "./images/speaker/s3.png"
// import devi from "./images/speaker/gi.png"
// import SpeakerImage from "./images/speaker/n.png"
import MahmoudShafikImage from "./images/speaker/n.png"
import KazuoIshiiImage from "./images/new/kazuo4.jpeg"
import DugkiMinImage from "./images/new/dugki.jpg"
import YaoZouImage from "./images/new/zou.gif"

interface Speaker {
  id: number;
  name: string;
  title: string;
  institution: string;
  image: string;
  email?: string;
  facultyProfile?: string;
  linkedIn?: string;
  orcid?: string;
  biography: string;
  expertise: string[];
  keynoteTitle: string;
  keynoteDescription: string;
}

const speakers: Speaker[] = [
  {
    id: 1,
    name: "Mahmoud Shafik",
    title: "BEng (Hons) MSc PhD CEng FHEA MIET MASME",
    institution:
      "Professor/Senior Lead Academic in Intelligent Systems and Digital Technology • University of Derby, United Kingdom",
    image: MahmoudShafikImage,
    email: "mshafik@derby.ac.uk",
    facultyProfile: "https://www.derby.ac.uk/staff/mahmoud-shafik/",
    linkedIn: "https://www.linkedin.com/in/mahmoud-shafik-ph-d-0602377/",
    orcid: "0000-0001-8296-5698",
    biography:
      "Professor Mahmoud Shafik is an internationally recognized scholar in Intelligent Systems and Digital Technology at the University of Derby. He has made personal distinctions for his contributions in Intelligent Mechatronics Systems and Digital Technology with more than 20 years of industrial applied research experience. His work spans Intelligent Systems, Industry 4.0, Artificial Intelligence (AI), Internet of Things (IoT), autonomous vehicle technologies, robotic systems, machine vision, sensors and actuators, automation, telehealth, renewable energy systems, and sustainable engineering technologies. He has successfully led and delivered several European Commission FP5, FP6, FP7 and Horizon projects with major industrial and societal impact across the UK and Europe.",
    expertise: [
      "Intelligent Systems",
      "Digital Technology",
      "Industry 4.0",
      "Artificial Intelligence",
      "Internet of Things (IoT)",
      "Robotic Systems and Automation",
      "Machine Vision",
      "3D Smart Sensors and Actuators",
      "Autonomous Vehicle Systems",
      "Telehealth and Telecare",
      "Renewable Energy Systems",
      "Sustainable Engineering"
    ],
    keynoteTitle:
      "Intelligent Systems and Digital Technology for Sustainable Engineering",
    keynoteDescription:
      "The keynote discusses emerging intelligent technologies in automation, robotics, Industry 4.0, and digital transformation for sustainable engineering applications and industrial innovation."
  },
  {
    id: 2,
    name: "Kazuo Ishii",
    title: "Dr. Eng., Professor",
    institution:
      "Center for Socio-Robotic Synthesis • Kyushu Institute of Technology, Japan",
    image: KazuoIshiiImage,
    email: "",
    facultyProfile:
      "https://hyokadb02.jimu.kyutech.ac.jp/html/353_en.html",
    linkedIn: "",
    orcid: "",
    biography:
      "Professor Kazuo Ishii is a Professor at the Kyushu Institute of Technology, Japan, and a leading researcher in robotics, underwater robotics, autonomous systems, agricultural robotics, and socio-robotic systems. He completed his doctoral studies at the University of Tokyo and has served as a visiting researcher at Fraunhofer AIS, Germany. His recent research includes underwater vehicles, tomato-harvesting robots, smart agriculture systems, robotic sensing, ultrasonic systems, underwater communication, aquaculture technologies, and intelligent robotic motion control.",
    expertise: [
      "Robotics",
      "Underwater Robotics",
      "Autonomous Underwater Vehicles",
      "Smart Agriculture",
      "Agricultural Robotics",
      "Robot Motion Control",
      "Ultrasonic Systems",
      "Aquaculture Technologies",
      "Sensor Systems",
      "Socio-Robotic Systems",
      "Marine Robotics",
      "Intelligent Robotic Systems"
    ],
    keynoteTitle:
      "Advanced Underwater Robotics for Smart Society",
    keynoteDescription:
      "This keynote explores recent advances in underwater robotics, smart agriculture robots, autonomous robotic systems, and intelligent sensing technologies for future smart society applications."
  },
  {
    id: 3,
    name: "Prof. Dugki Min*",
    title: "Professor (Under Confirmation)",
    institution:
      "Department of Computer Science and Engineering • Konkuk University, South Korea",
    image: DugkiMinImage,
    email: "dkmin@konkuk.ac.kr",
    facultyProfile: "https://dms.konkuk.ac.kr/people/DugkiMin/",
    linkedIn: "",
    orcid: "",
    biography:
      "Professor Dugki Min is a Full Professor in the Department of Computer Science and Engineering at Konkuk University, South Korea. He received his Ph.D. in Computer Science and Engineering from Michigan State University. His research focuses on Distributed Systems, Artificial Intelligence, Deep Reinforcement Learning, Software Architecture, Cloud Computing, Mobile Cloud Computing, Virtualization, Web Services, and Multimedia Distributed Systems. He currently leads the Multimedia Distributed Systems Laboratory and has served in multiple academic leadership roles including Chairman of the Department of Artificial Intelligence at Konkuk University.",
    expertise: [
      "Distributed Systems",
      "Artificial Intelligence",
      "Deep Reinforcement Learning",
      "Software Architecture",
      "Cloud Computing",
      "Mobile Cloud Computing",
      "Virtualization",
      "Web Services",
      "Multimedia Distributed Systems",
      "Parallel and Distributed Computing",
      "System Architecture",
      "AI Systems"
    ],
    keynoteTitle:
      "Distributed AI and Cloud-Based Intelligent Computing Systems",
    keynoteDescription:
      "The keynote presents recent developments in distributed AI systems, intelligent cloud computing, software architecture, and scalable computing technologies for next-generation digital systems."
  },
  {
    id: 4,
    name: "Yao Zou",
    title: "Professor",
    institution:
      "University of Science and Technology Beijing • China",
    image: YaoZouImage,
    email: "",
    facultyProfile:
      "https://ieeexplore.ieee.org/author/37086156767",
    linkedIn: "",
    orcid: "",
    biography:
      "Professor Yao Zou is an active researcher and IEEE author with contributions in intelligent control systems, robotics, autonomous systems, and advanced engineering technologies. His research publications focus on intelligent automation, control engineering, robotics applications, and next-generation smart systems. He has contributed to several international research publications indexed by IEEE and related scientific platforms.",
    expertise: [
      "Intelligent Control Systems",
      "Robotics",
      "Autonomous Systems",
      "Control Engineering",
      "Automation",
      "Smart Systems",
      "Artificial Intelligence",
      "Engineering Technologies"
    ],
    keynoteTitle:
      "Intelligent Control and Automation for Future Engineering Systems",
    keynoteDescription:
      "This keynote discusses emerging research trends in intelligent control systems, automation technologies, robotics, and AI-driven engineering applications."
  }
];
// {
//   id: 1,
//   name: "Dr. R. Devi Priya",
//   title: "Principal",
//   institution: "KPR Institute of Engineering and Technology, Coimbatore",
//   image: devi,
//   email: "devipriya.r@kpriet.ac.in",
//   facultyProfile: "https://www.kpriet.ac.in/faculty-details/329/dr-devi-priya-r",
//   linkedIn: "https://www.linkedin.com/in/devi-priya-r-b0621843/",
//   biography: "Dr. R. Devi Priya is a distinguished academician, researcher, and academic leader currently serving as the Principal of KPR Institute of Engineering and Technology, Coimbatore. With nearly two decades of experience in teaching, research, and administration in the field of Computer Science and Engineering, she has played a pivotal role in advancing academic excellence, research innovation, and industry collaboration. Prior to assuming the role of Principal, she served as Professor and Head of the Department of Computer Science and Engineering, where she significantly strengthened research activities, student placement initiatives, and industry partnerships. Dr. Devi Priya has guided numerous undergraduate, postgraduate, and research scholars in emerging domains such as cybersecurity, cloud computing, data science, and artificial intelligence. She has published extensively in reputed journals and conferences and actively promotes outcome-based education, innovation-driven learning, and holistic student development aligned with global technological trends.",
//   expertise: [
//     "Cybersecurity",
//     "Cloud Computing",
//     "Data Science",
//     "Artificial Intelligence",
//     "Machine Learning",
//     "Network Security",
//     "Industrial IoT",
//     "Outcome-Based Education",
//     "Academic Leadership"
//   ],
//   keynoteTitle: "Empowering Future Engineers through Industry-Aligned Digital Education",
//   keynoteDescription: "This keynote explores strategies for bridging the gap between academia and industry in the rapidly evolving digital era. Dr. Devi Priya discusses innovative teaching methodologies, integration of cybersecurity and cloud technologies into curriculum design, and the role of research-driven education in enhancing student competence. The session highlights practical approaches to industry collaboration, skill development initiatives, and emerging trends shaping the future of engineering education."
// },
// {
//   id: 2,
//   name: "Associate Professor Ts Dr Tan Kian Lam (Andrew)",
//   title: "Dean, School of Digital Technology",
//   institution: "Universiti Sains Malaysia",
//   image: Speaker1,
//   email: "andrew.tan@usm.edu.my",
//   facultyProfile: "https://www.linkedin.com/in/assoc-prof-ts-dr-andrew-tan-kian-lam-552615214/",
//   linkedIn: "https://www.linkedin.com/in/assoc-prof-ts-dr-andrew-tan-kian-lam-552615214/",
//   biography: "Associate Professor Ts Dr Tan Kian Lam (Andrew) is an accomplished academic and researcher with extensive experience in computer science and digital technology. He successfully launched the DiGiT Learning Model, ensuring 100% job placement for the first cohort students after one year of study. As a Visiting Scientist at Universite Grenoble Alpes, he focused on lifelogging and tourism using machine learning. Dr. Tan has served as an Adjunct Researcher at the International e-Tourism Research Center at Chengdu University, China, and as an Advisor at the National Child Data Centre (NCDC) for comprehensive child data management. His industry experience includes working as a Software Engineer at Intel, contributing to automation software solutions across the United States, India, and China. With over 80 proceedings and journal articles in high-impact journals, Dr. Tan is renowned for his innovative contributions to data science and digital heritage.",
//   expertise: [
//     "Data Science",
//     "Digital Heritage",
//     "E-Tourism",
//     "Extended-Reality",
//     "Gamification",
//     "Information Retrieval",
//     "Mobile Computing",
//     "Education Technology"
//   ],
//   keynoteTitle: "Digital Transformation in Education: Bridging Technology and Learning",
//   keynoteDescription: "This keynote will explore how digital technologies are revolutionizing education systems worldwide. Dr. Tan will discuss the DiGiT Learning Model and its success in achieving 100% job placement, while addressing the integration of extended reality, gamification, and data science in creating more engaging and effective learning experiences. The presentation will cover practical implementations, challenges, and future directions in technology-driven education."
// },
// {
//   id: 3,
//   name: "Prof. Dr. Sam Goundar",
//   title: "Senior Lecturer in Information Technology",
//   institution: "RMIT University • Vietnam",
//   image: Speaker2,
//   email: "sam.goundar@rmit.edu.vn",
//   facultyProfile: "https://www.linkedin.com/in/sam-goundar-1928223a/",
//   linkedIn: "https://www.linkedin.com/in/sam-goundar-1928223a/",
//   biography: "Professor Dr. Sam Goundar is an international academic and researcher with over 35 years of teaching experience across 13 universities in 11 different countries. He specializes in emerging technologies such as Artificial Intelligence, Blockchain, Educational Technologies, Data Science, and Cyber Security. As Editor-in-Chief of multiple international journals, including the International Journal of Blockchains and Cryptocurrencies and the International Journal of Fog Computing, he has made significant contributions to academic publishing. Dr. Goundar has authored and edited 20 books and published over 140 research articles in reputable journals and book chapters. His research excellence is reflected in his global collaborations and innovative contributions to advancing technology-driven education. He is renowned for his work in equitable and transformative education.",
//   expertise: [
//     "Artificial Intelligence & Machine Learning",
//     "Blockchain Technologies",
//     "Educational Technologies",
//     "Data Science & Analytics",
//     "Cyber Security",
//     "Technology-Driven Education"
//   ],
//   keynoteTitle: "The Future of AI and Blockchain in Transforming Global Education",
//   keynoteDescription: "This keynote will explore how emerging technologies like AI and blockchain are revolutionizing education systems worldwide. Dr. Goundar will discuss the potential of these technologies to create more equitable, accessible, and personalized learning experiences, while addressing challenges related to implementation, ethics, and digital divide considerations."
// },
// {
//   id: 4,
//   name: "Dr. R. Annie Uthra",
//   title: "Professor and Head (Computational Intelligence)",
//   institution: "SRM Institute of Science and Technology • Chennai",
//   image: Speaker3,
//   email: "annieu@srmist.edu.in",
//   facultyProfile: "https://www.srmist.edu.in/faculty/dr-r-annie-uthra/",
//   linkedIn: "https://www.srmist.edu.in/faculty/dr-r-annie-uthra/",
//   biography: "Dr. R. Annie Uthra is a distinguished Professor and Head of the Department of Computational Intelligence at SRM Institute of Science and Technology. With extensive expertise in Machine Learning, Data Analytics, and IoT applications, she has made significant contributions to the field of computational intelligence. Her research focuses on energy-efficient routing in wireless sensor networks, database management systems, and cloud computing. Dr. Uthra has published extensively in Machine Learning and Data Mining, and is recognized for her teaching excellence in Data Structures and Algorithm Design. She has been instrumental in advancing research in wireless sensor networks and has mentored numerous students in cutting-edge technologies.",
//   expertise: [
//     "Machine Learning",
//     "Data Analytics",
//     "Internet of Things (IoT)",
//     "Energy Efficient Routing",
//     "Wireless Sensor Networks",
//     "Database Management Systems",
//     "Cloud Computing",
//     "Computer Networks"
//   ],
//   keynoteTitle: "Intelligent Systems and IoT: Shaping the Future of Connected Devices",
//   keynoteDescription: "This keynote will delve into the convergence of machine learning and IoT technologies, exploring how intelligent systems are transforming the landscape of connected devices. Dr. Uthra will discuss energy-efficient routing protocols, data analytics in IoT ecosystems, and the role of computational intelligence in creating smarter, more responsive networks. The presentation will highlight real-world applications, research challenges, and future opportunities in this rapidly evolving field."
// }

// {
//   id: 1,
//   name: "Dr. R. Devi Priya",
//   title: "Principal",
//   institution: "KPR Institute of Engineering and Technology, Coimbatore",
//   image: devi,
//   email: "devipriya.r@kpriet.ac.in",
//   facultyProfile: "https://www.kpriet.ac.in/faculty-details/329/dr-devi-priya-r",
//   linkedIn: "https://www.linkedin.com/in/devi-priya-r-b0621843/",
//   biography: "Dr. R. Devi Priya is a distinguished academician, researcher, and academic leader currently serving as the Principal of KPR Institute of Engineering and Technology, Coimbatore. With nearly two decades of experience in teaching, research, and administration in the field of Computer Science and Engineering, she has played a pivotal role in advancing academic excellence, research innovation, and industry collaboration. Prior to assuming the role of Principal, she served as Professor and Head of the Department of Computer Science and Engineering, where she significantly strengthened research activities, student placement initiatives, and industry partnerships. Dr. Devi Priya has guided numerous undergraduate, postgraduate, and research scholars in emerging domains such as cybersecurity, cloud computing, data science, and artificial intelligence. She has published extensively in reputed journals and conferences and actively promotes outcome-based education, innovation-driven learning, and holistic student development aligned with global technological trends.",
//   expertise: [
//     "Cybersecurity",
//     "Cloud Computing",
//     "Data Science",
//     "Artificial Intelligence",
//     "Machine Learning",
//     "Network Security",
//     "Industrial IoT",
//     "Outcome-Based Education",
//     "Academic Leadership"
//   ],
//   keynoteTitle: "Empowering Future Engineers through Industry-Aligned Digital Education",
//   keynoteDescription: "This keynote explores strategies for bridging the gap between academia and industry in the rapidly evolving digital era. Dr. Devi Priya discusses innovative teaching methodologies, integration of cybersecurity and cloud technologies into curriculum design, and the role of research-driven education in enhancing student competence. The session highlights practical approaches to industry collaboration, skill development initiatives, and emerging trends shaping the future of engineering education."
// },
// {
//   id: 2,
//   name: "Associate Professor Ts Dr Tan Kian Lam (Andrew)",
//   title: "Dean, School of Digital Technology",
//   institution: "Universiti Sains Malaysia",
//   image: Speaker1,
//   email: "andrew.tan@usm.edu.my",
//   facultyProfile: "https://www.linkedin.com/in/assoc-prof-ts-dr-andrew-tan-kian-lam-552615214/",
//   linkedIn: "https://www.linkedin.com/in/assoc-prof-ts-dr-andrew-tan-kian-lam-552615214/",
//   biography: "Associate Professor Ts Dr Tan Kian Lam (Andrew) is an accomplished academic and researcher with extensive experience in computer science and digital technology. He successfully launched the DiGiT Learning Model, ensuring 100% job placement for the first cohort students after one year of study. As a Visiting Scientist at Universite Grenoble Alpes, he focused on lifelogging and tourism using machine learning. Dr. Tan has served as an Adjunct Researcher at the International e-Tourism Research Center at Chengdu University, China, and as an Advisor at the National Child Data Centre (NCDC) for comprehensive child data management. His industry experience includes working as a Software Engineer at Intel, contributing to automation software solutions across the United States, India, and China. With over 80 proceedings and journal articles in high-impact journals, Dr. Tan is renowned for his innovative contributions to data science and digital heritage.",
//   expertise: [
//     "Data Science",
//     "Digital Heritage",
//     "E-Tourism",
//     "Extended-Reality",
//     "Gamification",
//     "Information Retrieval",
//     "Mobile Computing",
//     "Education Technology"
//   ],
//   keynoteTitle: "Digital Transformation in Education: Bridging Technology and Learning",
//   keynoteDescription: "This keynote will explore how digital technologies are revolutionizing education systems worldwide. Dr. Tan will discuss the DiGiT Learning Model and its success in achieving 100% job placement, while addressing the integration of extended reality, gamification, and data science in creating more engaging and effective learning experiences. The presentation will cover practical implementations, challenges, and future directions in technology-driven education."
// },
// {
//   id: 3,
//   name: "Prof. Dr. Sam Goundar",
//   title: "Senior Lecturer in Information Technology",
//   institution: "RMIT University • Vietnam",
//   image: Speaker2,
//   email: "sam.goundar@rmit.edu.vn",
//   facultyProfile: "https://www.linkedin.com/in/sam-goundar-1928223a/",
//   linkedIn: "https://www.linkedin.com/in/sam-goundar-1928223a/",
//   biography: "Professor Dr. Sam Goundar is an international academic and researcher with over 35 years of teaching experience across 13 universities in 11 different countries. He specializes in emerging technologies such as Artificial Intelligence, Blockchain, Educational Technologies, Data Science, and Cyber Security. As Editor-in-Chief of multiple international journals, including the International Journal of Blockchains and Cryptocurrencies and the International Journal of Fog Computing, he has made significant contributions to academic publishing. Dr. Goundar has authored and edited 20 books and published over 140 research articles in reputable journals and book chapters. His research excellence is reflected in his global collaborations and innovative contributions to advancing technology-driven education. He is renowned for his work in equitable and transformative education.",
//   expertise: [
//     "Artificial Intelligence & Machine Learning",
//     "Blockchain Technologies",
//     "Educational Technologies",
//     "Data Science & Analytics",
//     "Cyber Security",
//     "Technology-Driven Education"
//   ],
//   keynoteTitle: "The Future of AI and Blockchain in Transforming Global Education",
//   keynoteDescription: "This keynote will explore how emerging technologies like AI and blockchain are revolutionizing education systems worldwide. Dr. Goundar will discuss the potential of these technologies to create more equitable, accessible, and personalized learning experiences, while addressing challenges related to implementation, ethics, and digital divide considerations."
// },
// {
//   id: 4,
//   name: "Dr. R. Annie Uthra",
//   title: "Professor and Head (Computational Intelligence)",
//   institution: "SRM Institute of Science and Technology • Chennai",
//   image: Speaker3,
//   email: "annieu@srmist.edu.in",
//   facultyProfile: "https://www.srmist.edu.in/faculty/dr-r-annie-uthra/",
//   linkedIn: "https://www.srmist.edu.in/faculty/dr-r-annie-uthra/",
//   biography: "Dr. R. Annie Uthra is a distinguished Professor and Head of the Department of Computational Intelligence at SRM Institute of Science and Technology. With extensive expertise in Machine Learning, Data Analytics, and IoT applications, she has made significant contributions to the field of computational intelligence. Her research focuses on energy-efficient routing in wireless sensor networks, database management systems, and cloud computing. Dr. Uthra has published extensively in Machine Learning and Data Mining, and is recognized for her teaching excellence in Data Structures and Algorithm Design. She has been instrumental in advancing research in wireless sensor networks and has mentored numerous students in cutting-edge technologies.",
//   expertise: [
//     "Machine Learning",
//     "Data Analytics",
//     "Internet of Things (IoT)",
//     "Energy Efficient Routing",
//     "Wireless Sensor Networks",
//     "Database Management Systems",
//     "Cloud Computing",
//     "Computer Networks"
//   ],
//   keynoteTitle: "Intelligent Systems and IoT: Shaping the Future of Connected Devices",
//   keynoteDescription: "This keynote will delve into the convergence of machine learning and IoT technologies, exploring how intelligent systems are transforming the landscape of connected devices. Dr. Uthra will discuss energy-efficient routing protocols, data analytics in IoT ecosystems, and the role of computational intelligence in creating smarter, more responsive networks. The presentation will highlight real-world applications, research challenges, and future opportunities in this rapidly evolving field."
// }


const KeynoteSpeakers = () => {
  const [expandedSpeaker, setExpandedSpeaker] = useState<number | null>(null);

  const toggleSpeaker = (id: number) => {
    if (expandedSpeaker === id) {
      setExpandedSpeaker(null);
    } else {
      setExpandedSpeaker(id);
      // Smooth scroll to the profile
      setTimeout(() => {
        const element = document.getElementById(`profile-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white py-10 sm:py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex items-center justify-center mb-6">
              <Scroll className="w-12 h-12 mr-4 animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold">Keynote Speakers</h1>
            </div>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto text-center">
              Distinguished experts sharing insights at ICIUS 2026
            </p>
          </div>
        </header>

        <main className="container mx-auto py-8 sm:py-16 px-4">
          {/* Introduction */}
          <div className="max-w-5xl mx-auto mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Meet Our Featured Speakers</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We are honored to present our distinguished keynote speakers for ICIUS 2026. These renowned experts
              will share their valuable insights and cutting-edge research across intelligent systems and multidisciplinary domains.
            </p>
          </div>

          {/* Speakers Row */}
          <div className="max-w-7xl mx-auto mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  id={`speaker-${speaker.id}`}
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  {/* Image Container */}
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/400x500?text=Speaker";
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                    {/* Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-lg font-bold mb-1 line-clamp-2">
                        {speaker.name.includes('*') ? (
                          <>
                            {speaker.name.replace('*', '')}
                            <span className="text-orange-500 text-2xl font-black ml-1 leading-none align-middle">*</span>
                          </>
                        ) : (
                          speaker.name
                        )}
                      </h3>
                      <p className="text-xs opacity-90 mb-1">{speaker.title}</p>
                      <p className="text-[10px] opacity-75 leading-tight">{speaker.institution}</p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="p-4 bg-gradient-to-br from-blue-900 to-[#F5A051]">
                    <button
                      onClick={() => toggleSpeaker(speaker.id)}
                      className="w-full bg-white text-blue-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                      {expandedSpeaker === speaker.id ? (
                        <>
                          Hide Profile
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          View Profile
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expanded Profile Section */}
          {expandedSpeaker !== null && (
            <div id={`profile-${expandedSpeaker}`} className="max-w-7xl mx-auto animate-slideDown mb-8">
              {speakers
                .filter((speaker) => speaker.id === expandedSpeaker)
                .map((speaker) => (
                  <div
                    key={speaker.id}
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {/* Profile Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                      {/* Left Column - Speaker Photo */}
                      <div className="lg:col-span-3 bg-gradient-to-br from-gray-100 to-gray-200 p-6 sm:p-8 flex flex-col items-center justify-start">
                        <img
                          src={speaker.image}
                          alt={speaker.name}
                          className="w-48 h-48 object-cover rounded-xl shadow-xl border-4 border-white mb-6"
                        />
                      </div>

                      {/* Right Column - Speaker Details */}
                      <div className="lg:col-span-9 p-4 sm:p-8 lg:p-12">
                        {/* Header */}
                        <div className="mb-8">
                          <h2 className="text-4xl font-bold text-gray-900 mb-2">
                            {speaker.name.includes('*') ? (
                              <>
                                {speaker.name.replace('*', '')}
                                <span className="text-orange-500 text-5xl font-black ml-1 leading-none align-middle">*</span>
                              </>
                            ) : (
                              speaker.name
                            )}
                          </h2>
                          <p className="text-xl text-[#F5A051] font-semibold mb-1">{speaker.title}</p>
                          <p className="text-lg text-gray-600 mb-4">{speaker.institution}</p>

                          {/* Contact Links */}
                          <div className="flex flex-wrap gap-4 mb-6">
                            {speaker.email && (
                              <a
                                href={`mailto:${speaker.email}`}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{speaker.email}</span>
                              </a>
                            )}
                            {speaker.facultyProfile && (
                              <a
                                href={speaker.facultyProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <BookOpen className="w-4 h-4" />
                                <span className="text-sm">Faculty Profile</span>
                              </a>
                            )}
                            {speaker.linkedIn && (
                              <a
                                href={speaker.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Globe className="w-4 h-4" />
                                <span className="text-sm">LinkedIn Profile</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Biography Section */}
                        <section className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-[#F5A051]" />
                            <h3 className="text-2xl font-bold text-gray-800">Biography</h3>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-justify">
                            {speaker.biography}
                          </p>
                        </section>

                        {/* Areas of Expertise */}
                        <section className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                            <Award className="w-5 h-5 text-[#F5A051]" />
                            <h3 className="text-2xl font-bold text-gray-800">Areas of Expertise</h3>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {speaker.expertise.map((area, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-200 transition-colors"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </section>

                        {/* Keynote Presentation */}
                        <section className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-l-4 border-[#F5A051]">
                          <div className="flex items-center gap-2 mb-4">
                            <Scroll className="w-5 h-5 text-[#F5A051]" />
                            <h3 className="text-2xl font-bold text-gray-800">Keynote Presentation</h3>
                          </div>
                          <h4 className="text-xl font-bold text-[#F5A051] mb-3">
                            {speaker.keynoteTitle}
                          </h4>
                          <p className="text-gray-700 leading-relaxed">
                            {speaker.keynoteDescription}
                          </p>
                        </section>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>

        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slideDown {
            animation: slideDown 0.5s ease-out;
          }
        `}</style>
      </div>
    </PageTransition>
  );
};

export default KeynoteSpeakers;
