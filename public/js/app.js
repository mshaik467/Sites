document.addEventListener('DOMContentLoaded', () => {
    const surahGrid = document.getElementById('surah-grid');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const completedCountEl = document.getElementById('completed-count');
    const bookmarkedCountEl = document.getElementById('bookmarked-count');

    let allSurahs = [];
    let completedSurahs = JSON.parse(localStorage.getItem('completedSurahs') || '[]');
    let bookmarkedSurahs = JSON.parse(localStorage.getItem('bookmarkedSurahs') || '[]');
    let currentTheme = localStorage.getItem('theme') || 'emerald';

    // Apply initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();

    // Fetch Surahs
    fetch('/api/surahs')
        .then(res => res.json())
        .then(data => {
            allSurahs = data;
            renderSurahs(allSurahs);
            updateStats();
        })
        .catch(err => {
            console.error('Error fetching surahs:', err);
            surahGrid.innerHTML = '<p class="error">Failed to load Surahs. Please try again later.</p>';
        });

    function renderSurahs(surahs) {
        surahGrid.innerHTML = '';
        if (surahs.length === 0) {
            surahGrid.innerHTML = '<p class="no-results">No Surahs found matching your search.</p>';
            return;
        }

        surahs.forEach(surah => {
            const isCompleted = completedSurahs.includes(surah.id);
            const isBookmarked = bookmarkedSurahs.includes(surah.id);

            const card = document.createElement('div');
            card.className = 'surah-card';
            card.innerHTML = `
                <div class="surah-header">
                    <div class="surah-number">${surah.id}</div>
                    <div class="surah-info">
                        <h3>${surah.transliteration}</h3>
                        <p>${surah.translation}</p>
                    </div>
                </div>
                <div class="surah-actions">
                    <button class="btn-icon ${isCompleted ? 'completed' : 'inactive'}" data-action="complete" data-id="${surah.id}">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="btn-icon ${isBookmarked ? 'bookmarked' : 'inactive'}" data-action="bookmark" data-id="${surah.id}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-icon')) {
                    handleAction(e.target.closest('.btn-icon'));
                } else {
                    window.location.href = `surah.html?id=${surah.id}`;
                }
            });

            surahGrid.appendChild(card);
        });
    }

    function handleAction(button) {
        const action = button.dataset.action;
        const id = parseInt(button.dataset.id);

        if (action === 'complete') {
            if (completedSurahs.includes(id)) {
                completedSurahs = completedSurahs.filter(sid => sid !== id);
                button.classList.replace('completed', 'inactive');
            } else {
                completedSurahs.push(id);
                button.classList.replace('inactive', 'completed');
            }
            localStorage.setItem('completedSurahs', JSON.stringify(completedSurahs));
        } else if (action === 'bookmark') {
            if (bookmarkedSurahs.includes(id)) {
                bookmarkedSurahs = bookmarkedSurahs.filter(sid => sid !== id);
                button.classList.replace('bookmarked', 'inactive');
            } else {
                bookmarkedSurahs.push(id);
                button.classList.replace('inactive', 'bookmarked');
            }
            localStorage.setItem('bookmarkedSurahs', JSON.stringify(bookmarkedSurahs));
        }
        updateStats();
    }

    function updateStats() {
        completedCountEl.textContent = completedSurahs.length;
        bookmarkedCountEl.textContent = bookmarkedSurahs.length;
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allSurahs.filter(s =>
            s.transliteration.toLowerCase().includes(query) ||
            s.translation.toLowerCase().includes(query) ||
            s.id.toString().includes(query)
        );
        renderSurahs(filtered);
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const themes = ['light', 'dark', 'emerald'];
        let index = themes.indexOf(currentTheme);
        currentTheme = themes[(index + 1) % themes.length];
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
    });

    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        if (currentTheme === 'light') icon.className = 'fas fa-sun';
        else if (currentTheme === 'dark') icon.className = 'fas fa-moon';
        else icon.className = 'fas fa-leaf';
    }
});
