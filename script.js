// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    if(navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
    } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '80px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = '#ffffff';
        navLinks.style.padding = '20px 0';
        navLinks.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
    }
});

// EmailJS Contact Form Logic
document.getElementById('contact-form').addEventListener('submit', function(event) {
    // Prevent the page from refreshing when submitting
    event.preventDefault();

    // Show a loading message
    const statusDisplay = document.getElementById('form-status');
    statusDisplay.style.display = 'block';
    statusDisplay.style.color = '#0088cc';
    statusDisplay.innerText = 'Sending message...';

    // Your specific Service ID and Template ID
    const serviceID = 'service_mhrrqbt';
    const templateID = 'template_gc3nead';

    // Send the form data
    emailjs.sendForm(serviceID, templateID, this)
        .then(function() {
            // On Success
            statusDisplay.style.color = 'green';
            statusDisplay.innerText = 'Message sent successfully! We will get back to you soon.';
            document.getElementById('contact-form').reset(); // Clears the form boxes
        }, function(error) {
            // On Error
            statusDisplay.style.color = 'red';
            statusDisplay.innerText = 'Failed to send the message. Please try again later.';
            console.log('EmailJS Error:', error);
        });
});
