#!/usr/bin/env python3
"""
Simple HTTP server for POE Harvest Calculator
Serves the application on the local network
"""

import http.server
import socketserver
import socket
import os
import sys

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote address to get local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

def start_server(port=8080):
    """Start the HTTP server"""
    # Change to the directory containing the files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create server
    Handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", port), Handler) as httpd:
        local_ip = get_local_ip()
        print(f"POE Harvest Calculator Server")
        print(f"=" * 40)
        print(f"Server started successfully!")
        print(f"")
        print(f"Local access:")
        print(f"  http://localhost:{port}")
        print(f"  http://127.0.0.1:{port}")
        print(f"")
        print(f"Network access:")
        print(f"  http://{local_ip}:{port}")
        print(f"")
        print(f"Press Ctrl+C to stop the server")
        print(f"=" * 40)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Invalid port number. Using default port 8080.")
    
    start_server(port)