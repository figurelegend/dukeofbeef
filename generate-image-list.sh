#!/bin/bash
# Run this script to generate a list of available images
# Usage: ./generate-image-list.sh

echo "const availableImages = [" > images/image-list.js
for file in images/*.{jpg,png,jpeg,JPG,PNG,JPEG} 2>/dev/null; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "  '${filename}'," >> images/image-list.js
    fi
done
echo "];" >> images/image-list.js

echo "Image list generated in images/image-list.js"