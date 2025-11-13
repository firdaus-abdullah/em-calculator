/**
 * Function to calculate and display the EM Report Schedule based on user input.
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

    // 3. Helper function for date/time formatting
    const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', 
        hour12: false // Use 24-hour format
    });

    const formatTime = (date) => formatter.format(date).replace(',', '');
    
    let reportData = [];

    // --- Core Logic ---

    if (productType === 'Aseptic') {
        // Aseptic Logic: Summary every 4 hours, starting 4 hours *before* filling starts.

        // 3a. Calculate the **first** report time (4 hours before start)
        let currentTime = new Date(startTime.getTime() - fourHoursMs);
        
        let reportSetCount = 1;
        
        // Loop runs until the start of the current 4-hour slot is after the end of the required period 
        // (which is 4 hours after filling stops).
        while (currentTime.getTime() < (endTime.getTime() + fourHoursMs)) {
            
            const reportEnd = new Date(currentTime.getTime() + fourHoursMs);
            
            let timeCategory = 'During Filling';
            // Determine the category
            if (reportEnd.getTime() <= startTime.getTime()) {
                timeCategory = 'Before Filling Start (Initial)';
            } else if (currentTime.getTime() >= endTime.getTime()) {
                timeCategory = 'After Filling End (Final)';
            }
            
            reportData.push({
                set: reportSetCount++,
                start: formatTime(currentTime),
                end: formatTime(reportEnd),
                category: timeCategory
            });

            // Move to the next 4-hour window
            currentTime = reportEnd;
        }

    } else if (productType === 'Terminal') {
        // Terminal Logic: Only 4 hours *before* start AND 4 hours *after* end.

        // 1. 4 Hours Before Start
        const beforeStart = new Date(startTime.getTime() - fourHoursMs);
        reportData.push({
            set: 1,
            start: formatTime(beforeStart),
            end: formatTime(startTime),
            category: 'Before Filling Start (Initial)'
        });

        // 2. 4 Hours After End
        const afterEnd = new Date(endTime.getTime() + fourHoursMs);
        reportData.push({
            set: 2,
            start: formatTime(endTime),
            end: formatTime(afterEnd),
            category: 'After Filling End (Final)'
        });
    }
    
    // 4. Display Results
    if (reportData.length > 0) {
        
        resultsDiv.innerHTML += `<p>Total Summary Report Sets Required: <strong>${reportData.length}</strong></p>`;
        
        let tableHTML = '<table><thead><tr><th>Set #</th><th>Time Interval (Start - End)</th><th>Category</th></tr></thead><tbody>';

        reportData.forEach(report => {
            tableHTML += `
                <tr>
                    <td>${report.set}</td>
                    <td>${report.start} - ${report.end}</td>
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
