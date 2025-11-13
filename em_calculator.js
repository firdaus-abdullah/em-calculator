/**
 * Function to calculate and display the EM Report Schedule based on user input, 
 * incorporating all revisions: custom labels, DD Mon YYYY #:# AM/PM format, 
 * separate columns, and adjusted Aseptic product logic.
 */
function calculateEMReports() {
    // 1. Get user input
    const productType = document.getElementById('productType').value;
    const startTimeStr = document.getElementById('startTime').value;
    const endTimeStr = document.getElementById('endTime').value;
    const resultsDiv = document.getElementById('results');

    // Reset previous results
    resultsDiv.innerHTML = '<h3>Report Schedule:</h3>';

    // 2. Validate input
    if (!startTimeStr || !endTimeStr) {
        resultsDiv.innerHTML += '<p style="color: red;">Please enter both Start and End Filling Date and Time.</p>';
        return;
    }

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    const fourHoursMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

    if (startTime >= endTime) {
        resultsDiv.innerHTML += '<p style="color: red;">Start Time must be before End Time.</p>';
        return;
    }

    // 3. Helper functions for new date/time formatting (dd mmm yyyy and #:# AM/PM)
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric' 
    });
    
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
    });

    const formatDate = (date) => dateFormatter.format(date).replace(/ /g, ' '); // dd mmm yyyy
    const formatTime = (date) => timeFormatter.format(date).replace(':', ':');   // #:## AM/PM

    // Function to combine date and time for table display
    const formatDateTime = (date) => `${formatDate(date)} ${formatTime(date)}`;
    
    let reportData = [];

    // --- Core Logic ---

    if (productType === 'Aseptic') {
        // Aseptic Logic: Summary every 4 hours, starting 4 hours *before* filling starts.
        // NO 'After Production' set generated.

        // 3a. Calculate the **first** report time (4 hours before start)
        let currentTime = new Date(startTime.getTime() - fourHoursMs);
        
        let reportSetCount = 1;
        
        // Loop stops when the start of the current 4-hour set reaches or exceeds the end time.
        while (currentTime.getTime() < endTime.getTime()) {
            
            const reportEnd = new Date(currentTime.getTime() + fourHoursMs);
            
            let timeCategory;
            
            // Determine the category based on where the 4-hour slot falls
            if (reportEnd.getTime() <= startTime.getTime()) {
                timeCategory = 'Before Production'; 
            } else {
                // All sets that overlap with or are immediately before the end of the filling time
                timeCategory = 'During Production';
            }
            
            reportData.push({
                set: reportSetCount++,
                start: currentTime,
                end: reportEnd,
                category: timeCategory
            });

            // Move to the next 4-hour window
            currentTime = reportEnd;
        }

    } else if (productType === 'Terminal') {
        // Terminal Logic: 4 hours *before* start AND 4 hours *after* end.

        // 1. 4 Hours Before Start
        const beforeStart = new Date(startTime.getTime() - fourHoursMs);
        reportData.push({
            set: 1,
            start: beforeStart,
            end: startTime,
            category: 'Before Production'
        });

        // 2. 4 Hours After End
        const afterEnd = new Date(endTime.getTime() + fourHoursMs);
        reportData.push({
            set: 2,
            start: endTime,
            end: afterEnd,
            category: 'After Production'
        });
    }
    
    // 4. Display Results and Calculate Summary
    if (reportData.length > 0) {
        
        // Group reports by category and date for the summary count
        const summary = reportData.reduce((acc, report) => {
            // Use the start date of the set for the date count
            const dateStr = formatDate(report.start);
            if (!acc[report.category]) {
                acc[report.category] = {};
            }
            // Count sets per date per category
            acc[report.category][dateStr] = (acc[report.category][dateStr] || 0) + 1;
            return acc;
        }, {});

        // Build the Summary Report
        let summaryHTML = '<h4>Summary of Sets per Date:</h4><ul>';
        for (const category in summary) {
            summaryHTML += `<li><strong>${category}:</strong><ul>`;
            for (const date in summary[category]) {
                summaryHTML += `<li>${date}: ${summary[category][date]} Set(s)</li>`;
            }
            summaryHTML += `</ul></li>`;
        }
        summaryHTML += '</ul>';

        resultsDiv.innerHTML += summaryHTML;
        resultsDiv.innerHTML += `<p>Total Summary Report Sets Required: <strong>${reportData.length}</strong></p>`;
        
        // Build the Detailed Schedule Table with SEPARATE START AND END COLUMNS
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Set #</th>
                        <th>Start Date/Time</th>
                        <th>End Date/Time</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
        `;

        reportData.forEach(report => {
            tableHTML += `
                <tr>
                    <td>${report.set}</td>
                    <td>${formatDateTime(report.start)}</td>
                    <td>${formatDateTime(report.end)}</td>
                    <td>${report.category}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        resultsDiv.innerHTML += tableHTML;

    } else {
        resultsDiv.innerHTML += '<p>No reports generated. Check your input and product type logic.</p>';
    }
}
