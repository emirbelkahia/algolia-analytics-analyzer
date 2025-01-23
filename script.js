/*
███████╗██╗   ██╗███████╗███╗   ██╗████████╗    ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ███████╗██████╗ ███████╗
██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝    ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██╔════╝██╔══██╗██╔════╝
█████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║       ███████║███████║██╔██╗ ██║██║  ██║██║     █████╗  ██████╔╝███████╗
██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║       ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██╔══╝  ██╔══██╗╚════██║
███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║       ██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗███████╗██║  ██║███████║
╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝
*/

/*
███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗     ██╗
██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║    ███║
███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║    ╚██║
╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║     ██║
███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║     ██║
╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚═╝
*/

/**
 * 1) Dès que le DOM est chargé, on injecte le style tooltip, puis on gère le submit du form1.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Injecte un style tooltip dans <head>
    const style = document.createElement('style');
    style.innerHTML = `
    .tooltip {
        position: relative;
        display: inline-block;
        cursor: pointer;
        color: blue;
        text-decoration: underline;
    }

    .tooltip .tooltiptext {
        visibility: hidden;
        width: 220px;
        background-color: #fff;
        border: 1px solid #ccc;
        color: #000;
        text-align: center;
        padding: 5px;
        border-radius: 6px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -110px;
        box-shadow: 0px 0px 6px #aaa;
    }

    .tooltip:hover .tooltiptext {
        visibility: visible;
    }
    `;
    document.head.appendChild(style);

    // Form1 : extraction de l'analytics CSV
    document.getElementById('form1').addEventListener('submit', async (event) => {
        event.preventDefault();

        const analyticsApiKey = document.getElementById('analyticsApiKey').value;
        const applicationId = document.getElementById('applicationId').value;
        const indexName = document.getElementById('indexName').value;
        const debugMode = document.getElementById('debugModeCheckbox').checked;

        // Sauvegarde dans localStorage pour que Form2 puisse les relire
        localStorage.setItem('algoliaApplicationId', applicationId);
        localStorage.setItem('algoliaIndexName', indexName);
        
        // Optionnel : Start / End date
        const startDateValue = document.getElementById('startDate').value;
        const endDateValue = document.getElementById('endDate').value;

        console.log("Start Date:", startDateValue || "Not provided");
        console.log("End Date:", endDateValue || "Not provided");

        // Si debugMode => on saute l'appel API et on affiche direct la section 2
        if (debugMode) {
            document.getElementById('section2').style.display = 'block';
            document.getElementById('section2').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Prépare la query string pour l'Analytics API
        let queryString = `index=${indexName}&limit=1000`;
        if (startDateValue) queryString += `&startDate=${startDateValue}`;
        if (endDateValue) queryString += `&endDate=${endDateValue}`;

        console.log("Final Query String:", queryString);

        // Affiche un loader
        document.getElementById('loadingMessage1').style.display = 'block';

        try {
            const endpoints = [
                'https://analytics.algolia.com',
                'https://analytics.de.algolia.com'
            ];

            let searchData = null;

            // On essaie chaque endpoint jusqu'à ce qu'on récupère des données
            for (let endpoint of endpoints) {
                console.log(`Trying endpoint: ${endpoint}`);
                const response = await fetch(`${endpoint}/2/searches?${queryString}`, {
                    headers: {
                        'X-Algolia-API-Key': analyticsApiKey,
                        'X-Algolia-Application-Id': applicationId
                    }
                });

                if (response.ok) {
                    searchData = await response.json();

                    if (searchData?.searches?.length > 0) {
                        console.log(`Data retrieved from endpoint: ${endpoint}`);
                        break; // Stop après une récup réussie
                    }
                }

                console.error(`API request failed or no data at endpoint: ${endpoint}`);
            }

            if (!searchData || !searchData.searches || searchData.searches.length === 0) {
                // Pas de data => On affiche un message d'erreur + lien
                document.getElementById('output1').style.display = 'block';
                document.getElementById('output1').innerHTML = `
                    <p>Analytics are empty or could not be retrieved. Alternatively, you can download the CSV directly from the Algolia dashboard.</p>
                    <a href="https://github.com/emirbelkahia/algolia-analytics-analyzer/blob/e20eda990071b8e4d67472f4cf9602cf41da129b/retrieve-analytics-csv-file-from-algolia-dashboard.jpg?raw=true"
                        target="_blank" class="tooltip">
                        How to download from dashboard
                        <span class="tooltiptext">
                            <img src="https://github.com/emirbelkahia/algolia-analytics-analyzer/blob/e20eda990071b8e4d67472f4cf9602cf41da129b/retrieve-analytics-csv-file-from-algolia-dashboard.jpg?raw=true"
                                alt="Instructions" style="max-width:200px;">
                        </span>
                    </a>
                `;
                document.getElementById('output1').scrollIntoView({ behavior: 'smooth' });
                return;
            }

            // Convertit en CSV et affiche un aperçu de 10 lignes
            const csvData = convertToCSV(searchData.searches);
            const previewData = csvData.split('\n').slice(0, 11).join('\n');

            document.getElementById('output1').style.display = 'block';
            document.getElementById('output1').innerHTML = `
                <p>Preview of Top 10 Searches:</p>
                ${createPreviewTable(previewData)}
                <p>This is a preview of the first 10 lines. Download the full CSV file for complete data.</p>
            `;

            // Génère un nom de fichier
            const now = new Date();
            const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
            const filename = `top_searches_${dateTimeString}_${applicationId}_${indexName}.csv`;

            // Prépare un Blob pour le download CSV
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = filename;
            downloadLink.textContent = 'Download Full CSV File';
            document.getElementById('output1').appendChild(downloadLink);

            document.getElementById('output1').scrollIntoView({ behavior: 'smooth' });

            // Après la section 1, on passe à la section 2
            document.getElementById('section2').style.display = 'block';
            document.getElementById('section2').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("An error occurred:", error);
            document.getElementById('output1').style.display = 'block';
            document.getElementById('output1').innerHTML = `<p>An error occurred while retrieving analytics data.</p>`;
            document.getElementById('output1').scrollIntoView({ behavior: 'smooth' });
        } finally {
            // On masque le loader
            document.getElementById('loadingMessage1').style.display = 'none';
        }
    });
});


/*
███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗    ██████╗ 
██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║    ╚════██╗
███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║     █████╔╝
╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║    ██╔═══╝ 
███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║    ███████╗
╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚══════╝
*/  

/**
 * 2) Form2 : lit un CSV (colonne "search"), interroge l'index pour chaque query, génère un JSON consolidé.
 */
document.getElementById('form2').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Montre le message de chargement
    document.getElementById('loadingMessage2').style.display = 'block';
    console.log("Loading message should be visible now");

    try {
        console.log("Processing form for Section 2...");

        // Récup des champs
        const searchApiKey = document.getElementById('searchApiKey').value;
        const numSearchesToProcess = Math.min(document.getElementById('numSearchesToProcess').value, 1000);
        const attributeToRetrieve = document.getElementById('attributeToRetrieve').value;
        const numResults = document.getElementById('numResults').value;
        const csvFile = document.getElementById('csvFile').files[0];
        
        // rulesContexts éventuels
        const rulesContextValue = document.getElementById('rulesContext').value;
        let rulesContexts = [];
        if (rulesContextValue) {
            rulesContexts = rulesContextValue.split(',').map(item => item.trim());
            console.log("Captured rulesContexts:", rulesContexts);
        } else {
            console.log("No rulesContext provided.");
        }

        // On stocke l'attribut dans le localStorage
        localStorage.setItem('attributeToRetrieve', attributeToRetrieve);
        console.log("Stored attributeToRetrieve in local storage:", attributeToRetrieve);

        // On récupère l'appID et l'indexName
        const applicationId = localStorage.getItem('algoliaApplicationId');
        const indexName = localStorage.getItem('algoliaIndexName');
        console.log("Retrieved Application ID and Index Name:", applicationId, indexName);

        if (!applicationId || !indexName) {
            console.error('Algolia Application ID or Index Name is not set');
            return;
        }

        if (!csvFile) {
            console.log("No CSV file uploaded for Section 2");
            return;
        }

        // On lit le CSV avec FileReader
        let reader = new FileReader();
        reader.onload = async (e) => {
            const csvData = e.target.result;
            console.log("CSV file loaded, starting to parse queries...");

            // On utilise la fonction parseCSV 3-arguments (targetHeader = "search")
            const queries = parseCSV(csvData, "search", numSearchesToProcess);
            console.log("Extracted queries:", queries);

            // UserToken
            let randomToken = Math.random().toString(36).substring(2, 15);
            let userToken = `analytics-analyzer-${randomToken}`;
            console.log("UserToken Generated:", userToken);

            let results = [];

            // Boucle sur chaque query
            for (let query of queries) {
                console.log("Processing query:", query);

                let queryParams = {
                    query: query,
                    hitsPerPage: numResults,
                    attributesToRetrieve: [attributeToRetrieve, 'objectID'],
                    getRankingInfo: true,
                    analytics: false,
                    clickAnalytics: false,
                    userToken: userToken
                };

                // Ajout du ruleContexts
                if (rulesContexts.length > 0) {
                    queryParams['ruleContexts'] = rulesContexts;
                }

                let response = await fetch(`https://${applicationId}-dsn.algolia.net/1/indexes/${indexName}/query`, {
                    method: 'POST',
                    headers: {
                        'X-Algolia-API-Key': searchApiKey,
                        'X-Algolia-Application-Id': applicationId,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(queryParams)
                });

                if (!response.ok) {
                    console.error('Search API request failed for query:', query);
                    continue;
                }

                let data = await response.json();

                // On met l'attribut (ex: inStock) + objectID
                let queryResults = data.hits.map(hit => ({
                    [attributeToRetrieve]: getNestedAttribute(hit, attributeToRetrieve),
                    objectID: hit.objectID
                }));

                results.push({ query: query, hits: queryResults });
            }

            // On formate en JSON
            const formattedJson = JSON.stringify(results, null, 2);
            console.log("Formatted JSON ready for download:", formattedJson);

            // Nom de fichier
            const now = new Date();
            const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
            const filename = `search_results_${dateTimeString}_${applicationId}_${indexName}.json`;

            // Création Blob => download
            const dataBlob = new Blob([formattedJson], { type: 'application/json' });
            const downloadUrl = window.URL.createObjectURL(dataBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = filename;
            downloadLink.textContent = 'Download JSON File';

            // Preview (5 premiers items)
            let previewContent = JSON.stringify(results.slice(0, 5), null, 2);
            document.getElementById('output2').innerHTML = `
                <p>Preview of JSON File (first 5 entries):</p>
                <pre id="jsonPreview">${previewContent}</pre>
                <p>This is a preview. The full JSON file can be downloaded below.</p>
            `;
            document.getElementById('output2').appendChild(downloadLink);
            document.getElementById('output2').style.display = 'block';

            // Affiche la section 3
            document.getElementById('section3').style.display = 'block';
            document.getElementById('section3').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('loadingMessage2').style.display = 'none';
        };

        // On lit le fichier CSV
        reader.readAsText(csvFile);
    } catch (error) {
        console.error("An error occurred:", error);
        // Gérer les erreurs éventuelles
    } finally {
        // Masquer le loader
        document.getElementById('loadingMessage2').style.display = 'none';
    }
});

/**
 * parseCSV avec 3 arguments : csvData, targetHeader et maxRows
 * Extrait la colonne dont le header = targetHeader, et ne dépasse pas maxRows lignes
 */
function parseCSV(csvData, targetHeader, maxRows) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');

    // Trouver l'index
    const targetIndex = headers.indexOf(targetHeader);
    if (targetIndex === -1) {
        console.error(`Column "${targetHeader}" not found in the CSV headers.`);
        return [];
    }

    const queries = [];
    for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
        const cells = lines[i].split(',');
        if (cells[targetIndex]) {
            queries.push(cells[targetIndex].trim());
        }
    }
    return queries;
}

/**
 * Récupère un attribut potentiellement nested depuis un objet
 */
function getNestedAttribute(obj, path) {
    return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : null, obj);
}


/*
███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗    ██████╗ 
██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║    ╚════██╗
███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║     █████╔╝
╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║     ╚═══██╗
███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║    ██████╔╝
╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═════╝ 
*/

/**
 * 3) Form3 : traite un JSON (issues de form2) pour calculer un pourcentage de hits ayant une valeur d'attribut
 */
document.getElementById('form3').addEventListener('submit', async (event) => {
    event.preventDefault();

    console.log("Starting processing for Section 3...");

    // Fichier JSON + valeur de l'attribut
    const jsonFile = document.getElementById('jsonFile').files[0];
    const attributeValue = document.getElementById('attributeValue').value;
    const attributeToRetrieve = localStorage.getItem('attributeToRetrieve');

    if (!jsonFile) {
        console.log("No JSON file uploaded for Section 3");
        return;
    }

    let reader = new FileReader();
    reader.onload = async (e) => {
        const jsonData = JSON.parse(e.target.result);
        console.log("Loaded JSON data from file:", jsonData);

        // On calcule le % de hits dont l'attribut = attributeValue
        console.log(`Calculating percentages for attribute "${attributeToRetrieve}" with value "${attributeValue}"`);
        const percentages = calculateAttributePercentage(jsonData, attributeToRetrieve, attributeValue);

        if (percentages.length === 0) {
            console.log("No data to convert to CSV. The result is empty.");
            return;
        }

        console.log("Calculated percentages data:", percentages);

        // Convertir en CSV
        const csvData = convertToCSV(percentages);
        const previewData = csvData.split('\n').slice(0, 11).join('\n');

        // Affichage preview
        document.getElementById('output3').innerHTML = `
            <p>Preview of Analysis (first 10 lines):</p>
            ${createPreviewTable(previewData)}
            <p>This is a preview of the first 10 lines. The full CSV file can be downloaded below.</p>
        `;

        // Nom de fichier
        const now = new Date();
        const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        const applicationId = localStorage.getItem('algoliaApplicationId');
        const indexName = localStorage.getItem('algoliaIndexName');
        const filename = `attribute_analysis_${dateTimeString}_${applicationId}_${indexName}.csv`;

        // Blob => Download
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = filename;
        downloadLink.textContent = 'Download Full CSV File';
        document.getElementById('output3').appendChild(downloadLink);

        // Scroll vers output3
        document.getElementById('output3').style.display = 'block';
        document.getElementById('output3').scrollIntoView({ behavior: 'smooth' });
    };

    reader.readAsText(jsonFile);
});

/**
 * Convert an array of objects into CSV format
 */
function convertToCSV(jsonData) {
    if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
        console.log("No data to convert to CSV");
        return '';
    }

    // On récupère les colonnes (clés)
    const columns = Object.keys(jsonData[0]);
    console.log("CSV Columns:", columns);
    const csvColumns = columns.join(',');

    // Génération des lignes CSV
    const csvRows = jsonData.map(row => {
        return columns.map(fieldName => {
            let field = row[fieldName] || '';
            // Échapper si virgules / newlines
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

/**
 * Creates an HTML table as a preview of up to 10 rows of CSV data
 */
function createPreviewTable(csvData) {
    const rows = csvData.split('\n');
    let html = '<table><thead><tr>';

    // En‐tête
    const headers = rows[0].split(',');
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Lignes (max 10)
    for (let i = 1; i < Math.min(rows.length, 11); i++) {
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

/**
 * Calculate the percentage of hits that match a specific attribute value
 */
function calculateAttributePercentage(jsonData, attributeToRetrieve, attributeValue) {
    console.log("Starting calculation of attribute percentages...");
    console.log("JSON Data:", jsonData);
    console.log("Attribute to Retrieve:", attributeToRetrieve, "Attribute Value:", attributeValue);

    let percentages = [];

    jsonData.forEach(queryObj => {
        console.log("Processing query:", queryObj.query);
        let count = 0;

        queryObj.hits.forEach(hit => {
            let hitAttributeValue = String(hit[attributeToRetrieve]);
            if (hitAttributeValue === String(attributeValue)) {
                count += 1;
            }
        });

        let percentage = (count / queryObj.hits.length) * 100;
        percentages.push({ 
            query: queryObj.query, 
            [`percentage of ${attributeToRetrieve} (${attributeValue})`]: percentage.toFixed(2),
            totalHits: queryObj.hits.length
        });

        console.log(`Processed results for query "${queryObj.query}": Percentage - ${percentage.toFixed(2)}%, Total Hits - ${queryObj.hits.length}`);
    });

    console.log("Final Percentages:", percentages);
    return percentages;
}
