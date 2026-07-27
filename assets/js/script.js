/* =============================================================
   PORTFOLIO SCRIPT.JS
   Kurt Justin Lacuna — Vanilla JavaScript Enhancements
   Sections: Smooth Scroll | Mobile Nav | Active Nav |
             Fade-In Animations | Featured Works | Scroll-to-Top |
             Demo Reel Autoplay
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       CACHED DOM ELEMENTS
       Query once, reuse everywhere to avoid repeated lookups.
       ========================================================= */
    const siteHeader      = document.querySelector('.site-header');
    const navToggle       = document.getElementById('navToggle');
    const navLinks        = document.getElementById('navLinks');
    const navLinkItems    = document.querySelectorAll('.nav-link');
    const heroCtaButton   = document.querySelector('.hero-cta-button');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const allSections     = document.querySelectorAll('main section[id]');
    const workCards       = document.querySelectorAll('.work-card');

    /* Header height is used to offset scroll targets so content
       isn't hidden behind the sticky navigation bar. */
    const getHeaderOffset = () => siteHeader ? siteHeader.offsetHeight : 0;


    /* =========================================================
       CUSTOM SMOOTH SCROLL (rAF-based)
       Native `behavior: 'smooth'` is inconsistent across some
       browsers (notably older Safari), which can cause an
       instant "jump" instead of an animation. This custom
       easing-based scroller guarantees consistent smoothness
       everywhere, and is reused by nav links, the hero button,
       the scroll indicator, and the scroll-to-top button.
       ========================================================= */
    let activeScrollAnimation = null;

    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const animateScrollTo = (targetY, duration = 700) => {
        /* Cancel any scroll animation already in progress so
           rapid clicks don't stack multiple animations. */
        if (activeScrollAnimation) {
            cancelAnimationFrame(activeScrollAnimation);
            activeScrollAnimation = null;
        }

        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = performance.now();

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutQuad(progress);

            window.scrollTo(0, startY + distance * easedProgress);

            if (progress < 1) {
                activeScrollAnimation = requestAnimationFrame(step);
            } else {
                activeScrollAnimation = null;
            }
        };

        activeScrollAnimation = requestAnimationFrame(step);
    };

    /* Scrolls smoothly to a target section, accounting for the
       sticky header's height so section tops aren't cut off. */
    const smoothScrollToTarget = (targetSelector) => {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;

        /* Respect any section-specific scroll-margin-top set in CSS,
           on top of the sticky header offset. */
        const scrollMarginTop = parseInt(
            getComputedStyle(targetElement).scrollMarginTop || '0',
            10
        );

        const targetPosition = targetElement.getBoundingClientRect().top
            + window.pageYOffset
            - getHeaderOffset()
            - scrollMarginTop;

        animateScrollTo(Math.max(targetPosition, 0));
    };


    /* =========================================================
       1. SMOOTH SCROLLING
       Nav links, hero CTA, and the scroll indicator all reuse
       the custom smooth scroll helper above.
       ========================================================= */
    navLinkItems.forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                event.preventDefault();
                smoothScrollToTarget(href);
            }
        });
    });

    if (heroCtaButton) {
        heroCtaButton.addEventListener('click', (event) => {
            event.preventDefault();
            smoothScrollToTarget('#demo-reel');
        });
    }

    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', (event) => {
            event.preventDefault();
            smoothScrollToTarget('#demo-reel');
        });
    }


    /* =========================================================
       2. MOBILE NAVIGATION
       Toggles the hamburger menu open/closed and closes it
       automatically once a link is selected.
       ========================================================= */
    let isMobileNavOpen = false;

    const toggleMobileNav = () => {
        isMobileNavOpen = !isMobileNavOpen;
        navLinks.classList.toggle('is-open', isMobileNavOpen);
        navToggle.classList.toggle('is-active', isMobileNavOpen);
        navToggle.setAttribute('aria-expanded', String(isMobileNavOpen));
    };

    const closeMobileNav = () => {
        if (!isMobileNavOpen) return;
        isMobileNavOpen = false;
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
    };

    /* Single listener on the toggle button (no duplicates since
       this script only runs once on DOMContentLoaded). */
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', toggleMobileNav);
    }

    navLinkItems.forEach((link) => {
        link.addEventListener('click', closeMobileNav);
    });


    /* =========================================================
       3. ACTIVE NAVIGATION HIGHLIGHT
       Recalculated from real section boundaries on scroll
       instead of Intersection Observer thresholds — this makes
       sure a link stays highlighted for the FULL time its
       section is on screen, with no dead zones between
       sections (which was why highlighting felt broken).
       Style is applied directly via JS so it doesn't depend on
       an .is-active-link rule existing in the stylesheet.
       ========================================================= */
     let sectionBoundaries = [];
    let currentActiveSectionId = null;

    /* Recalculate each section's start/end position. Called on
       load and on resize, since layout (and therefore offsets)
       can shift when the viewport size changes. */
    const measureSectionBoundaries = () => {
        sectionBoundaries = Array.from(allSections).map((section) => ({
            id: section.id,
            top: section.getBoundingClientRect().top + window.pageYOffset,
            bottom: section.getBoundingClientRect().top + window.pageYOffset + section.offsetHeight
        }));
    };

    const setActiveNavLink = (activeId) => {
        navLinkItems.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${activeId}`;
            link.style.color = isActive ? 'var(--color-accent)' : '';
            link.style.fontWeight = isActive ? '700' : '';
        });
    };

    /* Determine which section currently occupies the most visible
       space in the viewport, then only switch to it once it clearly
       overtakes whichever section is currently marked active. */
    const updateActiveNavOnScroll = () => {
        if (sectionBoundaries.length === 0) return;

        const viewportTop = window.pageYOffset + getHeaderOffset();
        const viewportBottom = window.pageYOffset + window.innerHeight;
        const viewportHeight = viewportBottom - viewportTop;

        /* Special case: at the very bottom of the page, force the
           last section (e.g. Contact) to stay highlighted even if
           it doesn't fill most of the viewport. */
        const isAtPageBottom = window.innerHeight + window.pageYOffset
            >= document.documentElement.scrollHeight - 2;

        if (isAtPageBottom) {
            const lastSectionId = sectionBoundaries[sectionBoundaries.length - 1].id;
            if (lastSectionId !== currentActiveSectionId) {
                currentActiveSectionId = lastSectionId;
                setActiveNavLink(lastSectionId);
            }
            return;
        }

        /* Find the section with the greatest visible overlap
           within the current viewport (excluding the sticky header). */
        let bestSection = null;
        let bestOverlap = 0;

        sectionBoundaries.forEach((section) => {
            const overlapStart = Math.max(section.top, viewportTop);
            const overlapEnd = Math.min(section.bottom, viewportBottom);
            const overlap = Math.max(0, overlapEnd - overlapStart);

            if (overlap > bestOverlap) {
                bestOverlap = overlap;
                bestSection = section;
            }
        });

        if (!bestSection) return;

        /* Hysteresis: don't switch away from the currently active
           section unless the new candidate clearly has more visible
           space (by a buffer of ~8% of the viewport height). This is
           what stops the highlight from jumping back and forth when
           scrolling slightly up or down right at a section boundary. */
        const currentSection = sectionBoundaries.find(
            (section) => section.id === currentActiveSectionId
        );

        if (currentSection && currentSection.id !== bestSection.id) {
            const currentOverlapStart = Math.max(currentSection.top, viewportTop);
            const currentOverlapEnd = Math.min(currentSection.bottom, viewportBottom);
            const currentOverlap = Math.max(0, currentOverlapEnd - currentOverlapStart);

            const switchThreshold = viewportHeight * 0.08;
            if (bestOverlap <= currentOverlap + switchThreshold) {
                return;
            }
        }

        if (bestSection.id !== currentActiveSectionId) {
            currentActiveSectionId = bestSection.id;
            setActiveNavLink(bestSection.id);
        }
    };


    /* =========================================================
       4. FADE-IN ANIMATIONS
       Sections gently fade and rise into view the first time
       they cross the viewport. Lightweight, one-time reveal.
       ========================================================= */
    const fadeSections = Array.from(allSections).filter(
        (section) => section.id !== 'hero'
    );

    fadeSections.forEach((section) => section.classList.add('fade-section'));

    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
    }, {
        root: null,
        threshold: 0.15
    });

    fadeSections.forEach((section) => fadeInObserver.observe(section));

    /* =========================================================
       HERO ONE-TIME LOAD FADE
       Plays a subtle fade only on initial page load/refresh.
       Not tied to the scroll observer, so it never replays when
       navigating back up to the Hero.
       ========================================================= */
    const heroSection = document.querySelector('.hero-section');

    if (heroSection) {
        heroSection.classList.add('hero-fade-init');

        /* Trigger on next frame so the initial opacity: 0 is
           painted first, then transitions in. */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                heroSection.classList.add('is-loaded');
            });
        });
    }


    /* =========================================================
       5. FEATURED WORKS — AUTO THUMBNAILS & PROJECT LINKS
       Reads the data-youtube attribute on each .work-card (a
       full YouTube URL, a youtu.be short link, or a bare video
       ID), extracts the video ID, auto-generates the YouTube
       thumbnail, and opens the video in a new tab when the card
       is activated. Works for any number of cards with zero
       extra HTML/CSS/JS needed per new project.
       ========================================================= */

    /* Pulls the 11-character YouTube video ID out of any
       supported input: a full watch URL, a youtu.be short URL,
       or a bare ID that was typed in directly. */
    const extractYouTubeVideoId = (rawValue) => {
        if (!rawValue) return null;

        const trimmedValue = rawValue.trim();

        /* Case 1: already a bare video ID (no slashes, no dots) */
        const isLikelyBareId = /^[a-zA-Z0-9_-]{6,20}$/.test(trimmedValue);
        if (isLikelyBareId && !trimmedValue.includes('http')) {
            return trimmedValue;
        }

        /* Case 2 & 3: full "watch?v=" URLs or "youtu.be/" short URLs */
        const watchUrlMatch = trimmedValue.match(/[?&]v=([a-zA-Z0-9_-]{6,20})/);
        if (watchUrlMatch) return watchUrlMatch[1];

        const shortUrlMatch = trimmedValue.match(/youtu\.be\/([a-zA-Z0-9_-]{6,20})/);
        if (shortUrlMatch) return shortUrlMatch[1];

        return null;
    };

    /* Builds the watch URL used when a card is clicked/activated */
    const buildYouTubeWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

    /* Builds the auto-generated thumbnail URL for a given video ID.
       hqdefault is used because it's guaranteed to exist for every
       public YouTube video (unlike maxresdefault, which some videos
       don't have). */
    const buildYouTubeThumbnailUrl = (videoId) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    /* Opens a project's YouTube video in a new browser tab */
    const openProjectVideo = (videoId) => {
        window.open(buildYouTubeWatchUrl(videoId), '_blank', 'noopener,noreferrer');
    };

    workCards.forEach((card) => {
        const youtubeSource = card.dataset.youtube;
        const videoId = extractYouTubeVideoId(youtubeSource);

        /* Auto-fill the thumbnail image from the extracted video ID */
        const thumbnailImage = card.querySelector('.work-thumbnail');
        if (videoId && thumbnailImage) {
            thumbnailImage.src = buildYouTubeThumbnailUrl(videoId);

            /* Fall back to the alt text already on the .work-title
               heading so alt text stays accurate without manual entry */
            const cardTitle = card.querySelector('.work-title');
            if (cardTitle) {
                thumbnailImage.alt = `${cardTitle.textContent.trim()} thumbnail`;
            }
        }

        /* Prepare cards for future modal functionality (kept from
           the existing hover/focus interaction behavior) */
        const activateCard = () => card.classList.add('is-active-card');
        const deactivateCard = () => card.classList.remove('is-active-card');

        card.addEventListener('mouseenter', activateCard);
        card.addEventListener('mouseleave', deactivateCard);
        card.addEventListener('focus', activateCard);
        card.addEventListener('blur', deactivateCard);

        /* Click opens the project's YouTube video in a new tab */
        card.addEventListener('click', () => {
            if (videoId) openProjectVideo(videoId);
        });

        /* Keyboard users (Enter/Space) get the same behavior */
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activateCard();
                if (videoId) openProjectVideo(videoId);
            }
        });
    });


    /* =========================================================
       6. SCROLL-TO-TOP BUTTON
       Created dynamically (HTML markup stays untouched), shown
       after scrolling ~500px. Uses the custom smooth scroll
       helper so it animates back to the Hero instead of jumping.
       ========================================================= */
    const scrollToTopButton = document.createElement('button');
    scrollToTopButton.setAttribute('type', 'button');
    scrollToTopButton.setAttribute('aria-label', 'Scroll back to top');
    scrollToTopButton.classList.add('scroll-to-top-button');
    scrollToTopButton.innerHTML = '&#8593;';

    Object.assign(scrollToTopButton.style, {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#8B0000',
        color: '#FFFFFF',
        fontSize: '1.1rem',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
        opacity: '0',
        visibility: 'hidden',
        transform: 'translateY(12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease',
        zIndex: '999'
    });

    document.body.appendChild(scrollToTopButton);

    const SCROLL_REVEAL_THRESHOLD = 500;

    const toggleScrollToTopVisibility = () => {
        const shouldShow = window.scrollY > SCROLL_REVEAL_THRESHOLD;
        scrollToTopButton.style.opacity = shouldShow ? '1' : '0';
        scrollToTopButton.style.visibility = shouldShow ? 'visible' : 'hidden';
        scrollToTopButton.style.transform = shouldShow ? 'translateY(0)' : 'translateY(12px)';
    };

    /* Smoothly animate back to the Hero section on click,
       instead of an instant jump to the top of the page. */
    scrollToTopButton.addEventListener('click', () => {
        smoothScrollToTarget('#hero');
    });


    /* =========================================================
       SCROLL EVENT HANDLING (SHARED, THROTTLED)
       A single scroll listener drives both the scroll-to-top
       button visibility and the active nav highlight, throttled
       with requestAnimationFrame to avoid unnecessary work.
       ========================================================= */
    let isScrollTickScheduled = false;

    const handleScroll = () => {
        if (isScrollTickScheduled) return;
        isScrollTickScheduled = true;

        requestAnimationFrame(() => {
            toggleScrollToTopVisibility();
            updateActiveNavOnScroll();
            isScrollTickScheduled = false;
        });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measureSectionBoundaries);

    /* Run once on load in case the page is refreshed mid-scroll */
    measureSectionBoundaries();
    toggleScrollToTopVisibility();
    updateActiveNavOnScroll();


    /* =========================================================
       7. DEMO REEL — AUTOPLAY/PAUSE ON SCROLL INTO VIEW
       Plays the Demo Reel video automatically once the section
       is meaningfully in view, and pauses it when scrolled out
       of view. Resumes from the same timestamp on return instead
       of restarting, since .pause()/.play() never reset
       currentTime. Uses Intersection Observer only — no scroll
       event listener — for performance. Fully independent of the
       Featured Works YouTube cards, which are unaffected.
       ========================================================= */
    const demoReelVideo = document.querySelector('.demo-reel-video');

    if (demoReelVideo) {
        /* Ensure the video does not autoplay on page load; playback
           is driven entirely by visibility from here on. */
        demoReelVideo.pause();

        const demoReelObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    /* .play() resumes from current playback position;
                       it does not restart the video. */
                    demoReelVideo.play().catch(() => {
                        /* Silently ignore browsers that block autoplay
                           until the user interacts with the page. */
                    });
                } else {
                    demoReelVideo.pause();
                }
            });
        }, {
            root: null,
            /* Fires once roughly 50-60% of the section is visible */
            threshold: 0.55
        });

        demoReelObserver.observe(document.querySelector('.demo-reel-section'));
    }

});
