let allData = [];

async function fetchData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        allData = data.results;

        document.getElementById('last-updated').innerText = `Last Updated: ${new Date(data.timestamp).toLocaleString()}`;

        displayHighlights();
        renderTable(allData);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('last-updated').innerText = 'Error loading data. Make sure the agent has run.';
    }
}

function displayHighlights() {
    let bestWatch = allData.filter(i => i.category === 'Watch').sort((a,b) => a.price - b.price)[0];
    let bestPhone = allData.filter(i => i.category === 'Phone').sort((a,b) => a.price - b.price)[0];

    if (bestWatch) {
        document.getElementById('best-watch').querySelector('.content').innerHTML = `
            ${bestWatch.title}<br>
            <span class="price-tag">$${bestWatch.price}</span>
            <small>at ${bestWatch.retailer}</small>
        `;
    }

    if (bestPhone) {
        document.getElementById('best-phone').querySelector('.content').innerHTML = `
            ${bestPhone.title}<br>
            <span class="price-tag">$${bestPhone.price}</span>
            <small>at ${bestPhone.retailer}</small>
        `;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('data-body');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.title}</td>
            <td>${item.retailer}</td>
            <td>$${item.price}</td>
            <td>${item.availability}</td>
            <td><a href="${item.url}" target="_blank" class="buy-btn">View Site</a></td>
        `;
        tbody.appendChild(row);
    });
}

function filterResults(category) {
    // Update active button
    document.querySelectorAll('#filters button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.includes(category)) btn.classList.add('active');
        if (category === 'All' && btn.innerText === 'All') btn.classList.add('active');
    });

    if (category === 'All') {
        renderTable(allData);
    } else {
        const filtered = allData.filter(i => i.category === category);
        renderTable(filtered);
    }
}

// Initial fetch
fetchData();

// Refresh every hour if the page is left open
setInterval(fetchData, 3600000);
