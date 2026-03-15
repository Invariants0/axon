#!/usr/bin/env python3
"""
Wrapper script for generate_report.py
The main scripts have been moved to the analysis/ folder for better organization.
This script calls the main report generation script from the analysis/ directory.

Usage:
    python generate_report.py
    
The actual script is located in: ../analysis/generate_report.py
"""

import sys
import os
from pathlib import Path

# Get paths
script_dir = Path(__file__).parent
root_dir = script_dir.parent  # Parent of backend/
report_script = root_dir / 'analysis' / 'generate_report.py'

print(f"📈 Generating report from: {report_script}")
print()

if __name__ == '__main__':
    # Change to analysis directory so relative paths work
    os.chdir(report_script.parent)
    
    # Execute the report generation script
    with open(report_script, encoding='utf-8') as f:
        code = compile(f.read(), str(report_script), 'exec')
        exec(code)
