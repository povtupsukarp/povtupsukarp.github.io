#!/usr/bin/env python3
"""
POE Lifeforce Price Fetcher
Fetches current lifeforce prices from poe.ninja API and updates the calculator
"""

import requests
import json
import time
from datetime import datetime

class LifeforcePriceFetcher:
    def __init__(self):
        self.base_url = "https://poe.ninja/api/data/currencyoverview"
        self.league = "Mercenaries"  # Current league
        self.price_file = "lifeforce_prices.json"
        
    def fetch_prices(self):
        """Fetch current lifeforce prices from poe.ninja"""
        try:
            params = {
                'league': self.league,
                'type': 'Currency'
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract lifeforce prices
            lifeforce_items = {
                'Wild Crystallised Lifeforce': 'wild',
                'Vivid Crystallised Lifeforce': 'vivid',
                'Primal Crystallised Lifeforce': 'primal'
            }
            
            prices = {}
            divine_chaos_ratio = 0
            
            for item in data.get('lines', []):
                currency_name = item.get('currencyTypeName', '')
                
                # Check for Divine Orb ratio
                if currency_name == 'Divine Orb':
                    chaos_equiv = item.get('chaosEquivalent', 0)
                    receive_value = item.get('receive', {}).get('value', 0) if item.get('receive') else 0
                    
                    # Use receive.value (chaos per divine) or chaosEquivalent as fallback
                    if receive_value > 0:
                        divine_chaos_ratio = receive_value
                    elif chaos_equiv > 0:
                        divine_chaos_ratio = chaos_equiv
                    else:
                        divine_chaos_ratio = 0
                
                if currency_name in lifeforce_items:
                    
                    # Try different fields to get the correct values
                    chaos_equiv = item.get('chaosEquivalent', 0)
                    pay_value = item.get('pay', {}).get('value', 1) if item.get('pay') else 1
                    receive_value = item.get('receive', {}).get('value', 1) if item.get('receive') else 1
                    
                    
                    # Use 1/receive_value method (matches website calculation)
                    if receive_value > 0:
                        # receive_value represents how much lifeforce you get for 1 chaos
                        # So: 1 chaos = receive_value lifeforce
                        # Therefore: 1 chaos = 1/receive_value lifeforce
                        lifeforce_per_chaos = 1 / receive_value
                        price_per_unit = receive_value
                    elif chaos_equiv > 0:
                        # Fallback to chaosEquivalent
                        price_per_unit = chaos_equiv
                        lifeforce_per_chaos = 1 / chaos_equiv
                    else:
                        price_per_unit = 0
                        lifeforce_per_chaos = 0
                    
                    prices[lifeforce_items[currency_name]] = {
                        'price': round(price_per_unit, 4),
                        'lifeforce_per_chaos': round(lifeforce_per_chaos, 1),
                        'chaos_equivalent': chaos_equiv,
                        'pay_value': pay_value,
                        'receive_value': receive_value,
                        'currency_name': currency_name
                    }
            
            # Add divine/chaos ratio to results
            result = {
                'lifeforce_prices': prices,
                'divine_chaos_ratio': divine_chaos_ratio
            }
            
            return result
            
        except requests.RequestException as e:
            print(f"Error fetching prices: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return None
    
    def save_prices(self, data):
        """Save prices to JSON file"""
        if not data:
            return False
            
        price_data = {
            'last_updated': datetime.now().isoformat(),
            'league': self.league,
            'prices': data['lifeforce_prices'],
            'divine_chaos_ratio': data['divine_chaos_ratio']
        }
        
        try:
            with open(self.price_file, 'w') as f:
                json.dump(price_data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving prices: {e}")
            return False
    
    def load_prices(self):
        """Load prices from JSON file"""
        try:
            with open(self.price_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return None
        except json.JSONDecodeError as e:
            print(f"Error loading prices: {e}")
            return None
    
    def update_html_prices(self, data):
        """Update the HTML file with new prices"""
        if not data:
            return False
            
        prices = data['lifeforce_prices']
            
        html_file = 'index.html'
        
        try:
            with open(html_file, 'r') as f:
                content = f.read()
            
            # Update default values in HTML with lifeforce_per_chaos rates
            replacements = {
                f'id="vividRate" class="price-input" value="{prices["vivid"]["lifeforce_per_chaos"]}"': 
                f'id="vividRate" class="price-input" value="{prices["vivid"]["lifeforce_per_chaos"]}"',
                
                f'id="primalRate" class="price-input" value="{prices["primal"]["lifeforce_per_chaos"]}"': 
                f'id="primalRate" class="price-input" value="{prices["primal"]["lifeforce_per_chaos"]}"',
                
                f'id="wildRate" class="price-input" value="{prices["wild"]["lifeforce_per_chaos"]}"': 
                f'id="wildRate" class="price-input" value="{prices["wild"]["lifeforce_per_chaos"]}"'
            }
            
            # Find and replace the current values
            import re
            
            # Update vivid rate
            content = re.sub(
                r'id="vividRate" class="price-input" value="[^"]*"',
                f'id="vividRate" class="price-input" value="{prices["vivid"]["lifeforce_per_chaos"]}"',
                content
            )
            
            # Update primal rate
            content = re.sub(
                r'id="primalRate" class="price-input" value="[^"]*"',
                f'id="primalRate" class="price-input" value="{prices["primal"]["lifeforce_per_chaos"]}"',
                content
            )
            
            # Update wild rate
            content = re.sub(
                r'id="wildRate" class="price-input" value="[^"]*"',
                f'id="wildRate" class="price-input" value="{prices["wild"]["lifeforce_per_chaos"]}"',
                content
            )
            
            with open(html_file, 'w') as f:
                f.write(content)
            
            return True
            
        except Exception as e:
            print(f"Error updating HTML: {e}")
            return False
    
    def run(self):
        """Main function to fetch and update prices"""
        print("Fetching lifeforce prices from poe.ninja...")
        
        data = self.fetch_prices()
        
        if data:
            prices = data['lifeforce_prices']
            divine_ratio = data['divine_chaos_ratio']
            
            print(f"Successfully fetched prices for {len(prices)} lifeforce types:")
            print(f"Divine Orb: {divine_ratio:.1f} chaos per divine")
            print("")
            
            for lifeforce_type, price_data in prices.items():
                print(f"  {price_data['currency_name']}: {price_data['lifeforce_per_chaos']} per 1 chaos ({price_data['price']} chaos each)")
                print(f"    (Pay {price_data['pay_value']} chaos → Get {price_data['receive_value']} lifeforce)")
            
            # Save to file
            if self.save_prices(data):
                print("Prices saved to file")
            
            # Update HTML
            if self.update_html_prices(data):
                print("HTML updated with new prices")
            
            return True
        else:
            print("Failed to fetch prices")
            return False

def main():
    fetcher = LifeforcePriceFetcher()
    
    # Try to get current league from command line or use default
    import sys
    if len(sys.argv) > 1:
        fetcher.league = sys.argv[1]
        print(f"Using league: {fetcher.league}")
    
    success = fetcher.run()
    
    if success:
        print("Price update completed successfully!")
    else:
        print("Price update failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()