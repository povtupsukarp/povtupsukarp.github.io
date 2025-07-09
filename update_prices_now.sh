#!/bin/bash
# Manual price update script

echo "Updating lifeforce prices..."
echo "=========================="

# Change to script directory
cd "$(dirname "$0")"

# Run the price fetcher
python3 fetch_prices.py Standard

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Prices updated successfully!"
    echo ""
    echo "Current prices:"
    if [ -f "lifeforce_prices.json" ]; then
        python3 -c "
import json
from datetime import datetime
with open('lifeforce_prices.json', 'r') as f:
    data = json.load(f)
    last_updated = datetime.fromisoformat(data['last_updated'].replace('Z', '+00:00'))
    print(f'Last updated: {last_updated.strftime(\"%Y-%m-%d %H:%M:%S\")}')
    print(f'League: {data[\"league\"]}')
    print()
    for lf_type, info in data['prices'].items():
        print(f'{info[\"currency_name\"]}:')
        print(f'  • {info[\"lifeforce_per_chaos\"]} lifeforce per 1 chaos')
        print(f'  • {info[\"price\"]} chaos per lifeforce')
        print()
"
    fi
    echo ""
    echo "📱 Refresh your browser to see the updated prices!"
else
    echo "❌ Price update failed!"
    exit 1
fi