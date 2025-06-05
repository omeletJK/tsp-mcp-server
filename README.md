# TSP MCP Server

A Model Context Protocol (MCP) server for solving the Traveling Salesman Problem (TSP). This server provides optimized algorithms to find the shortest route through a set of cities, making it easy to solve TSP problems through natural language interactions with Claude Desktop.

## Features

- 🚀 **Multiple Algorithms**: Dynamic Programming for small instances (≤10 cities), Nearest Neighbor + 2-opt heuristic for larger instances
- 🎯 **Optimal Solutions**: Guarantees optimal solutions for small problems, high-quality solutions for larger ones
- 🏙️ **Named Cities**: Support for both coordinate-only and named city inputs
- 📏 **Distance Calculation**: Calculate distances for custom routes
- 🔄 **Multiple Starting Points**: Tests multiple starting points to find better solutions
- 📊 **Visual Representations**: Generate beautiful SVG visualizations of TSP routes and solutions
- 🎨 **Customizable Visualizations**: Adjustable canvas size, colors, labels, and styling options

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
    "tsp-mcp-server": {
      "command": "/usr/local/bin/node",
      "args": ["/absolute/path/to/tsp-mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/tsp-mcp-server",
      "env": {
        "PATH": "/Users/yourusername/Library/Python/3.8/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/tsp-mcp-server` with the actual path where you cloned the repository (e.g., `/Users/yourusername/Cursor/tsp-mcp-server`).

### On Windows

Edit `%APPDATA%/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tsp-mcp-server": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\tsp-mcp-server\\dist\\index.js"],
      "cwd": "C:\\absolute\\path\\to\\tsp-mcp-server"
    }
  }
}
```

### Testing the Connection

After updating the configuration:

1. **Restart Claude Desktop** completely (quit and reopen)
2. **Test the connection** in a new conversation:
   ```
   Can you solve this TSP problem: cities at (0,0), (1,1), (2,0)?
   ```
3. **Check for errors** in Claude Desktop's developer console if the server doesn't respond

### Troubleshooting

- **Server not found**: Verify the absolute paths in your configuration
- **Node.js not found**: Use the full path to node (`/usr/local/bin/node` on macOS)
- **Permission issues**: Make sure the `dist/index.js` file is executable
- **Build not updated**: Run `npm run build` after making changes to the source code

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

### 🎨 **Visual TSP Solutions**

```
"Solve the TSP for these 4 cities and create an image visualization: 
(0,0), (5,3), (2,7), (8,1)"
```

```
"Create a dark-themed visualization of this route through Seoul, Busan, and Incheon"
```

```
"Show me a 1000x800 pixel colorful visualization of the optimal route through these delivery points"
```

## Available Tools

The server provides five powerful tools:

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

### 4. 🖼️ `visualize_tsp_route`
Generates a high-quality PNG image visualization of a TSP route.

**Features:**
- 🔴 Red circles for cities with index numbers
- 🔵 Blue lines for route connections  
- 📝 City labels with visit order
- 📏 Total distance display
- 🎨 Multiple style themes
- ⚡ Instant image file generation

**Input:**
```json
{
  "cities": [
    {"x": 0, "y": 0, "name": "Start"},
    {"x": 5, "y": 3, "name": "Middle"},
    {"x": 2, "y": 7, "name": "End"}
  ],
  "route": [0, 1, 2],
  "options": {
    "width": 1000,
    "height": 800,
    "showLabels": true,
    "showDistance": true,
    "style": "dark"
  }
}
```

### 5. 🚀 `solve_and_visualize_tsp`
Solves TSP and generates a beautiful image visualization in one step - the ultimate TSP tool!

**Features:**
- ⚡ One-step solution and visualization
- 🧠 Automatic algorithm selection (DP vs heuristic)
- 📊 Detailed solution breakdown
- 🖼️ Professional PNG image generation
- 📋 Comprehensive route information
- 🎨 Customizable styling themes

**Input:**
```json
{
  "cities": [
    {"x": 0, "y": 0, "name": "Warehouse"},
    {"x": 5, "y": 3, "name": "Store A"},
    {"x": 2, "y": 7, "name": "Store B"},
    {"x": 8, "y": 1, "name": "Store C"}
  ],
  "options": {
    "width": 800,
    "height": 600,
    "showLabels": true,
    "showDistance": true,
    "style": "modern"
  }
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

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Implements classic TSP algorithms adapted for practical use
- Inspired by the need for accessible optimization tools 

## 🎨 TSP MCP 서버의 시각화

TSP MCP 서버는 **고품질 PNG 이미지 시각화**를 제공합니다:

### **🖼️ 이미지 기반 시각화**
- **기술**: HTML5 Canvas + Node.js Canvas 라이브러리
- **구현**: `ImageTSPVisualizer` 클래스 (`src/image-visualizer.ts`)  
- **출력**: PNG 이미지 파일로 저장 후 자동 열기
- **장점**: 
  - 고품질 래스터 이미지
  - 다양한 스타일 테마 지원
  - 글로우 효과 등 고급 그래픽 효과
  - 외부 의존성 없이 독립 실행
  - Claude artifacts 없이 즉시 시스템 파일 생성

**지원하는 스타일 테마:**
```typescript
'modern'   // 기본 - 흰 배경, 빨간 도시, 파란 경로
'dark'     // 어두운 테마 - 검은 배경, 밝은 색상
'minimal'  // 미니멀 - 회색톤 단순한 디자인
'colorful' // 컬러풀 - 다채로운 색상 조합
```

## 🎯 시각화 사용 방법

### **TSP 해결 + 시각화 (권장)**
```json
{
  "name": "solve_and_visualize_tsp",
  "arguments": {
    "cities": [{"x": 0, "y": 0}, {"x": 5, "y": 3}],
    "options": {
      "style": "dark",
      "width": 1200,
      "height": 800
    }
  }
}
```

### **기존 경로 시각화**
```json
{
  "name": "visualize_tsp_route", 
  "arguments": {
    "cities": [{"x": 0, "y": 0}, {"x": 5, "y": 3}],
    "route": [0, 1],
    "options": {
      "style": "minimal"
    }
  }
}
``` 