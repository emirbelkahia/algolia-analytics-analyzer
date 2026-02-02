# Algolia Analytics Analyzer

Analyze the composition of your Algolia search results by measuring the percentage of specific product types in top search queries.

**🔗 Tool:** [emirbelkahia.com/algolia-analytics-analyzer](https://emirbelkahia.com/algolia-analytics-analyzer/)

## What it does

This tool helps you understand what types of products appear in your search results by:
1. Extracting top searches from the Algolia Analytics API
2. Retrieving actual search hits via the Search API
3. Calculating the percentage of hits matching a specific attribute/value
4. Exporting results as CSV for analysis

## Use Cases

**Marketplace optimization:**
- Measure 1P (first-party) vs 3P (third-party) product distribution
- Track specific brand representation in search results
- Monitor seller diversity across top queries

**Inventory management:**
- Identify out-of-stock vs in-stock ratio in search results
- Measure availability across different product categories

**Business strategy:**
- Analyze high-margin vs low-margin product visibility
- Track premium vs standard product representation
- Monitor specific category distribution (e.g., organic, eco-friendly)

## How to use

1. **Access the tool:** Visit [emirbelkahia.com/algolia-analytics-analyzer](https://emirbelkahia.com/algolia-analytics-analyzer/)

2. **Configure your analysis:**
   - Enter your Algolia credentials (Application ID, API Key, Index Name)
   - Define the attribute and value to analyze (e.g., `seller_type:1P`, `in_stock:true`)
   - Set the number of top searches to analyze

3. **Run analysis:**
   - The tool fetches your top searches
   - For each query, retrieves search results
   - Calculates percentage of matching hits
   - Displays results in real-time

4. **Export results:**
   - Download the complete analysis as CSV
   - Use in spreadsheets for further analysis and reporting

## Technical Details

- **Frontend only:** Pure JavaScript, runs entirely in the browser
- **No backend:** Your API keys stay in your browser (never sent to external servers)
- **APIs used:**
  - Algolia Analytics API (top searches)
  - Algolia Search API (hit retrieval)

## Use Cases by Industry

**E-commerce Marketplaces:**
- Balance between own products and third-party sellers
- Ensure marketplace diversity in search results

**Retail:**
- Monitor brand representation across search queries
- Optimize product mix visibility

**Multi-brand Platforms:**
- Track premium vs economy brand distribution
- Analyze category representation

## Configuration Examples

```javascript
// Example 1: Marketplace analysis
attribute: "seller_type"
value: "1P"
// Result: % of first-party products in each query

// Example 2: Inventory monitoring
attribute: "in_stock"
value: "true"
// Result: % of available products in search results

// Example 3: Brand visibility
attribute: "brand"
value: "Nike"
// Result: % of Nike products across top searches

// Example 4: Margin analysis
attribute: "margin_category"
value: "high"
// Result: % of high-margin products in results
```

## About

Built for business analysts and e-commerce teams working with Algolia search.

**Author:** Emir Belkahia
**Role:** Customer Success Manager @ Algolia

## License

MIT License - Feel free to use and adapt for your needs.
