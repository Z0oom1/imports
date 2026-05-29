"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  ArrowUpRight, 
  ShieldCheck, 
  Wrench, 
  ArrowsHorizontal, 
  WhatsappLogo, 
  MapPin, 
  Clock, 
  Sparkle,
  Cpu,
  DeviceMobile,
  CheckCircle
} from "@phosphor-icons/react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroScreenRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  
  // Pinned camera-scroll section references
  const pinSectionRef = useRef<HTMLDivElement>(null);
  const cameraWrapperRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Explicitly guarantee video starts playing and looping immediately on load
    const video = heroVideoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      
      const playVideo = () => {
        video.play().catch((err) => {
          console.log("Auto-playing background video was prevented initially by browser:", err);
        });
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.addEventListener("canplay", playVideo);
      }

      // Interactive fallback to play video on first click, touch, or scroll (bypass Low Power Mode restrictions)
      const forcePlay = () => {
        video.play().catch(() => {});
        document.removeEventListener("click", forcePlay);
        document.removeEventListener("touchstart", forcePlay);
        window.removeEventListener("scroll", forcePlay);
      };

      document.addEventListener("click", forcePlay);
      document.addEventListener("touchstart", forcePlay);
      window.addEventListener("scroll", forcePlay);
    }

    // Programmatically lock Lenis scrolling on load for cinematic intro
    let lenisStopped = false;
    const stopLenis = () => {
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.stop();
        lenisStopped = true;
      }
    };
    stopLenis();
    
    const stopPoller = setInterval(() => {
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.stop();
        clearInterval(stopPoller);
      }
    }, 20);

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context((self) => {
      if (prefersReducedMotion) {
        gsap.set(".nav-element", { opacity: 1, y: 0 });
        gsap.set(".hero-reveal-text", { opacity: 1, y: 0 });
        gsap.set(heroScreenRef.current, { opacity: 1, scale: 1, y: 0 });
        gsap.set(scrollIndicatorRef.current, { opacity: 1, y: 0 });
        gsap.set(heroVideoRef.current, { opacity: 0.45 });
        clearInterval(stopPoller);
        const lenis = (window as any).lenis;
        if (lenis) lenis.start();
        return;
      }

      // --- HERO REVEAL ANIMATIONS ---
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      
      // Animate background video to high visibility
      heroTl.fromTo(
        heroVideoRef.current,
        { opacity: 0 },
        { opacity: 0.45, duration: 1.8 },
        0
      );

      // Re-enable Lenis scroll exactly at 3.5s mark when animation triggers
      heroTl.call(() => {
        clearInterval(stopPoller);
        const lenis = (window as any).lenis;
        if (lenis) lenis.start();
      }, [], 3.5);

      // Staggered slow reveal of navigation elements at 3.5s
      heroTl.fromTo(
        ".nav-element",
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.8 },
        3.5
      );

      // Reveal Hero text block slowly from below
      heroTl.fromTo(
        ".hero-reveal-text",
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 2.0, stagger: 0.18 },
        3.6
      );

      // Reveal widescreen video screen container slowly from below
      heroTl.fromTo(
        heroScreenRef.current,
        { scale: 0.9, opacity: 0, rotateX: 10, y: 80 },
        { scale: 1, opacity: 1, rotateX: 0, y: 0, duration: 2.2 },
        3.9
      );

      // Animate scroll indicator entry
      heroTl.fromTo(
        scrollIndicatorRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.4 },
        4.3
      );

      // --- SCROLL INDICATOR FADE OUT ---
      gsap.to(scrollIndicatorRef.current, {
        opacity: 0,
        y: 20,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom 70%",
          scrub: true,
        }
      });

      // --- HERO MOUSE PARALLAX TILT ---
      const heroScreen = heroScreenRef.current;
      const handleHeroMouseMove = (e: MouseEvent) => {
        if (!heroScreen) return;
        const rect = heroScreen.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(heroScreen, {
          rotateY: x * 0.025,
          rotateX: -y * 0.025,
          x: x * 0.05,
          y: y * 0.05,
          duration: 0.8,
          ease: "power3.out"
        });
      };
      
      const handleHeroMouseLeave = () => {
        if (!heroScreen) return;
        gsap.to(heroScreen, {
          rotateY: 0,
          rotateX: 0,
          x: 0,
          y: 0,
          duration: 1.2,
          ease: "power3.out"
        });
      };

      const heroElement = heroRef.current;
      if (heroElement) {
        heroElement.addEventListener("mousemove", handleHeroMouseMove);
        heroElement.addEventListener("mouseleave", handleHeroMouseLeave);
      }

      // --- CINEMATIC "CAMERA LOOK" PIN SCROLL SECTION (ScrollTrigger Pin & 3D Pan) ---
      const pinContainer = pinSectionRef.current;
      const cameraWrapper = cameraWrapperRef.current;

      if (pinContainer && cameraWrapper) {
        // Prepare initial layout and rotations of 3D slides
        gsap.set(panel1Ref.current, { zIndex: 10, opacity: 1, scale: 1 });
        gsap.set(panel2Ref.current, { zIndex: 5, opacity: 0, xPercent: 140, rotateY: -45, scale: 0.8, rotateZ: 5 });
        gsap.set(panel3Ref.current, { zIndex: 1, opacity: 0, xPercent: 280, rotateY: -90, scale: 0.6, rotateZ: 10 });

        const cameraTl = gsap.timeline({
          scrollTrigger: {
            trigger: pinContainer,
            start: "top top",
            end: "+=3600", 
            pin: true,
            scrub: 1.4,
            invalidateOnRefresh: true,
          }
        });

        // 1. Transition Panel 1 -> Panel 2
        cameraTl.to(cameraWrapper, {
          rotateY: 20,
          rotateX: 5,
          scale: 0.9,
          duration: 1.0,
          ease: "power3.inOut"
        }, "step1");

        cameraTl.to(panel1Ref.current, {
          xPercent: -140,
          rotateY: 45,
          rotateZ: -5,
          scale: 0.8,
          opacity: 0,
          duration: 1.0,
          ease: "power3.inOut"
        }, "step1");

        cameraTl.to(panel2Ref.current, {
          xPercent: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
          opacity: 1,
          duration: 1.0,
          ease: "power3.inOut"
        }, "step1");

        // Panel 2 sequence entrance
        cameraTl.fromTo(
          ".panel2-item",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" },
          "step1+=0.2"
        );

        // 2. Transition Panel 2 -> Panel 3
        cameraTl.to(cameraWrapper, {
          rotateY: -20,
          rotateX: -5,
          scale: 0.95,
          duration: 1.0,
          ease: "power3.inOut"
        }, "step2");

        cameraTl.to(panel2Ref.current, {
          xPercent: -140,
          rotateY: 45,
          rotateZ: -5,
          scale: 0.8,
          opacity: 0,
          duration: 1.0,
          ease: "power3.inOut"
        }, "step2");

        cameraTl.to(panel3Ref.current, {
          xPercent: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
          opacity: 1,
          duration: 1.0,
          ease: "power3.inOut"
        }, "step2");

        // Panel 3 sequence entrance
        cameraTl.fromTo(
          ".panel3-item",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" },
          "step2+=0.2"
        );

        // 3. Dynamic Zoom & Camera exit
        cameraTl.to(cameraWrapper, {
          scale: 0.75,
          opacity: 0,
          rotateX: -15,
          duration: 0.8,
          ease: "power3.in"
        }, "exit");
      }

      // --- STORY & SERVICE SECTIONS REVEAL ---
      const elementsToReveal = gsap.utils.toArray<HTMLElement>(".scroll-reveal-block");
      elementsToReveal.forEach((block) => {
        gsap.fromTo(
          block,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: "power3.out",
            scrollTrigger: {
              trigger: block,
              start: "top 82%",
              toggleActions: "play none none none",
            }
          }
        );
      });

    }, [pinSectionRef, heroRef]);

    return () => {
      clearInterval(stopPoller);
      const lenis = (window as any).lenis;
      if (lenis) lenis.start();
      ctx.revert();
    };
  }, []);

  const handleWhatsAppRedirect = () => {
    window.open("https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20dispositivos%20e%20serviços%20da%20IMPORTS.", "_blank");
  };

  return (
    <div className="relative w-full overflow-hidden textured-bg">
      {/* Ambient static visual spotlights */}
      <div className="spotlight top-[10%] left-[-10%]" />
      <div className="spotlight-blue top-[40%] right-[-10%]" />
      <div className="spotlight top-[70%] left-[20%]" />
      
      {/* ═══ 1. FLOATING CAPSULE NAVIGATION ═══ */}
      <header 
        style={{ opacity: 0 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl glass-panel rounded-full px-8 py-3.5 flex items-center justify-between z-50 nav-element animate-glow"
      >
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo-imports.png" 
            alt="IMPORTS Logo" 
            width={120} 
            height={32} 
            className="h-7 w-auto object-contain brightness-100 contrast-105"
            loading="eager"
          />
        </div>
        
        <nav className="hidden md:flex items-center gap-10">
          <a href="#experiencia" className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted hover:text-foreground transition-colors duration-500">
            Experiência
          </a>
          <a href="#sobre" className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted hover:text-foreground transition-colors duration-500">
            Assinatura
          </a>
          <a href="#servicos" className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted hover:text-foreground transition-colors duration-500">
            Serviços
          </a>
        </nav>

        <button 
          onClick={handleWhatsAppRedirect}
          className="btn-primary !rounded-full !py-2.5 !px-5 !text-[9px]"
        >
          Entrar em Contato
        </button>
      </header>


      {/* ═══ 2. HERO SECTION ═══ */}
      <section 
        ref={heroRef} 
        className="relative flex min-h-[100dvh] w-full flex-col justify-between section-padding pt-36 pb-20 md:pt-44 md:pb-24 z-10 overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
          <video
            ref={heroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={(e) => {
              const el = e.currentTarget;
              el.muted = true;
              el.play().catch(() => {});
            }}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              el.muted = true;
              el.play().catch(() => {});
            }}
            style={{ opacity: 0 }}
            className="w-full h-full object-cover scale-105 will-change-[opacity,transform] brightness-[1.03] contrast-[1.04] saturate-[1.02]"
          >
            <source src="/background.mp4" type="video/mp4" />
          </video>
          {/* Softened gradient backdrop to maximize video visibility while maintaining premium typography readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-[#030303]/98" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col lg:grid lg:grid-cols-12 lg:gap-24 items-center my-auto gap-16 relative z-10">
          
          {/* Left Column: Monumental typography */}
          <div className="lg:col-span-7 flex flex-col items-start text-left w-full">
            <div className="overflow-hidden mb-8">
              <div className="hero-reveal-text premium-badge" style={{ opacity: 0 }}>
                <Sparkle className="h-3.5 w-3.5 animate-pulse text-white/80" />
                Excelência Premium Apple
              </div>
            </div>

            <div className="overflow-hidden">
              <h1 className="hero-reveal-text text-4xl font-black tracking-tighter leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-7xl" style={{ opacity: 0 }}>
                ECOSSISTEMA<br />APPLE<br />
                <span className="italic font-light text-white/35 tracking-normal lowercase block mt-3">
                  com olhar de cinema.
                </span>
              </h1>
            </div>

            <div className="overflow-hidden mt-12">
              <p className="hero-reveal-text text-matte-grey text-sm md:text-base max-w-[42ch] leading-[1.8]" style={{ opacity: 0 }}>
                Adquira e venda iPhones selecionados. Assistência técnica especializada e reparos avançados assinados por Rafael Vinicius Rodrigues.
              </p>
            </div>

            <div className="overflow-hidden mt-14">
              <div className="hero-reveal-text flex items-center gap-6" style={{ opacity: 0 }}>
                <button 
                  onClick={handleWhatsAppRedirect}
                  className="btn-primary scale-active"
                >
                  Ver Catálogo
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                
                <a 
                  href="#experiencia"
                  className="btn-secondary"
                >
                  Explorar
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Cinematic Screen */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div 
              ref={heroScreenRef}
              className="relative w-full aspect-video md:aspect-[4/3] max-w-md glass-panel p-3 overflow-hidden will-change-transform scale-active group shadow-[0_35px_120px_rgba(0,0,0,0.95)]"
              style={{ transformStyle: "preserve-3d", opacity: 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent z-10 pointer-events-none rounded-[var(--radius-md)]" />
              
              <img
                src="/premium_device.png"
                alt="Premium Apple Curated Device"
                className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-[1.6s] will-change-transform rounded-[10px]"
                loading="eager"
              />

              {/* Micro details on the floating video overlay */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 backdrop-blur-lg rounded-full border border-white/5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-mono tracking-[0.2em] text-white/80 uppercase">Inspeção Completa // Laudo 100%</span>
              </div>
              
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 px-3 py-1.5 border border-white/5 backdrop-blur-lg rounded-full">
                <Cpu className="h-3 w-3 text-white" />
                <span className="text-[8px] font-mono tracking-widest text-white/80 uppercase">A18 Pro Engine</span>
              </div>
            </div>
          </div>

        </div>

        {/* Elegant Scroll Indicator */}
        <div 
          ref={scrollIndicatorRef}
          className="mx-auto flex flex-col items-center gap-3.5 cursor-pointer will-change-transform z-10 scroll-indicator mt-16"
          style={{ opacity: 0 }}
          onClick={() => {
            const expSection = document.getElementById("experiencia");
            if (expSection) expSection.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className="relative h-10 w-[1px] bg-white/10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-white/80 scroll-pulse" />
          </div>
        </div>
      </section>


      {/* ═══ 3. PINNED CAMERA-SCROLL SECTION ═══ */}
      <section 
        id="experiencia"
        ref={pinSectionRef} 
        className="relative h-[400vh] w-full bg-[#030303] overflow-hidden"
      >
        <div className="section-divider" />
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden">
          
          {/* Camera Flight Environment with 3D Depth */}
          <div 
            ref={cameraWrapperRef}
            className="camera-wrapper relative flex h-full w-full items-center justify-center will-change-transform"
            style={{ perspective: "1500px", transformStyle: "preserve-3d", padding: "clamp(1.5rem, 6vw, 4rem)" }}
          >
            
            {/* PANEL 1: BUY & SELL */}
            <div 
              ref={panel1Ref}
              className="absolute flex h-full w-full items-center justify-center will-change-transform"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="glass-panel w-full max-w-6xl bg-[#070708]/85 flex flex-col md:grid md:grid-cols-12 gap-0 relative overflow-hidden">
                <div className="md:col-span-7 flex flex-col justify-between z-10 relative h-full p-8 md:p-16 lg:p-20">
                  <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[0.95] text-white mt-2">
                      COMPRA E VENDA DE DISPOSITIVOS PREMIUM.
                    </h2>
                    <p className="mt-8 text-xs sm:text-sm text-matte-grey leading-[1.8] max-w-[45ch]">
                      Adquira seu novo iPhone em uma experiência sob medida. Cada aparelho em nosso catálogo passa por uma rigorosa avaliação de hardware, garantindo procedência absoluta, baterias calibradas e garantia estendida.
                    </p>
                  </div>
                  <div className="mt-10 flex flex-wrap gap-8 border-t border-white/5 pt-8">
                    <div className="flex items-center gap-3">
                      <div className="feature-icon">
                        <ShieldCheck className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-mono text-white/95">Garantia Integrada</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="feature-icon">
                        <ArrowsHorizontal className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-mono text-white/95">Troca Imediata</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 relative w-full min-h-[240px] md:min-h-0 border-t md:border-t-0 md:border-l border-white/5 flex flex-col justify-between p-10 md:p-14 z-10 overflow-hidden group">
                  <img 
                    src="/panel_buy_sell.png"
                    alt="Curadoria Imports de iPhones"
                    className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-[1.6s] will-change-transform z-0"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30 z-10 pointer-events-none" />
                  
                  <div className="relative z-20">
                    <DeviceMobile className="h-7 w-7 text-white/40 group-hover:text-white/80 transition-colors duration-500" />
                  </div>
                  <div className="relative z-20 mt-auto">
                    <h3 className="text-base font-bold tracking-tight text-white uppercase">Curadoria</h3>
                    <p className="text-[11px] text-white/70 mt-4 leading-[1.7] max-w-[24ch]">
                      iPhones revisados por especialistas com histórico de uso limpo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 2: ASSISTÊNCIA E REPAROS */}
            <div 
              ref={panel2Ref}
              className="absolute flex h-full w-full items-center justify-center will-change-transform"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="glass-panel w-full max-w-6xl bg-[#070708]/85 flex flex-col md:grid md:grid-cols-12 gap-0 relative overflow-hidden">
                {/* Visual card on left (order-2 on mobile, order-1 on desktop for flip) */}
                <div className="panel2-item md:col-span-5 relative w-full min-h-[240px] md:min-h-0 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between p-10 md:p-14 z-10 overflow-hidden group order-2 md:order-1">
                  <img 
                    src="/panel_repairs.png"
                    alt="Laboratório de Reparos IMPORTS"
                    className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-[1.6s] will-change-transform z-0"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30 z-10 pointer-events-none" />
                  
                  <div className="relative z-20">
                    <Cpu className="h-7 w-7 text-white/40 group-hover:text-white/80 transition-colors duration-500" />
                  </div>
                  <div className="relative z-20 mt-auto">
                    <h3 className="text-base font-bold tracking-tight text-white uppercase">Laboratório</h3>
                    <p className="text-[11px] text-white/70 mt-4 leading-[1.7] max-w-[24ch]">
                      Maquinário microscópico e solda de alta frequência para integridade eletrônica.
                    </p>
                  </div>
                </div>

                {/* Text details on right (order-1 on mobile, order-2 on desktop) */}
                <div className="md:col-span-7 flex flex-col justify-between z-10 relative h-full p-8 md:p-16 lg:p-20 order-1 md:order-2">
                  <div>
                    <h2 className="panel2-item text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[0.95] text-white mt-2">
                      RECONSTRUÇÃO E REPAROS AVANÇADOS.
                    </h2>
                    <p className="panel2-item mt-8 text-xs sm:text-sm text-matte-grey leading-[1.8] max-w-[45ch]">
                      Restauração técnica completa para toda a linha Apple. Nosso laboratório realiza intervenções complexas em placas eletrônicas, recuperação de displays, trocas de baterias e reparo de periféricos com precisão cirúrgica.
                    </p>
                  </div>
                  <div className="panel2-item mt-10 flex flex-wrap gap-8 border-t border-white/5 pt-8">
                    <div className="flex items-center gap-3">
                      <div className="feature-icon">
                        <Wrench className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-mono text-white/95">Hardware Original</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="feature-icon">
                        <Cpu className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-mono text-white/95">Micro-Reparos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 3: RAFAEL VINICIUS - A ASSINATURA */}
            <div 
              ref={panel3Ref}
              className="absolute flex h-full w-full items-center justify-center will-change-transform"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="glass-panel w-full max-w-6xl bg-[#070708]/85 flex flex-col md:grid md:grid-cols-12 gap-0 relative overflow-hidden">
                <div className="md:col-span-7 flex flex-col justify-between z-10 relative h-full p-8 md:p-16 lg:p-20">
                  <div>
                    <h2 className="panel3-item text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[0.95] text-white mt-2">
                      COMPROMISSO E SELO DE QUALIDADE.
                    </h2>
                    <p className="panel3-item mt-8 text-xs sm:text-sm text-matte-grey leading-[1.8] max-w-[45ch]">
                      A credibilidade da IMPORTS assenta-se no compromisso de seu fundador, Rafael Vinicius Rodrigues. Cada dispositivo comprado, vendido ou reparado passa por uma minuciosa supervisão para carimbar nosso alto padrão.
                    </p>
                  </div>
                  <div className="panel3-item mt-12">
                    <button 
                      onClick={handleWhatsAppRedirect}
                      className="btn-primary scale-active"
                    >
                      Entrar em Contato
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="panel3-item md:col-span-5 relative w-full min-h-[240px] md:min-h-0 border-t md:border-t-0 md:border-l border-white/5 flex flex-col justify-between p-10 md:p-14 z-10 overflow-hidden group">
                  <img 
                    src="/panel_quality.png"
                    alt="Selo Imports de Credibilidade"
                    className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-[1.6s] will-change-transform z-0"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30 z-10 pointer-events-none" />

                  <div className="relative z-20">
                    <Sparkle className="h-7 w-7 text-white/40 group-hover:text-white/80 transition-colors duration-500" />
                  </div>
                  <div className="relative z-20 mt-auto">
                    <h3 className="text-base font-bold tracking-tight text-white uppercase">Selo Imports</h3>
                    <p className="text-[11px] text-white/70 mt-4 leading-[1.7] max-w-[24ch]">
                      Garantia integral assinada pessoalmente para sua tranquilidade total.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ═══ 4. EDITORIAL STORY — RAFAEL VINICIUS ═══ */}
      <section 
        id="sobre"
        className="relative w-full bg-[#030303] section-padding overflow-hidden"
      >
        <div className="section-divider absolute top-0 left-0" />

        {/* Giant horizontal backdrop watermark */}
        <div className="text-stroke text-[14rem] md:text-[24rem] font-black absolute bottom-0 right-[-10%] opacity-[0.015] select-none pointer-events-none uppercase tracking-widest leading-none z-0">
          IMPORTS
        </div>

        <div className="mx-auto max-w-6xl relative z-10 w-full">
          <div className="scroll-reveal-block grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start w-full">
            
            {/* Left side Quote */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full w-full">
              <div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.88] text-white mt-2">
                  TRANSPARÊNCIA<br />E PRECISÃO<br />CIENTÍFICA.
                </h2>
                <p className="mt-12 text-matte-grey text-sm md:text-base leading-[1.8] max-w-[45ch]">
                  O mercado de tecnologia exige responsabilidade. Na IMPORTS, abolimos a incerteza. Entregamos um laudo técnico completo e honesto de 35 pontos de inspeção para cada aparelho, criando parcerias sólidas de longo prazo.
                </p>
              </div>
              
              <div className="mt-16 p-10 md:p-12 glass-panel relative w-full">
                <div className="absolute top-0 left-6 -translate-y-1/2 bg-[#0a0a0a] px-3 py-1 rounded-full">
                  <Sparkle className="h-4 w-4 text-white/80" />
                </div>
                <blockquote className="text-base md:text-lg italic font-medium text-white/90 leading-[1.8]">
                  &ldquo;Estabelecemos um modelo operacional em que a verdade técnica e a precisão do diagnóstico precedem qualquer transação comercial.&rdquo;
                </blockquote>
                <cite className="text-[10px] uppercase tracking-[0.25em] font-mono text-white/40 not-italic block mt-8">
                  Rafael Vinicius Rodrigues, Diretor IMPORTS
                </cite>
              </div>
            </div>

            {/* Right side detailed rows */}
            <div className="lg:col-span-6 space-y-0 lg:pt-20 w-full">
              
              {[
                {
                  title: "Inspeção Meticulosa",
                  text: "Desde a integridade das conexões internas até a calibração de consumo térmico da placa eletrônica. Nossos testes são exaustivos e orientados ao rendimento."
                },
                {
                  title: "Engenharia Certificada",
                  text: "Intervenções de hardware executadas em ambiente com controle estático e ferramentas calibradas. Reparos complexos em processadores e circuitos de carga."
                },
                {
                  title: "Suporte Personalizado",
                  text: "Agilidade em diagnósticos rápidos e logística dedicada com seguro de transporte de ponta a ponta, oferecendo comodidade máxima para sua segurança."
                }
              ].map((item, i) => (
                <div key={i} className={`relative group w-full py-10 ${i < 2 ? 'border-b border-white/5' : ''}`}>
                  <div className="absolute left-0 top-0 h-full w-[2px] bg-white/8 group-hover:bg-white/40 transition-colors duration-700 rounded-full" />
                  <div className="pl-8 w-full">
                    <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-white">
                      {item.title}
                    </h3>
                    <p className="mt-5 text-xs md:text-sm text-matte-grey leading-[1.8] max-w-[48ch]">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}

            </div>

          </div>
        </div>
      </section>


      {/* ═══ 5. SERVICE CARDS ═══ */}
      <section 
        id="servicos"
        className="relative w-full bg-[#050506] section-padding overflow-hidden"
      >
        <div className="section-divider absolute top-0 left-0" />

        <div className="mx-auto max-w-6xl w-full">
          <div className="scroll-reveal-block mb-16 md:mb-24 flex flex-col items-start gap-6 max-w-2xl w-full">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.88] text-white">
              SERVIÇOS DE ELITE.
            </h2>
            <p className="text-matte-grey text-sm leading-[1.8] max-w-[55ch]">
              Segurança integral e otimização total do seu ecossistema Apple com a curadoria especializada da IMPORTS.
            </p>
          </div>

          {/* Service Cards */}
          <div className="scroll-reveal-block grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 w-full">
            
            {[
              {
                icon: <ShieldCheck className="h-5 w-5 text-white" />,
                title: "Compra & Venda",
                desc: "Avaliação imediata e justa de seus aparelhos usados na troca por dispositivos novos ou seminovos revisados e certificados.",
                features: ["iPhones Lacrados", "Seminovos com Garantia"],
                cta: "Ver Catálogo",
                highlighted: false
              },
              {
                icon: <Wrench className="h-5 w-5 text-white" />,
                title: "Conserto Apple",
                desc: "Substituição profissional de baterias e telas, e micro-soldagem em placas eletrônicas sob rigorosa qualidade.",
                features: ["Reparo de Placas Lógicas", "Telas & Baterias de Ponta"],
                cta: "Solicitar Orçamento",
                highlighted: true
              },
              {
                icon: <Cpu className="h-5 w-5 text-white" />,
                title: "Ecossistema",
                desc: "Migração e backup seguro de dados em iCloud, formatação avançada de MacBooks e consultoria completa Apple.",
                features: ["Migração Criptografada", "Backups Automatizados"],
                cta: "Entrar em Contato",
                highlighted: false
              }
            ].map((card, i) => (
              <div 
                key={i} 
                className={`glass-panel glass-panel-hover p-8 md:p-12 flex flex-col justify-between min-h-[460px] relative overflow-hidden group ${card.highlighted ? 'animate-glow' : ''}`}
              >
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${card.highlighted ? 'from-white/25 to-transparent' : 'from-white/10 to-transparent group-hover:from-white/40'} transition-all duration-700`} />
                
                <div>
                  <div className="feature-icon mb-10">
                    {card.icon}
                  </div>
                  <h3 className="text-base md:text-lg font-bold tracking-wider text-white uppercase font-mono">
                    {card.title}
                  </h3>
                  <p className="mt-6 text-xs text-matte-grey leading-[1.8]">
                    {card.desc}
                  </p>
                  <ul className="mt-8 space-y-3.5 text-[10px] text-white/50 font-mono">
                    {card.features.map((feat, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <CheckCircle className="h-3.5 w-3.5 text-white/70 shrink-0" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={handleWhatsAppRedirect}
                  className="btn-text scale-active mt-12 w-max"
                >
                  {card.cta}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            ))}

          </div>
        </div>
      </section>


      {/* ═══ 6. FOOTER ═══ */}
      <footer className="relative w-full bg-[#030303] section-padding z-10">
        <div className="section-divider absolute top-0 left-0" />

        <div className="mx-auto max-w-6xl w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 pb-16 md:pb-24 border-b border-white/5 w-full">
            
            {/* Left side Brand */}
            <div className="lg:col-span-5 space-y-7 w-full">
              <img 
                src="/logo-imports.png" 
                alt="IMPORTS Logo" 
                width={120} 
                height={32} 
                className="h-8 w-auto object-contain brightness-100"
                loading="lazy"
              />
              <p className="text-xs text-matte-grey leading-relaxed max-w-[34ch]">
                Curadoria de aparelhos novos e seminovos, e assistência especializada técnica. Segurança e sofisticação assinadas.
              </p>
              <div className="pt-4">
                <button 
                  onClick={handleWhatsAppRedirect}
                  className="btn-primary scale-active"
                >
                  <WhatsappLogo className="h-4 w-4" />
                  Entrar em Contato
                </button>
              </div>
            </div>

            {/* Middle Schedule */}
            <div className="lg:col-span-3 space-y-6 w-full">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] font-bold text-white">Horários</h4>
              <ul className="space-y-4 text-xs text-matte-grey">
                <li className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/30 shrink-0" />
                  Seg a Sex: 09h às 18h
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/30 shrink-0" />
                  Sábado: 09h às 13h
                </li>
              </ul>
            </div>

            {/* Right Location */}
            <div className="lg:col-span-4 space-y-6 w-full">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] font-bold text-white">Atendimento</h4>
              <p className="flex items-start gap-3 text-xs text-matte-grey leading-relaxed">
                <MapPin className="h-4 w-4 text-white/30 shrink-0 mt-0.5" />
                Laboratório técnico dedicado e atendimento reservado sob agendamento. Disponibilidade imediata para serviços em domicílio leva e traz.
              </p>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-10 md:pt-14 gap-5 w-full">
            <span className="text-[9px] font-mono tracking-[0.25em] text-muted uppercase">
              © {new Date().getFullYear()} IMPORTS. TODOS OS DIREITOS RESERVADOS.
            </span>
            <span className="text-[9px] font-mono tracking-[0.25em] text-muted uppercase flex items-center gap-1.5">
              ASSINATURA TÉCNICA POR
              <span className="text-white font-bold tracking-widest">RAFAEL VINICIUS RODRIGUES</span>
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
