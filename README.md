# TSP MCP Server

A Model Context Protocol (MCP) server for solving the Traveling Salesman Problem (TSP). This server provides optimized algorithms to find the shortest route through a set of cities, making it easy to solve TSP problems through natural language interactions with Claude Desktop.

## Features

- 🚀 **Multiple Algorithms**: Dynamic Programming for small instances (≤10 cities), Nearest Neighbor + 2-opt heuristic for larger instances
- 🎯 **Optimal Solutions**: Guarantees optimal solutions for small problems, high-quality solutions for larger ones
- 🏙️ **Named Cities**: Support for both coordinate-only and named city inputs
- 📏 **Distance Calculation**: Calculate distances for custom routes
- 🔄 **Multiple Starting Points**: Tests multiple starting points to find better solutions

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Claude Desktop application

### Method 1: Install from npm (Coming Soon)

```bash
npm install -g tsp-mcp-server
```

### Method 2: Install from GitHub

1. Clone this repository:
```bash
git clone https://github.com/yourusername/tsp-mcp-server.git
cd tsp-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Link globally (optional):
```bash
npm link
```

## Claude Desktop Integration

To use this MCP server with Claude Desktop, add the following configuration to your Claude Desktop settings:

### On macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tsp-solver": {
      "command": "node",
      "args": ["/path/to/tsp-mcp-server/dist/index.js"]
    }
  }
}
```

### On Windows

Edit `%APPDATA%/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tsp-solver": {
      "command": "node",
      "args": ["C:\\path\\to\\tsp-mcp-server\\dist\\index.js"]
    }
  }
}
```

### If installed globally via npm link

```json
{
  "mcpServers": {
    "tsp-solver": {
      "command": "tsp-mcp-server"
    }
  }
}
```

## Usage Examples

Once integrated with Claude Desktop, you can use natural language to solve TSP problems:

### Basic TSP Problem

```
"I have 5 cities at these coordinates: (0,0), (1,2), (3,1), (2,4), (4,3). 
What's the shortest route to visit all cities and return to the starting point?"
```

### Named Cities

```
"Find the optimal delivery route for these locations:
- Seoul: (37.5665, 126.9780)
- Busan: (35.1796, 129.0756)  
- Incheon: (37.4563, 126.7052)
- Daegu: (35.8714, 128.6014)
- Daejeon: (36.3504, 127.3845)"
```

### Route Distance Calculation

```
"Calculate the total distance if I visit cities in this order: 0 → 2 → 1 → 3 → 4
Cities are at: (0,0), (1,2), (3,1), (2,4), (4,3)"
```

## Available Tools

The server provides three main tools:

### 1. `solve_tsp`
Solves TSP for cities with x,y coordinates.

**Input:**
```json
{
  "cities": [
    {"x": 0, "y": 0},
    {"x": 1, "y": 2},
    {"x": 3, "y": 1}
  ]
}
```

### 2. `solve_tsp_with_names`
Solves TSP for named cities with coordinates.

**Input:**
```json
{
  "cities": [
    {"name": "Seoul", "x": 37.5665, "y": 126.9780},
    {"name": "Busan", "x": 35.1796, "y": 129.0756},
    {"name": "Incheon", "x": 37.4563, "y": 126.7052}
  ]
}
```

### 3. `calculate_route_distance`
Calculates the total distance for a specific route.

**Input:**
```json
{
  "cities": [
    {"x": 0, "y": 0},
    {"x": 1, "y": 2},
    {"x": 3, "y": 1}
  ],
  "route": [0, 2, 1]
}
```

## Algorithms

### Dynamic Programming (Held-Karp)
- **Used for**: Problems with ≤10 cities
- **Time Complexity**: O(n²2ⁿ)
- **Space Complexity**: O(n2ⁿ)
- **Guarantees**: Optimal solution

### Nearest Neighbor + 2-opt
- **Used for**: Problems with >10 cities
- **Time Complexity**: O(n³) for 2-opt improvement
- **Approach**: 
  1. Try multiple starting points with Nearest Neighbor
  2. Improve each solution with 2-opt local search
  3. Return the best solution found

## Development

### Running in Development Mode

```bash
npm run dev
```

### Testing the Server

You can test the server directly:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

### Building

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Make sure you've run `npm install` and `npm run build`
2. **Permission denied**: On Unix systems, you might need to make the file executable: `chmod +x dist/index.js`
3. **Claude Desktop not recognizing the server**: Check that the path in your config file is correct and absolute

### Getting Help

If you encounter issues:
1. Check the [Issues](https://github.com/yourusername/tsp-mcp-server/issues) page
2. Create a new issue with:
   - Your operating system
   - Node.js version (`node --version`)
   - Error messages
   - Steps to reproduce

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Implements classic TSP algorithms adapted for practical use
- Inspired by the need for accessible optimization tools 