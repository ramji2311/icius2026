"use client"

import { Calendar, MapPin, Users, Target, Compass, Globe, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import bali from "./images/bali.png"
import con from "./images/kpr/4.png"
import society from "./images/bali/society.png"
import isius from "./images/kpr/b2.png"
import Timeline from "./Timeline"
import RegistrationCountdown from "./RegistrationCountdown"
import kpr from "./images/bali/kpr.png"
import itb from "./images/new/itb.png"
import konkuk from "./images/new/konkuk.png"
import ud from "./images/new/ud.png"
// Sponsor logos - placeholder imports (replace with actual logo paths)
import im from "./images/bali/first.png" // TODO: Replace with Universitas Pelita Bangsa logo
import k from "./images/kpr/3.png"
import srmLogo from "./images/bali/k.png" // TODO: Replace with SRM University logo
const Home = () => {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 1400
      const currentWidth = window.innerWidth
      setScale(Math.min(1, currentWidth / baseWidth))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const baseHeight = 980

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <div
        className="relative text-white overflow-hidden flex justify-center items-center"
        style={{
          height: `${baseHeight * scale}px`,
          minHeight: `${baseHeight * scale}px`,
          transition: 'height 0.1s ease-out'
        }}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={im}
            alt="Conference Background"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>

        <div
          className="relative z-10 flex flex-col justify-center items-center text-center select-none"
          style={{
            width: '1400px',
            height: `${baseHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            flexShrink: 0,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* Top Row with 3 Columns: Left Logo, Headline Content, Right Logo */}
          <div className="flex flex-row justify-between items-start w-full px-12 mb-4">
            {/* Left Logo - ISIUS */}
            <div className="flex flex-col items-center justify-start w-[260px] pt-8">
              <img
                src={isius}
                alt="ISIUS Logo"
                className="h-32 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
                loading="eager"
              />
              <p className="text-sm text-slate-300 mt-3 font-semibold text-center max-w-[200px]">
                International Society of Intelligent Unmanned Systems
              </p>
              <p className="text-xs text-slate-400 mt-1">(ISIUS)</p>
            </div>

            {/* Central Headline & Details */}
            <div className="flex flex-col items-center justify-center flex-1 max-w-[800px] px-4">
              <h1 className="text-5xl font-bold mb-4 leading-tight text-white drop-shadow-md">
                22nd International Conference on Intelligent Unmanned Systems
              </h1>
              <h2 className="text-3xl font-semibold mb-1 text-[#F5A051] drop-shadow-md">
                (ICIUS 2026)
              </h2>
              <p className="text-xl mb-4 text-white/90 font-medium">
                Conference Date: 26–27 November 2026
              </p>

              <div className="flex flex-row justify-center items-center gap-4">
                <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <Calendar className="w-5 h-5 mr-2 text-[#F5A051]" />
                  <span className="text-sm font-medium">26–27 November 2026</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <MapPin className="w-5 h-5 mr-2 text-[#F5A051]" />
                  <span className="text-sm font-medium">Coimbatore, Tamil Nadu, India</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <Users className="w-5 h-5 mr-2 text-[#F5A051]" />
                  <span className="text-sm font-medium">Hybrid Conference (In-person + Virtual)</span>
                </div>
              </div>
            </div>

            {/* Right Logo - Society */}
            <div className="flex flex-col items-center justify-start w-[260px] pt-4">
              <img
                src={society}
                alt="Society CIS Logo"
                className="h-44 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
                loading="eager"
              />
              <p className="text-sm text-slate-300 mt-3 font-semibold text-center max-w-[200px]">
                Society for Cyber Intelligent Systems
              </p>
              <p className="text-xs text-slate-400 mt-1">Puducherry – India</p>
            </div>
          </div>

          {/* Organized By Section */}
          <div className="mb-4 px-2 max-w-4xl">
            <p className="text-lg text-slate-300 mb-2 font-semibold">Organized by</p>
            <p className="text-xl text-white mb-1 leading-relaxed font-bold">
              International Society of Intelligent Unmanned Systems
            </p>
            <p className="text-lg text-slate-300 mt-2 font-medium">
              in collaboration with Society for Cyber Intelligent Systems (Puducherry – India) &
            </p>
          </div>

          {/* Sponsor Logos Section */}
          <div className="mb-4 w-full max-w-4xl">
            <p className="text-sm text-slate-300 mb-4 font-semibold uppercase tracking-wider">
              in association with
            </p>
            <div className="flex flex-row justify-center items-center gap-12 px-6 py-2">
              {/* KPR */}
              <div className="flex flex-col items-center">
                <img
                  src={kpr}
                  alt="KPR Institute"
                  className="h-24 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                />
                <p className="text-xs text-white mt-3 text-center font-medium max-w-[160px]">
                  KPR Institute of Engineering and Technology
                </p>
                <p className="text-[10px] text-slate-300 mt-1">India</p>
              </div>

              {/* ITB */}
              <div className="flex flex-col items-center">
                <img
                  src={itb}
                  alt="Institut Teknologi Bandung"
                  className="h-24 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                />
                <p className="text-xs text-white mt-3 text-center font-medium max-w-[160px]">
                  Institut Teknologi Bandung
                </p>
                <p className="text-[10px] text-slate-300 mt-1">Indonesia</p>
              </div>

              {/* Konkuk */}
              <div className="flex flex-col items-center">
                <img
                  src={konkuk}
                  alt="Konkuk University"
                  className="h-28 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                />
                <p className="text-xs text-white mt-3 text-center font-medium max-w-[160px]">
                  Konkuk University
                </p>
                <p className="text-[10px] text-slate-300 mt-1">South Korea</p>
              </div>

              {/* UD */}
              <div className="flex flex-col items-center">
                <img
                  src={ud}
                  alt="University of Derby"
                  className="h-24 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                />
                <p className="text-xs text-white mt-3 text-center font-medium max-w-[160px]">
                  University of Derby
                </p>
                <p className="text-[10px] text-slate-300 mt-1">United Kingdom</p>
              </div>
            </div>
          </div>

          {/* Register Button */}
          <button className="group relative bg-[#F5A051] hover:bg-[#e08c3e] text-white font-bold py-4 px-10 rounded-full transition-all duration-500 text-lg shadow-xl shadow-[#F5A051]/30 hover:shadow-[#F5A051]/50 hover:-translate-y-1 overflow-hidden">
            <span className="relative z-10 flex items-center">
              REGISTER NOW
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Countdown Section */}
      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <RegistrationCountdown />
        </div>
      </section>

      <section id="conference-venue" className="py-8 sm:py-16 bg-white scroll-mt-20 relative">
        <div className="relative z-10 container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-10 text-[#F5A051]">Conference Venue</h2>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={k}
                  alt="KPR Institute - Conference Venue"
                  className="w-full object-cover h-36 sm:h-60 md:h-80 group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-xs sm:text-lg md:text-2xl font-bold mb-0.5 sm:mb-1">COIMBATORE</h3>
                  <p className="text-[#F5A051] text-[9px] sm:text-xs md:text-sm">KPR Institute of Engineering and Technology</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={con}
                  alt="Conference Venue"
                  className="w-full object-cover h-36 sm:h-60 md:h-80 group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-xs sm:text-lg md:text-2xl font-bold mb-0.5 sm:mb-1">Conference Venue</h3>
                  <p className="text-[#F5A051] text-[9px] sm:text-xs md:text-sm">Coimbatore, Tamil Nadu, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-16 h-16 bg-[#F5A051]/10 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-[#F5A051]" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 text-center">
              Vision & Mission of <span className="text-[#F5A051]">ISIUS</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="p-8 rounded-2xl bg-white shadow-lg border border-[#F5A051]/10 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#F5A051]/10 rounded-xl flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-[#F5A051]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Vision</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                To be a globally recognized leader in advancing the science, engineering, and responsible application
                of intelligent unmanned systems, fostering innovation that addresses real-world challenges and
                contributes to a more sustainable, secure, and connected society.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white shadow-lg border border-[#F5A051]/10 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#F5A051]/10 rounded-xl flex items-center justify-center mr-4">
                  <Compass className="w-6 h-6 text-[#F5A051]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Mission</h3>
              </div>
              <ul className="text-slate-600 leading-relaxed space-y-3 text-sm">
                <li><strong>Advance Research and Innovation</strong> – Promote excellence in research, development, and innovation in intelligent unmanned systems through global collaboration and knowledge exchange.</li>
                <li><strong>Foster Interdisciplinary Collaboration</strong> – Build strong bridges between academia, industry, and government to ensure that unmanned systems research is relevant, impactful, and responsive to societal needs.</li>
                <li><strong>Support Education and Talent Development</strong> – Empower the next generation of engineers and scientists through conferences, workshops, training programs, and educational outreach.</li>
                <li><strong>Encourage Responsible and Ethical Application</strong> – Advocate for the ethical, sustainable, and inclusive deployment of unmanned systems that align with societal values and global development goals.</li>
                <li><strong>Facilitate Technology Transfer and Industry Engagement</strong> – Act as a catalyst for translating academic research into real-world applications by connecting university laboratories with industry demands and opportunities.</li>
                <li><strong>Promote Global Standards and Thought Leadership</strong> – Contribute to shaping international discourse, policy, and best practices in unmanned systems through active engagement with global institutions and scientific communities.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-16 bg-white text-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-16 h-16 bg-[#F5A051]/10 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-[#F5A051]" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
              SCOPE OF THE <span className="text-[#F5A051]">CONFERENCE</span>
            </h2>
          </div>

          <div className="bg-gray-50 p-8 rounded-2xl border border-[#F5A051]/20">
            <p className="text-gray-700 leading-relaxed mb-4">
              International Conference on Intelligent Unmanned Systems (ICIUS 2026) is
              designed to integrate perspectives from Intelligent Systems, Robotics, Unmanned Vehicles, and NextGen Technologies
              to develop holistic solutions for global issues.
            </p>

            <p className="text-gray-700 leading-relaxed mb-4">
              Also in a rapidly evolving digital-first business world, global organizations are highly influenced by
              next generation technologies. Future technological advancements, developments, and innovations enabled by
              the internet, software, and services are known as next generation technologies. These include advanced
              robotics, AI, IoT, RPA, quantum computing, 3-D printing, 5G wireless networks, virtual reality and
              augmented reality, and blockchain.
            </p>

            <p className="text-gray-700 leading-relaxed">
              ICIUS 2026 will be a central hub for esteemed Research experts worldwide and can anticipate unparalleled
              opportunities to network, gain invaluable insights, showcase their hidden potential, present significant
              research findings, receive due credit and recognition for their contributions.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <Timeline />

      <footer className="py-8 bg-white border-t border-gray-200 text-gray-600 text-center">
        <p>© 2026 ICIUS. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Home
