#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Build the React app
echo "Building React app..."
npm run build

# Ensure the build directory exists
if [ ! -d "build" ]; then
  echo "Build directory not found! Ensure your build command creates a 'build' folder."
  exit 1
fi

# Deploy the build to /var/www/html
echo "Deploying build to /var/www/html..."
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/

# Restart Apache2 and the backend
echo "Restarting Apache2..."
sudo systemctl restart apache2
echo "Restarting backend using pm2 ..."
pm2 restart backend


echo "Deployment complete!"
