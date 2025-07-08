#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR

# Build the project first
npm run build

# Run the stdio server with explicit environment variables
TRANSPORT_TYPE=stdio NUCLINO_API_KEY="$NUCLINO_API_KEY" node dist/index.js