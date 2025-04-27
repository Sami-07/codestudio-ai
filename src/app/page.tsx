"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { 
  Code, 
  FileCode, 
  Globe, 
  Terminal, 
  Layers, 
  Cpu, 
  GitBranch, 
  Package, 
  Cloud, 
  Server, 
  Database, 
  ArrowRight, 
  ChevronRight, 
  Github, 
  ExternalLink,
  X, 
  Maximize,
  Search,
  Plus,
  Minus,
  Info,
  FileText,
  Home as HomeIcon
} from "lucide-react";

// Fade-in animation variant
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

// Staggered animation for list items
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

// Animation variants for icons
const iconAnimation = {
  hover: {
    rotate: [0, -10, 10, -10, 0],
    scale: 1.1,
    transition: { duration: 0.5 }
  },
  tap: { scale: 0.9 }
};

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [diagramModal, setDiagramModal] = useState(false);
  
  // Refs for scrolling to sections
  const demoRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  // Handle scrolling to sections
  const scrollToSection = (sectionId: string) => {
    let targetRef;
    
    switch(sectionId) {
      case "demo":
        targetRef = demoRef;
        break;
      case "features":
        targetRef = featuresRef;
        break;
      default:
        return;
    }
    
    if (targetRef && targetRef.current) {
      window.scrollTo({
        top: targetRef.current.offsetTop - 80, // Offset for header/padding
        behavior: "smooth"
      });
    }
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    
    // Add mouse move event listener
    window.addEventListener("mousemove", handleMouseMove);
    
    // Handle hash links on page load
    const handleHashOnLoad = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setTimeout(() => {
          scrollToSection(hash);
        }, 100);
      }
    };
    
    // Handle internal link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const sectionId = link.getAttribute('href')?.replace('#', '');
        if (sectionId) {
          scrollToSection(sectionId);
          // Update URL without causing a refresh
          window.history.pushState(null, '', `#${sectionId}`);
        }
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    handleHashOnLoad();
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);
  
  // Calculate the position for the blob effect
  const blobX = mousePosition.x / 50;
  const blobY = mousePosition.y / 50;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15),transparent_50%)]"></div>
          
          {/* Animated background effects */}
          <motion.div 
            className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 blur-3xl"
            animate={{
              x: blobX,
              y: blobY,
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div 
            className="absolute top-[60%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-l from-blue-500/10 to-violet-500/10 blur-3xl"
            animate={{
              x: -blobX,
              y: -blobY,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          
          {/* Subtle floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10"
                initial={{
                  x: Math.random() * 100 + "%",
                  y: Math.random() * 100 + "%",
                  scale: Math.random() * 0.5 + 0.5,
                  opacity: Math.random() * 0.5 + 0.2,
                }}
                animate={{
                  y: ["-10%", "110%"],
                }}
                transition={{
                  duration: Math.random() * 20 + 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="flex flex-col items-center text-center"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8 }}
            >
              <Image src="/studio-logo.svg" alt="CodeStudio AI Logo" width={80} height={80} className="mb-6" />
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 mb-6"
              variants={fadeInUp}
            >
              CodeStudio AI
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-slate-300 max-w-3xl mb-8"
              variants={fadeInUp}
            >
              AI-Powered Website Builder with 1-Click deployment
            </motion.p>
            <motion.div 
              className="flex flex-wrap gap-4 justify-center"
              variants={fadeInUp}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link href="#demo" className="flex items-center px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                  <span>View Demo</span>
                  <motion.div whileHover="hover" variants={iconAnimation} className="inline-block">
                    <ExternalLink size={16} className="ml-2" />
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link href="/create" className="flex items-center px-8 py-3 rounded-full bg-slate-800 border border-slate-700 font-medium hover:bg-slate-700 transition-all duration-300">
                  <span>Get Started</span>
                  <motion.div whileHover="hover" variants={iconAnimation} className="inline-block">
                    <ArrowRight size={16} className="ml-2" />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Demo Video Section */}
      <motion.section 
        className="py-20 bg-slate-800/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        ref={demoRef}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See CodeStudio AI in Action</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Watch how quickly you can create and deploy a complete website using natural language.
            </p>
          </div>
          <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10">
            <div className="relative bg-slate-900 pt-[56.25%]">
              <div className="absolute inset-0" id="demo">
               <video controls src="CodeStudioAI-Demo.mp4" autoPlay muted loop className="w-full h-full object-cover"></video>
              </div>
              
              <div className="absolute bottom-4 right-4 z-10">
                <a 
                  href="https://github.com/Sami-07/codestudio-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white bg-slate-900/80 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20" id="features" ref={featuresRef}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              CodeStudio AI makes website creation and deployment simple with powerful features.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300"
              variants={fadeInUp}
            >
              <div className="bg-blue-500/20 p-3 w-fit rounded-lg mb-5">
                <motion.div whileHover="hover" whileTap="tap" variants={iconAnimation}>
                  <Code size={24} className="text-blue-400" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Website Generation</h3>
              <p className="text-slate-300 mb-4">Create complete websites using natural language prompts like "Build me a portfolio website".</p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> Real-time preview
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> Interactive editing
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> Customizable design
                </li>
              </ul>
            </motion.div>

            <motion.div 
              className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300"
              variants={fadeInUp}
            >
              <div className="bg-blue-500/20 p-3 w-fit rounded-lg mb-5">
                <motion.div whileHover="hover" whileTap="tap" variants={iconAnimation}>
                  <FileCode size={24} className="text-blue-400" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold mb-3">Code Management</h3>
              <p className="text-slate-300 mb-4">View and access the complete source code of the generated website with natural language modification.</p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> View full source code
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> Natural language edits
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> Real-time updates
                </li>
              </ul>
            </motion.div>

            <motion.div 
              className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300"
              variants={fadeInUp}
            >
              <div className="bg-blue-500/20 p-3 w-fit rounded-lg mb-5">
                <motion.div whileHover="hover" whileTap="tap" variants={iconAnimation}>
                  <Globe size={24} className="text-blue-400" />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold mb-3">1-Click Deployment</h3>
              <p className="text-slate-300 mb-4">Deploy your website with a single click, making it publicly accessible instantly.</p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> Automated build process
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> S3 secure hosting
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2"><ChevronRight size={16} /></span> Custom domain support
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Architecture Section */}
      <motion.section 
        className="py-20 bg-slate-800/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
              <span className="relative z-10">Technical Architecture</span>
              <div className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-blue-500/30 to-violet-500/30 rounded-full -z-10 transform -skew-x-12"></div>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              A robust system designed for performance, security, and scalability.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-slate-700/50"
              whileHover={{ boxShadow: "0 20px 25px -5px rgb(59 130 246 / 0.2)" }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="relative cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => setDiagramModal(true)}
              >
                <div className="rounded-lg overflow-hidden border border-slate-700/70">
                  <motion.div 
                    className="relative pt-[56.25%]"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="absolute inset-0">
                      <img
                        src="/codestudioai-architecture.png"
                        alt="Architecture Diagram"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-blue-500/80 px-4 py-2 rounded-full text-white text-sm font-medium flex items-center">
                        <span>Click to enlarge</span>
                        <Maximize size={14} className="ml-1" />
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="mt-4 text-center text-sm text-slate-400">
                  <p>CodeStudio AI's comprehensive architecture illustrates our full deployment and integration workflow.</p>
                </div>
              </motion.div>
            </motion.div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg border border-slate-700/50 shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg mr-3">
                    <motion.div whileHover="hover" whileTap="tap" variants={iconAnimation}>
                      <GitBranch size={20} className="text-blue-400" />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold">Deployment Pipeline</h3>
                </div>
                <ol className="space-y-3 text-slate-300">
                  <motion.li 
                    className="flex p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold mr-3">1</span>
                    <span>Code Upload: Files stored in AWS S3 with unique IDs</span>
                  </motion.li>
                  <motion.li 
                    className="flex p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold mr-3">2</span>
                    <span>Build Process: AWS ECS container builds in isolation</span>
                  </motion.li>
                  <motion.li 
                    className="flex p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold mr-3">3</span>
                    <span>Website Hosting: S3 reverse proxy with custom domain</span>
                  </motion.li>
                </ol>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg border border-slate-700/50 shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-violet-500/20 p-3 rounded-lg mr-3">
                    <motion.div whileHover="hover" whileTap="tap" variants={iconAnimation}>
                      <Layers size={20} className="text-violet-400" />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold">Tech Stack</h3>
                </div>
                <ul className="space-y-3 text-slate-300">
                  <motion.li 
                    className="flex items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <span className="text-violet-400 mr-3">
                      <ChevronRight size={16} />
                    </span> 
                    Frontend: Next.js, Tailwind CSS, Shadcn UI
                  </motion.li>
                  <motion.li 
                    className="flex items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <span className="text-violet-400 mr-3">
                      <ChevronRight size={16} />
                    </span>
                    Live Preview: Web Container
                  </motion.li>
                  <motion.li 
                    className="flex items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <span className="text-violet-400 mr-3">
                      <ChevronRight size={16} />
                    </span>
                    Backend: API endpoints for code generation
                  </motion.li>
                  <motion.li 
                    className="flex items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <span className="text-violet-400 mr-3">
                      <ChevronRight size={16} />
                    </span>
                    Storage: AWS S3 for code and assets
                  </motion.li>
                  <motion.li 
                    className="flex items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <span className="text-violet-400 mr-3">
                      <ChevronRight size={16} />
                    </span>
                    Build: AWS ECS for isolated environments
                  </motion.li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Diagram Modal */}
      {diagramModal && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-8"
          onClick={() => setDiagramModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-6xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src="/codestudioai-architecture.png" 
              alt="Architecture Diagram Full View" 
              className="w-full h-full object-contain"
            />
            <button 
              onClick={() => setDiagramModal(false)}
              className="absolute -top-4 -right-4 bg-slate-800 text-white w-10 h-10 rounded-full flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Getting Started Section */}
      <motion.section 
        className="py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Getting Started</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Follow these simple steps to create and deploy your website.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <motion.div 
              className="space-y-6"
              variants={staggerContainer}
            >
              {[
                "Enter your website requirements using natural language",
                "Review the generated website in the preview container",
                "Make any necessary modifications using prompts",
                "Deploy your website with a single click",
                "Access your live website via the provided URL"
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center bg-slate-800/50 p-5 rounded-lg border border-slate-700"
                  variants={fadeInUp}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold mr-4">
                    {index + 1}
                  </div>
                  <p className="text-slate-300">{step}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div 
              className="mt-12 text-center"
              variants={fadeInUp}
            >
              <Link 
                href="/create" 
                className="px-10 py-4 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 font-medium text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Start Building Now
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contributors Section */}
      <motion.section 
        className="py-20 bg-slate-800/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet the Team</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              The brilliant minds behind CodeStudio AI.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <motion.div 
              className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center"
              variants={fadeInUp}
              onClick={() => window.open("https://github.com/Sami-07", "_blank")}
            >
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">SA</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Shaikh Abdul Sami</h3>
              <Link 
                href="https://github.com/Sami-07"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center"
              >
                @Sami-07
                <motion.div whileHover="hover" variants={iconAnimation} className="inline-block">
                  <Github className="ml-1 w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>
            <motion.div 
              className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center"
              variants={fadeInUp}
              onClick={() => window.open("https://github.com/AdityaSaxena17", "_blank")}
            >
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">AS</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Aditya Saxena</h3>
              <Link 
                href="https://github.com/AdityaSaxena17"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center"
              >
                @AdityaSaxena17
                <motion.div whileHover="hover" variants={iconAnimation} className="inline-block">
                  <Github className="ml-1 w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image src="/studio-logo.svg" alt="CodeStudio AI Logo" width={40} height={40} className="mr-3" />
              <span className="text-xl font-bold">CodeStudio AI</span>
            </div>
            <div className="flex space-x-6">
           
             
              <Link href="https://github.com/Sami-07/codestudio-ai" target="_blank" className="text-slate-300 hover:text-white transition-colors flex items-center">
                <Github size={14} className="mr-1" />
                <span>GitHub</span>
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} CodeStudio AI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
