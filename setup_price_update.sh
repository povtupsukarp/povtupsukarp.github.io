#!/bin/bash
# Setup script for automatic lifeforce price updates

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/fetch_prices.py"
LOG_FILE="$SCRIPT_DIR/price_update.log"

echo "Setting up automatic lifeforce price updates..."

# Check if python3 and requests are available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed"
    exit 1
fi

# Check if requests library is available
if ! python3 -c "import requests" &> /dev/null; then
    echo "Installing requests library..."
    pip3 install requests
fi

# Make scripts executable
chmod +x "$PYTHON_SCRIPT"

# Create wrapper script for cron
cat > "$SCRIPT_DIR/update_prices.sh" << EOF
#!/bin/bash
# Wrapper script for price updates with logging

cd "$SCRIPT_DIR"
echo "\$(date): Starting price update..." >> "$LOG_FILE"

# Try to determine current league (you can modify this)
LEAGUE="Standard"  # Change to current league name

python3 "$PYTHON_SCRIPT" "\$LEAGUE" >> "$LOG_FILE" 2>&1

if [ \$? -eq 0 ]; then
    echo "\$(date): Price update completed successfully" >> "$LOG_FILE"
else
    echo "\$(date): Price update failed" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
EOF

chmod +x "$SCRIPT_DIR/update_prices.sh"

# Add to crontab (run daily at 9 AM)
CRON_JOB="0 9 * * * $SCRIPT_DIR/update_prices.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_DIR/update_prices.sh"; then
    echo "Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Cron job added: Daily price update at 9 AM"
fi

echo "Setup complete!"
echo ""
echo "Files created:"
echo "  - $PYTHON_SCRIPT (main price fetcher)"
echo "  - $SCRIPT_DIR/update_prices.sh (wrapper script)"
echo "  - Cron job scheduled for daily updates"
echo ""
echo "Manual usage:"
echo "  Run now: $SCRIPT_DIR/update_prices.sh"
echo "  Or: python3 $PYTHON_SCRIPT [league_name]"
echo ""
echo "Logs will be written to: $LOG_FILE"