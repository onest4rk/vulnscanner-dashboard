#!/bin/bash

set -e

usage() {
  echo "Usage: $0 -t TARGET -o OUTPUT_DIR"
  echo "  -t TARGET     Target IP, hostname, or CIDR range"
  echo "  -o OUTPUT_DIR Directory to save scan results"
  exit 1
}

while getopts "t:o:" opt; do
  case "$opt" in
    t) TARGET="$OPTARG" ;;
    o) OUTPUT_DIR="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$TARGET" ] || [ -z "$OUTPUT_DIR" ]; then
  usage
fi

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Error: Output directory does not exist: $OUTPUT_DIR"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${OUTPUT_DIR}/nmap_${TARGET}_${TIMESTAMP}.xml"

echo "Starting nmap scan of target: $TARGET"
echo "Output file: $OUTPUT_FILE"

nmap -sV -sC -O -oX "$OUTPUT_FILE" "$TARGET"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "Scan completed successfully: $OUTPUT_FILE"
else
  echo "Scan failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE
