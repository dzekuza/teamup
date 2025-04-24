document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section[id]');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const revealElements = document.querySelectorAll('.reveal-on-scroll');

    // --- Sticky Header Background --- //
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    // --- Mobile Menu Toggle --- //
    if (mobileMenuToggle && navLinksContainer) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinksContainer.classList.toggle('mobile-nav-open');
            document.body.classList.toggle('mobile-nav-open'); // Optional: For body styles like preventing scroll
        });

        // Close mobile menu when a link is clicked
        navLinksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinksContainer.classList.contains('mobile-nav-open')) {
                    navLinksContainer.classList.remove('mobile-nav-open');
                    document.body.classList.remove('mobile-nav-open');
                }
            });
        });
    }

    // --- Smooth Scrolling & Active Link Highlighting --- //
    const observerOptions = {
        root: null, // relative to viewport
        rootMargin: `-${header.offsetHeight}px 0px -50% 0px`, // Adjust top margin for header, bottom margin to trigger earlier
        threshold: 0 // Trigger as soon as 1px is visible past the rootMargin
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                // Remove active class from all links
                navLinks.forEach(link => link.classList.remove('active'));

                // Add active class to the corresponding link
                const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    // Observe each section
    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Ensure it's an internal link to an ID and not just "#"
            if (href && href !== '#' && href.startsWith('#')) {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });

                    // Close mobile nav if open
                    if (navLinksContainer.classList.contains('mobile-nav-open')) {
                         navLinksContainer.classList.remove('mobile-nav-open');
                         document.body.classList.remove('mobile-nav-open');
                    }
                }
            }
        });
    });

    // --- Scroll Reveal Animation --- //
    const revealObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, revealObserverOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- FAQ Toggle Enhancement (Optional - CSS handles basic toggle) --- //
    // You could add JS here to close other <details> when one is opened,
    // but the native behavior is often sufficient.

    // Example: Close others when one opens
    /*
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('toggle', (event) => {
            if (item.open) {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.open) {
                        otherItem.removeAttribute('open');
                    }
                });
            }
        });
    });
    */

}); 