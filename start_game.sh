#!/bin/bash
# Script to start the game correctly

echo "Starting Local Server..."

# Check if port 8000 is open, if not start server
if ! lsof -i :8000 > /dev/null; then
    python3 -m http.server 8000 &
    PID=$!
    echo "Server started on PID $PID"
else
    echo "Server is already running."
fi

echo "Opening Game in Browser..."
sleep 1
open "http://localhost:8000"
