document.addEventListener("DOMContentLoaded", () => {

    document.getElementById('form1').addEventListener('submit', async (event) => {
        event.preventDefault();
                
        const analyticsApiKey = document.getElementById('analyticsApiKey').value;
        const applicationId = document.getElementById('applicationId').value;
        const indexName = document.getElementById('indexName').value;
        const debugMode = document.getElementById('debugModeCheckbox').checked;


        // Store the application ID and index name for later use
        localStorage.setItem('algoliaApplicationId', applicationId);
        localStorage.setItem('algoliaIndexName', indexName);

        // Check the state of the debug mode checkbox
        if (debugMode) {
            // Skip the API call and directly display Section 2
            document.getElementById('section2').style.display = 'block';
        } else {
            console.log("Debug mode is OFF. Proceeding with API call.");
            try {
                const response = await fetch(`https://analytics.algolia.com/2/searches?index=${indexName}&limit=1000`, {
                    headers: {
                        'X-Algolia-API-Key': analyticsApiKey,
                        'X-Algolia-Application-Id': applicationId
                    }
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                    console.error('API request failed');
                    return;
                }

                const searchData = await response.json();
                console.log("API Response:", searchData); // Log the API response to inspect its structure

                // Log the full response data for debugging
                console.log("Full Search Data:", searchData.searches);

                if (!searchData.searches) {
                    console.log("No 'searches' data found in response");
                    return;
                }

                // Convert the full data to CSV
                const csvData = convertToCSV(searchData.searches);
                console.log("CSV Data:", csvData); // Check the CSV data

                const previewData = csvData.split('\n').slice(0, 11).join('\n');

                // Generate output for Section 1
                document.getElementById('output1').style.display = 'block';

                // Display preview data - 10 first lines of the CSV file
                document.getElementById('output1').innerHTML = `<p>Preview of Top 10 Searches:</p>` + createPreviewTable(previewData) + `<p>This is a preview of the first 10 lines. Download the full CSV file for complete data.</p>`;

                // Provide download link for CSV
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const downloadUrl = window.URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = downloadUrl;
                downloadLink.download = 'top_searches.csv';
                downloadLink.textContent = 'Download Full CSV File';
                document.getElementById('output1').appendChild(downloadLink);
            } catch (error) {
                console.error(error);
                // Handle errors appropriately
            }
        }
        // Show Section 2
        document.getElementById('section2').style.display = 'block';
    });

    document.getElementById('form2').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Log to indicate the start of form processing
        console.log("Processing form for Section 2...");

        // Initialize variables from form input
        const searchApiKey = document.getElementById('searchApiKey').value;
        const numSearchesToProcess = Math.min(document.getElementById('numSearchesToProcess').value, 1000);
        const attributeToRetrieve = document.getElementById('attributeToRetrieve').value;
        const numResults = document.getElementById('numResults').value;
        const csvFile = document.getElementById('csvFile').files[0];

        // Store attributeToRetrieve in local storage for use in later steps
        localStorage.setItem('attributeToRetrieve', attributeToRetrieve);
        console.log("Stored attributeToRetrieve in local storage:", attributeToRetrieve);

        // Retrieve application ID and index name from local storage
        const applicationId = localStorage.getItem('algoliaApplicationId');
        const indexName = localStorage.getItem('algoliaIndexName');
        console.log("Retrieved Application ID and Index Name:", applicationId, indexName);

        // Check for application ID and index name
        if (!applicationId || !indexName) {
            console.error('Algolia Application ID or Index Name is not set');
            return;
        }

        // Check if CSV file is uploaded
        if (!csvFile) {
            console.log("No CSV file uploaded for Section 2");
            return;
        }

        // Process the CSV file
        let reader = new FileReader();
        reader.onload = async (e) => {
            const csvData = e.target.result;
            console.log("CSV file loaded, starting to parse queries...");

            // Parse CSV data to extract queries
            const queries = parseCSV(csvData, numSearchesToProcess);
            console.log("Extracted queries:", queries);

            // Generate a random token for userToken
            let randomToken = Math.random().toString(36).substring(2, 15); // Generate a random string
            let userToken = `analytics-analyzer-${randomToken}`; // Concatenate with the prefix
            console.log("UserToken Generated:", userToken); // Display the generated userToken

            // Initialize results array
            let results = [];

            // Check for A/B Test details using the first query
            if (queries.length > 0) {
                let firstQuery = queries[0];
                console.log("Fetching A/B test details with query:", firstQuery);
                // Set up API request parameters
                let queryParams = {
                    query: firstQuery,
                    hitsPerPage: numResults,
                    attributesToRetrieve: [attributeToRetrieve, 'objectID'],
                    getRankingInfo: true, // Include detailed ranking information
                    analytics: false, // Disable analytics for this query
                    clickAnalytics: false, // Disable click analytics
                    userToken: userToken // Add userToken with the generated value
                };

                let response = await fetch(`https://${applicationId}-dsn.algolia.net/1/indexes/${indexName}/query`, {
                    method: 'POST',
                    headers: {
                        'X-Algolia-API-Key': searchApiKey,
                        'X-Algolia-Application-Id': applicationId,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(queryParams) // Send queryParams as the request body
                });

                if (response.ok) {
                    let data = await response.json();
                    console.log("Received data:", data);
                    if (data.abTestID) {
                        console.log("A/B Test ID found:", data.abTestID);
                        let abTestDetailsHtml = `
                            <div class="ab-test-warning">
                                <p><strong>Important Note: An A/B test is running on the index on which this analysis was run.</strong></p>
                                <p>By design, it's not possible to control in which variant you fall in. If the below variant is not the one you expected, try clicking again on the "Run Analysis" button to try to fall in the other variant.</p>
                                <p>Index Used: ${data.indexUsed}</p>
                                <p>A/B Test ID: ${data.abTestID}</p>
                                <p>AB Test Variant ID: ${data.abTestVariantID}</p>
                            </div>
                        `;
                        document.getElementById('abTestDetails').innerHTML = abTestDetailsHtml;
                        document.getElementById('abTestDetails').style.display = 'block';
                    }
                } else {
                    console.error('Failed to fetch A/B Test details for the first query');
                }
            }


            // Main loop processing all the queries
            for (let query of queries) {
                console.log("Processing query:", query);

                // Set up API request parameters
                let queryParams = {
                    query: query,
                    hitsPerPage: numResults,
                    attributesToRetrieve: [attributeToRetrieve, 'objectID'],
                    getRankingInfo: true, // Include detailed ranking information
                    analytics: false, // Disable analytics for this query
                    clickAnalytics: false, // Disable click analytics
                    userToken: userToken // Add userToken with the generated value
                };

                let response = await fetch(`https://${applicationId}-dsn.algolia.net/1/indexes/${indexName}/query`, {
                    method: 'POST',
                    headers: {
                        'X-Algolia-API-Key': searchApiKey,
                        'X-Algolia-Application-Id': applicationId,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(queryParams) // Send queryParams as the request body
                });

                // Check API response status
                if (!response.ok) {
                    console.error('Search API request failed for query:', query);
                    continue;
                }

                let data = await response.json();
                console.log("Index Used:", data.indexUsed); // Display the index used
                console.log("AB Test ID:", data.abTestID); // Display the AB Test ID
                console.log("AB Test Variant ID:", data.abTestVariantID); // Display the AB Test Variant ID

                // Process hits for each query
                let queryResults = data.hits.map(hit => ({
                    [attributeToRetrieve]: hit[attributeToRetrieve],
                    objectID: hit.objectID
                }));

                // Add processed hits to results array
                results.push({ query: query, hits: queryResults });
            }

            // Convert the results to a formatted JSON string
            const formattedJson = JSON.stringify(results, null, 2);
            console.log("Formatted JSON ready for download:", formattedJson);

            // Create a Blob for downloading the JSON file
            const dataBlob = new Blob([formattedJson], { type: 'application/json' });
            const downloadUrl = window.URL.createObjectURL(dataBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = 'search_results.json';
            downloadLink.textContent = 'Download JSON File';

            // Create a preview of the JSON file
            let previewContent = JSON.stringify(results.slice(0, 5), null, 2); // Show first 5 entries as a preview
            document.getElementById('output2').innerHTML = `
                <p>Preview of JSON File (first 5 entries):</p>
                <pre id="jsonPreview">${previewContent}</pre>
                <p>This is a preview. The full JSON file can be downloaded below.</p>
                `;

            document.getElementById('output2').appendChild(downloadLink);
            document.getElementById('output2').style.display = 'block';
            // Show Section 3
            document.getElementById('section3').style.display = 'block';
        };

        // Read the CSV file as text
        reader.readAsText(csvFile);
    });


    document.getElementById('form3').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Log the start of processing for Section 3
        console.log("Starting processing for Section 3...");

        // Retrieve the JSON file uploaded by the user
        const jsonFile = document.getElementById('jsonFile').files[0];
        const attributeValue = document.getElementById('attributeValue').value;
        // Retrieve the attribute to analyze from local storage
        const attributeToRetrieve = localStorage.getItem('attributeToRetrieve');

        // Check if the JSON file is provided
        if (!jsonFile) {
            console.log("No JSON file uploaded for Section 3");
            return;
        }

        // Initialize FileReader to read the JSON file
        let reader = new FileReader();

        // Define the onload event handler for FileReader
        reader.onload = async (e) => {
            // Parse the JSON data from the uploaded file
            const jsonData = JSON.parse(e.target.result);
            console.log("Loaded JSON data from file:", jsonData);

            // Calculate percentages based on the specified attribute and value
            console.log(`Calculating percentages for attribute "${attributeToRetrieve}" with value "${attributeValue}"`);
            const percentages = calculateAttributePercentage(jsonData, attributeToRetrieve, attributeValue);

            // Check if any data is available for CSV conversion
            if (percentages.length === 0) {
                console.log("No data to convert to CSV. The result is empty.");
                return;
            }

            console.log("Calculated percentages data:", percentages);

            // Convert the calculated data to CSV format
            const csvData = convertToCSV(percentages);
            // Extract the first 10 lines for the preview
            const previewData = csvData.split('\n').slice(0, 11).join('\n');

            // Display the preview data in a table format
            document.getElementById('output3').innerHTML = `
                <p>Preview of Analysis (first 10 lines):</p>
                ${createPreviewTable(previewData)}
                <p>This is a preview of the first 10 lines. The full CSV file can be downloaded below.</p>
            `;

            // Create a Blob for the full CSV and provide a download link
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = 'attribute_analysis.csv';
            downloadLink.textContent = 'Download Full CSV File';
            document.getElementById('output3').appendChild(downloadLink);
            document.getElementById('output3').style.display = 'block';
        };

        // Read the content of the JSON file as text
        reader.readAsText(jsonFile);
    });

});

function convertToCSV(jsonData) {
    if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
        console.log("No data to convert to CSV");
        return '';
    }

    // Extract column headers
    const columns = Object.keys(jsonData[0]);
    console.log("CSV Columns:", columns);
    const csvColumns = columns.join(',');

    // Map each JSON object to a CSV row
    const csvRows = jsonData.map(row => {
        return columns.map(fieldName => {
            let field = row[fieldName] || '';
            // Handle fields containing commas or newlines
            if (field.toString().includes(',') || field.toString().includes('\n')) {
                field = `"${field}"`;
            }
            return field;
        }).join(',');
    });

    const csvString = [csvColumns, ...csvRows].join('\n');
    console.log("CSV String:", csvString);
    return csvString;
}

// Assuming csvData is a string in CSV format
function createPreviewTable(csvData) {
    const rows = csvData.split('\n');
    let html = '<table><thead><tr>';

    // Add column headers
    const headers = rows[0].split(',');
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });

    html += '</tr></thead><tbody>';

    // Add rows
    for (let i = 1; i < Math.min(rows.length, 11); i++) { // Adjust number 11 as needed
        html += '<tr>';
        const cols = rows[i].split(',');
        cols.forEach(col => {
            html += `<td>${col}</td>`;
        });
        html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
}

function parseCSV(csvData, numQueries) {
    const lines = csvData.split('\n').slice(1); // Skip the header row
    let queries = [];

    for (let i = 0; i < Math.min(lines.length, numQueries); i++) {
        let columns = lines[i].split(',');
        if (columns.length > 0) {
            queries.push(columns[0]); // Assuming the query is in the first column
        }
    }

    return queries;
}

function calculateAttributePercentage(jsonData, attributeToRetrieve, attributeValue) {
    // Logging the start of the calculation process
    console.log("Starting calculation of attribute percentages...");
    console.log("JSON Data:", jsonData);
    console.log("Attribute to Retrieve:", attributeToRetrieve, "Attribute Value:", attributeValue);

    // Object to store the count of matching hits for each query
    let queryResults = {};

    // Loop through each query object in the jsonData
    jsonData.forEach(queryObj => {
        console.log("Processing query:", queryObj.query);

        // Initialize the count for this query
        queryResults[queryObj.query] = queryResults[queryObj.query] || { count: 0, totalHits: queryObj.hits.length };

        // Iterate through each hit in the hits array of the query
        queryObj.hits.forEach(hit => {
            console.log("Processing hit:", hit);

            // Check if the hit's attribute matches the specified value
            if (hit[attributeToRetrieve] === attributeValue) {
                // Increment the count for this query
                queryResults[queryObj.query].count += 1;
            }
        });

        console.log(`Processed results for query "${queryObj.query}":`, queryResults[queryObj.query]);
    });

    console.log("Accumulated Query Results:", queryResults);

    // Calculate percentages for each query
    let percentages = [];
    for (const query in queryResults) {
        // Calculate percentage
        let percentage = (queryResults[query].count / queryResults[query].totalHits) * 100;
        
        // Add the calculated percentage to the array
        percentages.push({ 
            query: query, 
            // Include the attribute value in the column header
            [`percentage of ${attributeToRetrieve} (${attributeValue})`]: percentage.toFixed(2),
            totalHits: queryResults[query].totalHits
        });

        console.log(`Calculated percentage for query "${query}": ${percentage.toFixed(2)}%`);
    }

    // Log the final percentages array
    console.log("Final Percentages:", percentages);
    return percentages;
}



