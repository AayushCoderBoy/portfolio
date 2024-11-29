// Mobile Navigation Toggle
const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');

        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });

        // Burger Animation
        burger.classList.toggle('toggle');
    });
}

// Dynamic Text Effect
const dynamicText = document.querySelector(".dynamic-text");
const titles = [
    "Web Developer ",
    "Freelancer ",
    "AI Expert ",
    "UI/UX Designer ",
    "Full Stack Developer ",

];

let titleIndex = 0;
let charIndex = 0; // Tracks character position for typing animation in typeEffect() function
                   // Used with titleIndex to create typing/deleting effect for titles array
                   // Increments when typing, decrements when deleting
let isDeleting = false;

function typeEffect() {
    const currentTitle = titles[titleIndex];
    
    if (isDeleting) {
        // Remove characters
        dynamicText.textContent = currentTitle.substring(0, charIndex - 1) + "|";
        charIndex--;
    } else {
        // Add characters
        dynamicText.textContent = currentTitle.substring(0, charIndex + 1) + "|";
        charIndex++;
    }

    // Speed control
    let typeSpeed = isDeleting ? 50 : 150;
    
    // If word is complete
    if (!isDeleting && charIndex === currentTitle.length) {
        // Pause at end
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        // Move to next title
        titleIndex = (titleIndex + 1) % titles.length;
        // Pause before starting new word
        typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
}
// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Form Submission
// const contactForm = document.getElementById('contact-form');
// if (contactForm) {
//     contactForm.addEventListener('submit', function(e) {
//         e.preventDefault();
//         alert('Thank you for your message! I will get back to you soon.');
//         contactForm.reset();
//     });
// }

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href').slice(1) === current) {
            item.classList.add('active');
        }
    });
});

// Scroll Animation for Sections
const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: "0px"
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections for fade-in animation
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Initialize everything when the page loads
window.onload = function() {
    navSlide();
    if(dynamicText) {
        typeEffect();
    }
}

// Add scroll to top button
const scrollButton = document.createElement('button');
scrollButton.innerHTML = '↑';
scrollButton.className = 'scroll-top';
document.body.appendChild(scrollButton);

scrollButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Show/Hide scroll button based on scroll position
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollButton.style.display = 'block';
    } else {
        scrollButton.style.display = 'none';
    }
});

// Optional: Add animation class when scrolling
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (sectionTop < windowHeight * 0.75) {
            section.classList.add('active');
        }
    });
});

// Contact Form Handler
const contactForm = document.getElementById('contact-form');
const formStatus = document.querySelector('.form-status');
const emailInput = contactForm.querySelector('input[name="email"]');
const emailValidationMessage = document.querySelector('.email-validation-message');

// Email validation function
function isValidGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
}

// Real-time email validation
if (emailInput) {
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        
        if (email) {
            if (!isValidGmail(email)) {
                this.classList.add('invalid');
                this.classList.remove('valid');
                emailValidationMessage.style.display = 'block';
                emailValidationMessage.textContent = 'Please enter a valid Gmail address';
            } else {
                this.classList.remove('invalid');
                this.classList.add('valid');
                emailValidationMessage.style.display = 'none';
            }
        } else {
            this.classList.remove('invalid', 'valid');
            emailValidationMessage.style.display = 'none';
        }
    });
}

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: this.querySelector('input[name="name"]').value.trim(),
            email: this.querySelector('input[name="email"]').value.trim(),
            message: this.querySelector('textarea[name="message"]').value.trim(),
            verificationCode: this.querySelector('input[name="verification-code"]').value.trim()
        };

        // Validate all fields
        if (!formData.name || !formData.email || !formData.message || !formData.verificationCode) {
            formStatus.textContent = 'Please fill in all fields';
            formStatus.style.color = '#ff6b6b';
            return;
        }

        // Validate Gmail
        if (!isValidGmail(formData.email)) {
            formStatus.textContent = 'Please use a valid Gmail address';
            formStatus.style.color = '#ff6b6b';
            return;
        }

        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            const response = await fetch('http://localhost:5000/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                formStatus.textContent = 'Thank you for your message! I will get back to you soon.';
                formStatus.style.color = 'var(--accent-color)';
                contactForm.reset();
                emailInput.classList.remove('valid', 'invalid');
            } else {
                throw new Error(data.message || 'Error sending message');
            }
        } catch (error) {
            console.error('Error:', error);
            formStatus.textContent = `Error: ${error.message}. Please try again.`;
            formStatus.style.color = '#ff6b6b';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
}

// Add verification code handling
const verifyEmailBtn = document.getElementById('verify-email');
const verificationSection = document.querySelector('.verification-code-section');
const verificationMessage = document.querySelector('.verification-message');

verifyEmailBtn.addEventListener('click', async () => {
    const email = document.querySelector('input[name="email"]').value.trim();
    
    if (!email || !email.endsWith('@gmail.com')) {
        formStatus.textContent = 'Please enter a valid Gmail address';
        formStatus.style.color = '#ff6b6b';
        return;
    }

    try {
        verifyEmailBtn.disabled = true;
        verifyEmailBtn.textContent = 'Sending...';

        const response = await fetch('http://localhost:5000/api/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            verificationSection.style.display = 'block';
            verificationMessage.textContent = 'Verification code sent to your email';
            verificationMessage.style.color = 'var(--accent-color)';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        verificationMessage.textContent = error.message;
        verificationMessage.style.color = '#ff6b6b';
    } finally {
        verifyEmailBtn.disabled = false;
        verifyEmailBtn.textContent = 'Verify Email';
    }
});