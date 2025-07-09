#!/bin/bash
# Start script for POE Harvest Calculator Server

echo "Starting POE Harvest Calculator Server..."
echo "=========================================="

# Kill any existing server processes
pkill -f "python3 -m http.server 8080"

# Start the server
cd "$(dirname "$0")"
python3 server.py 8080