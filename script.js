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
    event.preventDefault();

    const statusDisplay = document.getElementById('form-status');
    statusDisplay.style.display = 'block';
    statusDisplay.style.color = '#0088cc';
    statusDisplay.innerText = 'Sending message...';

    const serviceID = 'service_mhrrqbt';
    const templateID = 'template_gc3nead';

    emailjs.sendForm(serviceID, templateID, this)
        .then(function() {
            statusDisplay.style.color = 'green';
            statusDisplay.innerText = 'Message sent successfully! We will get back to you soon.';
            document.getElementById('contact-form').reset(); 
        }, function(error) {
            statusDisplay.style.color = 'red';
            statusDisplay.innerText = 'Failed to send the message. Please try again later.';
            console.log('EmailJS Error:', error);
        });
});

// --- BLOG FETCH, EXPAND & COLLAPSE LOGIC ---

let articles = []; 
let currentIndex = 0;
const articlesPerPage = 5;
const grid = document.getElementById('article-grid');
const loadMoreBtn = document.getElementById('load-more-btn');
const collapseBtn = document.getElementById('collapse-btn');

// 1. FETCH THE DATA FROM YOUR JSON FILE
fetch('articles.json')
    .then(response => response.json())
    .then(data => {
        articles = data; 
        
        // Auto-load the first 5 articles when the page opens
        loadMoreArticles();
    })
    .catch(error => console.error('Error loading articles:', error));

// 2. THE BUTTON LOGIC 
function loadMoreArticles() {
    if (articles.length === 0) return; 

    const nextArticles = articles.slice(currentIndex, currentIndex + articlesPerPage);
    
    nextArticles.forEach(article => {
        const div = document.createElement('div');
        div.className = 'mini-article';
        div.innerHTML = `
            <div class="mini-article-content">
                <h4>${article.title}</h4>
                <p class="short-desc">${article.desc}</p>
                <div class="full-content">${article.content || '<p>Full article content coming soon...</p>'}</div>
                <a href="javascript:void(0)" class="read-more" style="font-size: 0.9rem;" onclick="toggleSingleArticle(event, this)">Read Article <i class="fas fa-arrow-down"></i></a>
            </div>
            <img src="${article.image}" alt="${article.title}" class="mini-article-img">
        `;
        grid.appendChild(div);
    });

    currentIndex += articlesPerPage;

    // UPDATED: Only show the Collapse (Up Arrow) if we have loaded MORE than the first 5 articles
    if (collapseBtn) {
        if (currentIndex > articlesPerPage) {
            collapseBtn.style.display = 'block';
        } else {
            collapseBtn.style.display = 'none';
        }
    }

    // Hide the Load More (Down Arrow) if we run out of articles
    if (currentIndex >= articles.length) {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }
}

function collapseArticles() {
    // Clear the screen and reset the counter
    grid.innerHTML = ''; 
    currentIndex = 0; 
    
    // UPDATED: Instantly reload the first 5 articles back onto the screen!
    loadMoreArticles();
    
    // Make sure the Load More button is visible again
    if (loadMoreBtn) loadMoreBtn.style.display = 'block';
    
    // Smoothly scroll back to the top of the blog section
    document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
}

// 3. INLINE EXPANSION LOGIC
function toggleSingleArticle(event, btnElement) {
    event.preventDefault(); 
    
    const fullContentDiv = btnElement.previousElementSibling;
    
    if (fullContentDiv.style.display === 'none' || fullContentDiv.style.display === '') {
        fullContentDiv.style.display = 'block';
        btnElement.innerHTML = 'Show Less <i class="fas fa-arrow-up"></i>';
        btnElement.style.color = 'var(--text-light)'; 
    } else {
        fullContentDiv.style.display = 'none';
        btnElement.innerHTML = 'Read Article <i class="fas fa-arrow-down"></i>';
        btnElement.style.color = 'var(--secondary-color)';
    }
}

if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMoreArticles);
if (collapseBtn) collapseBtn.addEventListener('click', collapseArticles);
