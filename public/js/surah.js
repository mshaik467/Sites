document.addEventListener('DOMContentLoaded', () => {
    const detailContainer = document.getElementById('surah-detail');
    const prevBtn = document.getElementById('prev-surah');
    const nextBtn = document.getElementById('next-surah');
    const themeToggle = document.getElementById('theme-toggle');

    const urlParams = new URLSearchParams(window.location.search);
    const surahId = parseInt(urlParams.get('id'));

    let currentSurah = null;
    let allSurahs = [];
    let completedSurahs = JSON.parse(localStorage.getItem('completedSurahs') || '[]');
    let bookmarkedSurahs = JSON.parse(localStorage.getItem('bookmarkedSurahs') || '[]');
    let currentTheme = localStorage.getItem('theme') || 'emerald';

    // Apply initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();

    // Fetch all Surahs to enable navigation
    fetch('/api/surahs')
        .then(res => res.json())
        .then(data => {
            allSurahs = data;
            currentSurah = allSurahs.find(s => s.id === surahId);
            if (currentSurah) {
                renderDetail(currentSurah);
                updateNavButtons();
            } else {
                detailContainer.innerHTML = '<p class="error">Surah not found.</p>';
            }
        })
        .catch(err => {
            console.error('Error fetching surah detail:', err);
            detailContainer.innerHTML = '<p class="error">Failed to load Surah details.</p>';
        });

    function renderDetail(surah) {
        const isCompleted = completedSurahs.includes(surah.id);
        const isBookmarked = bookmarkedSurahs.includes(surah.id);

        detailContainer.innerHTML = `
            <div class="detail-header">
                <div class="surah-number-large">${surah.id}</div>
                <h1>${surah.transliteration}</h1>
                <p class="arabic-name">${surah.name}</p>
                <div class="detail-meta">
                    <span><i class="fas fa-language"></i> ${surah.translation}</span>
                    <span id="detail-completed" class="${isCompleted ? 'text-success' : ''}">
                        <i class="fas fa-check-circle"></i> ${isCompleted ? 'Completed' : 'Not Read'}
                    </span>
                </div>
                <div class="detail-actions">
                    <button id="toggle-complete" class="btn-action ${isCompleted ? 'active' : ''}">
                        ${isCompleted ? 'Mark as Unread' : 'Mark as Completed'}
                    </button>
                    <button id="toggle-bookmark" class="btn-action ${isBookmarked ? 'active' : ''}">
                        <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                    </button>
                </div>
            </div>

            <div class="content-section">
                <h2 class="section-title"><i class="fas fa-info-circle"></i> Summary</h2>
                <p class="content-block">${surah.summary}</p>
            </div>

            <div class="content-section">
                <h2 class="section-title"><i class="fas fa-star"></i> Highlights</h2>
                <ul class="list-items content-block">
                    ${surah.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
            </div>

            <div class="content-section">
                <h2 class="section-title"><i class="fas fa-lightbulb"></i> Lessons to be Learnt</h2>
                <ul class="list-items content-block">
                    ${surah.lessons.map(l => `<li>${l}</li>`).join('')}
                </ul>
            </div>

            <div class="content-section">
                <h2 class="section-title"><i class="fas fa-envelope-open-text"></i> Message Delivered</h2>
                <p class="content-block">${surah.message}</p>
            </div>
        `;

        document.getElementById('toggle-complete').addEventListener('click', () => toggleStatus('complete'));
        document.getElementById('toggle-bookmark').addEventListener('click', () => toggleStatus('bookmark'));
    }

    function toggleStatus(type) {
        if (type === 'complete') {
            if (completedSurahs.includes(surahId)) {
                completedSurahs = completedSurahs.filter(id => id !== surahId);
            } else {
                completedSurahs.push(surahId);
            }
            localStorage.setItem('completedSurahs', JSON.stringify(completedSurahs));
        } else {
            if (bookmarkedSurahs.includes(surahId)) {
                bookmarkedSurahs = bookmarkedSurahs.filter(id => id !== surahId);
            } else {
                bookmarkedSurahs.push(surahId);
            }
            localStorage.setItem('bookmarkedSurahs', JSON.stringify(bookmarkedSurahs));
        }
        renderDetail(currentSurah);
    }

    function updateNavButtons() {
        const index = allSurahs.findIndex(s => s.id === surahId);
        if (index > 0) {
            prevBtn.classList.remove('hidden');
            prevBtn.onclick = () => window.location.href = `surah.html?id=${allSurahs[index - 1].id}`;
        }
        if (index < allSurahs.length - 1) {
            nextBtn.classList.remove('hidden');
            nextBtn.onclick = () => window.location.href = `surah.html?id=${allSurahs[index + 1].id}`;
        }
    }

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
