// ============================================
// Page Loader & Initial Fade-in
// ============================================
window.addEventListener('load', () => {
    const loader = document.querySelector('.page-loader');
    
    // Wait 1.5 seconds then fade out loader
    setTimeout(() => {
        loader.classList.add('fade-out');
        
        // Remove loader from DOM after animation
        setTimeout(() => {
            loader.remove();
        }, 500);
    }, 1500);
});


class ScrollSpy {
  constructor() {
    this.header = document.querySelector(".main-header");
    this.links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    this.sections = this.links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);

    this.headerOffset = 0;
    this.init();
  }

  init() {
    if (!this.links.length || !this.sections.length) return;

    this.updateHeaderOffset();
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize);

    // run once on load
    this.onScroll();
  }

  onResize() {
    this.updateHeaderOffset();
    this.onScroll();
  }

  updateHeaderOffset() {
    this.headerOffset = this.header ? this.header.offsetHeight : 0;
  }

  onScroll() {
    // The "reading line": a point slightly below the fixed header
    const y = window.scrollY + this.headerOffset + 8;

    // Pick the last section whose top is above the reading line
    let current = this.sections[0];
    for (const section of this.sections) {
      if (section.offsetTop <= y) current = section;
    }

    this.setActive(`#${current.id}`);
  }

  setActive(hash) {
    this.links.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === hash);
    });
  }
}

// ============================================
// Transparent Header on Hero Section
// ============================================
class HeaderController {
    constructor() {
        this.header = document.querySelector('.main-header');
        this.heroSection = document.querySelector('.hero-section');
        this.init();
    }
    
    init() {
        // Make header transparent initially
        this.header.classList.add('transparent');
        
        // Change header on scroll
        window.addEventListener('scroll', () => {
            const heroHeight = this.heroSection.offsetHeight;
            
            if (window.scrollY > heroHeight - 100) {
                this.header.classList.remove('transparent');
            } else {
                this.header.classList.add('transparent');
            }
        });
    }
}

class HeroVideoSequence {
    constructor() {
        this.heroSection = document.querySelector('.hero-section');
        this.heroContent = document.querySelector('#heroContent');

        this.videoMain = document.querySelector('#heroVideoMain');
        this.videoHeartbeat = document.querySelector('#heroVideoHeartbeat');

        this.init();
    }

    init() {
        if (!this.heroSection || !this.videoMain || !this.videoHeartbeat) return;

        // Phase 1: main video plays once
        this.videoMain.loop = false;

        // Phase 2: heartbeat loops
        this.videoHeartbeat.loop = true;
        this.videoHeartbeat.pause();
        this.videoHeartbeat.currentTime = 0;

        // When main ends -> switch
        this.videoMain.addEventListener('ended', () => {
            console.log('Main Hero video ended')
            this.enterHeartbeatMode();
        });

        this.videoMain.addEventListener('error', () => {
    console.log('Main hero video error', this.videoMain.error);
});
    }

    async enterHeartbeatMode() {
    // 1) Start fade-out outro of main video
    this.heroSection.classList.add('main-fade-out');

    // 2) While fading out, start loading/playing heartbeat (still hidden in intro-mode)
    try {
        this.videoHeartbeat.currentTime = 0;
        await this.videoHeartbeat.play();
    } catch (e) {
        // autoplay might be blocked, but video is muted so should usually work
    }

    // 3) After fade duration, end intro mode:
    //    - remove intro-mode (was hiding everything)
    //    - add intro-ended (to fade UI in)
    setTimeout(() => {
        document.body.classList.remove('intro-mode');
        document.body.classList.add('intro-ended');

        // Optional: to stop the main video from capturing clicks/being “on top”
        // after it is fully transparent:
        this.videoMain.style.pointerEvents = "none";
    }, 800); // MUST match CSS transition time (0.8s)
}
}

// ============================================
// Smooth Scroll to Hello World Section
// ============================================
class SmoothScroll {
    constructor() {
        this.init();
    }
    
    init() {
        // Scroll on button click
        const scrollButton = document.querySelector('.scroll-to-content');
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        [scrollButton, scrollIndicator].forEach(element => {
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToSection('#bpm-intro');
                });
            }
        });
        
        // Scroll on all navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    this.scrollToSection(href);
                }
            });
        });
    }

    
    
    scrollToSection(target) {
        const targetElement = document.querySelector(target);
        if (!targetElement) return;
        
        const targetPosition = targetElement.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 1200; // 1.2 seconds
        let start = null;
        
        // Easing function
        const easeInOutCubic = (t) => {
            return t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = easeInOutCubic(progress);
            
            window.scrollTo(0, startPosition + (distance * ease));
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
            // Section will be revealed by IntersectionObserver automatically
        };
        
        requestAnimationFrame(animation);
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const helloVideo = document.querySelector(".hello-world-video");
  if (!helloVideo) return;

  const tryPlay = async () => {
    try { await helloVideo.play(); } catch (_) {}
    window.removeEventListener("pointerdown", tryPlay);
  };

  // try immediately (works if browser allows)
  tryPlay();

  // fallback on first user interaction
  window.addEventListener("pointerdown", tryPlay, { once: true });
});

// ============================================
// Section Reveal on Scroll (Intersection Observer)
// ============================================
class SectionReveal {
    constructor() {
        this.observerOptions = {
            threshold: 0.2, // Trigger when 20% of section is visible
            rootMargin: '0px 0px -100px 0px' // Trigger slightly before section enters viewport
        };
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add visible class when section enters viewport
                    entry.target.classList.add('visible');
                }
            });
        }, this.observerOptions);
        
        // Observe Hello World section
        // Observe BPM Intro + Hello World sections
['.bpm-intro', '.hello-world-section'].forEach((selector) => {
    const section = document.querySelector(selector);
    if (section) observer.observe(section);
});
    }
}

// ============================================
// Scroll Reveal Animations for Cards
// ============================================
class ScrollReveal {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal');
                }
            });
        }, this.observerOptions);
        
        // Observe cards, feature items, and showcase section
        document.querySelectorAll('.service-card, .feature-item, .showcase-wrapper').forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
            observer.observe(el);
        });
        
        // Animate benefits list items individually
        document.querySelectorAll('.benefits-list li').forEach((li, index) => {
            li.style.opacity = '0';
            li.style.transform = 'translateX(-20px)';
            li.style.transition = `all 0.4s ease-out ${index * 0.1}s`;
            observer.observe(li);
        });
    }
}

class HeroIntroToStatic {
  constructor() {
    this.heroSection = document.querySelector('.hero-section');
    this.videoMain = document.querySelector('#heroVideoMain');
    this.init();
  }

  init() {
    if (!this.heroSection || !this.videoMain) return;

    // Play intro once
    this.videoMain.loop = false;

    const end = () => this.endIntro();

    // Normal case: video ends
    this.videoMain.addEventListener('ended', end);

    // Safety: if autoplay fails or video errors, don't keep the page locked
    this.videoMain.addEventListener('error', end);

    // Optional safety: if metadata never loads (rare), still end intro
    setTimeout(() => {
      if (document.body.classList.contains('intro-mode')) end();
    }, 20000); // 20s fallback
  }

  endIntro() {
    if (document.body.classList.contains('intro-ended')) return;

    // Fade the intro video out revealing the static background underneath
    this.heroSection.classList.add('main-fade-out');

    // Switch body state so hero content appears and scroll is enabled
    document.body.classList.remove('intro-mode');
    document.body.classList.add('intro-ended');

    // Ensure the invisible video layer doesn't block clicks
    this.videoMain.style.pointerEvents = 'none';
  }
}

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new HeaderController();
    new SmoothScroll();
    new SectionReveal(); // 👈 NEW: Reveals Hello World on scroll
    new ScrollReveal();  // Reveals cards
    new ScrollSpy();
    new HeroIntroToStatic();
});

// Add reveal styles
const style = document.createElement('style');
style.textContent = `
    .reveal {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);
