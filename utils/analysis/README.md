# Backend Analysis Tools

This folder contains tools for analyzing and documenting the AXON backend architecture and dependencies.

## Scripts

### `analyze_dependencies.py`
Parses the backend source code to extract:
- Module structure and hierarchy
- Internal and external imports
- Classes and functions per module
- Circular dependencies (if any)
- Architecture metrics

**Usage:**
```bash
python analyze_dependencies.py
```

**Output:** `DEPENDENCY_ANALYSIS.json`

### `generate_report.py`
Generates a comprehensive markdown report from the dependency analysis.

**Usage:**
```bash
python generate_report.py
```

**Output:** `REPOSITORY_INDEX_ANALYSIS.md`

**Includes:**
- Module layer breakdown
- Dependency graph visualization
- Integration point analysis
- Health report
- Phase-3 distributed infrastructure recommendations

### `generate_graph.py`
Generates visual graph representations of dependencies (if needed).

**Usage:**
```bash
python generate_graph.py
```

### `index.html` - Interactive Visualizer
Open in a web browser to visualize the architecture interactively.

**Features:**
- Interactive D3.js-based graph visualization
- Pan and zoom navigation
- Click nodes for layer details
- Color-coded layers
- Download as PNG

**Usage:**
```bash
# Simply open in browser
start index.html  # Windows
# or
open index.html   # macOS
# or
xdg-open index.html  # Linux
```

## Quick Start

Run the full analysis pipeline:
```bash
# From this directory
python analyze_dependencies.py && python generate_report.py && python generate_graph.py

# Then open the visualizer
start index.html
```

Or just view the visualizer:
```bash
start index.html  # Open interactive architecture diagram
```

## Output Files

- `DEPENDENCY_ANALYSIS.json` - Raw dependency data (machine-readable)
- `REPOSITORY_INDEX_ANALYSIS.md` - Formatted analysis report (human-readable)
- `DEPENDENCY_GRAPH.json` - Complete architecture with metrics and critical paths
- `GRAPH_VISUALIZATION.json` - Graph data for visualization
- `index.html` - Interactive visualization (open in browser)

## Architecture Analysis

The analysis tools provide insights into:
- **Layered Architecture** - API, Business Logic, Data layers
- **Service Orientation** - Clear separation of concerns
- **Agent Pattern** - Multiple specialized agents with base class
- **Plugin Architecture** - Dynamic skill loading via registry
- **Event-Driven** - EventBus for inter-component communication

## Notes

- All scripts use relative paths and can be run from any location
- JSON file updates reuse previous DEPENDENCY_ANALYSIS.json if available
- Reports include recommendations for Phase-3 distributed infrastructure scaling
