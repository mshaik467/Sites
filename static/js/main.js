document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('cancellationTable');
    const airportFilter = document.getElementById('airportFilter');
    const airlineFilter = document.getElementById('airlineFilter');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyBtn = document.getElementById('applyFilters');

    let airportChart, airlineChart;

    async function fetchData(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/api/cancellations?${queryString}`);
        const data = await response.json();
        renderTable(data);
    }

    async function fetchStats() {
        const response = await fetch('/api/stats');
        const data = await response.json();
        renderCharts(data);
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No cancellations found.</td></tr>';
            return;
        }

        data.forEach(flight => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${flight.flight_number}</strong></td>
                <td>${flight.airline}</td>
                <td>${flight.departure_airport}</td>
                <td>${flight.scheduled_time}</td>
                <td class="status-cancelled">${flight.reason}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function renderCharts(stats) {
        const airportCtx = document.getElementById('airportChart').getContext('2d');
        const airlineCtx = document.getElementById('airlineChart').getContext('2d');

        if (airportChart) airportChart.destroy();
        if (airlineChart) airlineChart.destroy();

        airportChart = new Chart(airportCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(stats.by_airport),
                datasets: [{
                    label: '# of Cancellations',
                    data: Object.values(stats.by_airport),
                    backgroundColor: '#3498db'
                }]
            },
            options: { responsive: true }
        });

        airlineChart = new Chart(airlineCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(stats.by_airline),
                datasets: [{
                    data: Object.values(stats.by_airline),
                    backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22']
                }]
            },
            options: { responsive: true }
        });
    }

    applyBtn.addEventListener('click', () => {
        const params = {
            airport: airportFilter.value,
            airline: airlineFilter.value,
            start_date: startDateInput.value,
            end_date: endDateInput.value
        };
        fetchData(params);
    });

    // Initial load
    fetchData();
    fetchStats();

    // Auto refresh every minute
    setInterval(() => {
        fetchData();
        fetchStats();
    }, 60000);
});
