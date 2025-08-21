// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-menu-close');

    // Toggle mobile menu visibility

    if (mobileToggle && mobileMenu && mobileClose) {
        mobileToggle.addEventListener('click', function () {
            mobileMenu.classList.add('active');
        });

        mobileClose.addEventListener('click', function () {
            mobileMenu.classList.remove('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });
    }
});

// Dropdown functionality
document.addEventListener('DOMContentLoaded', function () {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownToggle && dropdownMenu) {
        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
});

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// -----------------------SEARCH PRODUCT IN TABLE DATA-----------------

const rows = document.querySelectorAll("#productTable tbody tr");
rows.forEach((row, index) => {
    row.cells[0].textContent = index + 1;
});

document.getElementById("searchInput").addEventListener("input", function () {
    let input = this.value.toLowerCase();
    let rows = document.querySelectorAll("#productTable tbody tr");
    rows.forEach(row => {
        let title = product.title(row.cells[0].textContent.toLowerCase());
        row.style.display = title.inludes(input) ? "" : "none";
    });
});