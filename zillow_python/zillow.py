import requests, json, csv

url = 'https://www.zillow.com/los-angeles-ca/'
payload = {					
    'source': 'universal',
    'url': url,
    'user_agent_type': 'desktop',
    'render': 'html',
    'browser_instructions': [
        {
            'type': 'fetch_resource',
            'filter': 'https://www.zillow.com/async-create-search-page-state'
        }
    ]
}

response = requests.post(
    'https://realtime.oxylabs.io/v1/queries',
    auth=('MagnuM_oc0eI', '+uy=THDnnO0z5b7'),
    json=payload,
)

data = json.loads(response.json()['results'][0].get('content'))

listings = []
for listing in data['cat1']['searchResults']['mapResults']:
    listing = {
        'URL': 'https://www.zillow.com' + listing.get('detailUrl'),
        'Address': listing.get('address'),
        'Price': listing.get('price'),
        'Status': listing.get('statusText'),
        'Beds': listing.get('beds'),
        'Baths': listing.get('baths'),
        'Area (sqft)': listing.get('area'),
        'Image': listing.get('imgSrc'),
        'ZPID': listing.get('zpid')
    }
    listings.append(listing)

with open('zillow_listings.csv', 'w') as f:
    fieldnames = listings[0].keys()
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for item in listings:
        writer.writerow(item)