#!/bin/sh
# Mac/Linux: run with  sh start-website.sh
cd "$(dirname "$0")/2016-roblox-main" || exit 1
command -v npm >/dev/null || { echo "Install Node.js LTS from https://nodejs.org first."; exit 1; }
[ -f config.json ] || sed 's|https://your.domain/|http://localhost:3000/|' config.example.json > config.json
[ -d node_modules ] || npm install --legacy-peer-deps
export NODE_OPTIONS=--openssl-legacy-provider
echo "Open http://localhost:3000/login in your browser. Ctrl+C to stop."
npm run dev
