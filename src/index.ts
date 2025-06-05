#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TSPSolver, City, TSPResult } from './tsp-solver.js';
import { ImageTSPVisualizer, ImageVisualizationOptions } from './image-visualizer.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';

interface NamedCity extends City {
  name: string;
}

class TSPMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'tsp-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error: any) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'solve_tsp',
          description: 'Solve the Traveling Salesman Problem for a given set of cities with x,y coordinates. Returns the optimal route and total distance.',
          inputSchema: {
            type: 'object',
            properties: {
              cities: {
                type: 'array',
                description: 'Array of cities with x and y coordinates',
                items: {
                  type: 'object',
                  properties: {
                    x: {
                      type: 'number',
                      description: 'X coordinate of the city'
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate of the city'
                    }
                  },
                  required: ['x', 'y']
                }
              }
            },
            required: ['cities']
          }
        },
        {
          name: 'solve_tsp_with_names',
          description: 'Solve TSP with named cities. Input cities with names and coordinates, get back an optimal route with city names.',
          inputSchema: {
            type: 'object',
            properties: {
              cities: {
                type: 'array',
                description: 'Array of cities with names and coordinates',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name of the city'
                    },
                    x: {
                      type: 'number',
                      description: 'X coordinate of the city'
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate of the city'
                    }
                  },
                  required: ['name', 'x', 'y']
                }
              }
            },
            required: ['cities']
          }
        },
        {
          name: 'calculate_route_distance',
          description: 'Calculate the total distance for a given route through cities.',
          inputSchema: {
            type: 'object',
            properties: {
              cities: {
                type: 'array',
                description: 'Array of cities with x and y coordinates',
                items: {
                  type: 'object',
                  properties: {
                    x: {
                      type: 'number',
                      description: 'X coordinate of the city'
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate of the city'
                    }
                  },
                  required: ['x', 'y']
                }
              },
              route: {
                type: 'array',
                description: 'Array of city indices representing the route order',
                items: {
                  type: 'number'
                }
              }
            },
            required: ['cities', 'route']
          }
        },
        {
          name: 'visualize_tsp_route',
          description: 'Generate a PNG image visualization of a TSP route. Creates high-quality images with professional styling.',
          inputSchema: {
            type: 'object',
            properties: {
              cities: {
                type: 'array',
                description: 'Array of cities with x and y coordinates',
                items: {
                  type: 'object',
                  properties: {
                    x: {
                      type: 'number',
                      description: 'X coordinate of the city'
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate of the city'
                    },
                    name: {
                      type: 'string',
                      description: 'Optional name of the city'
                    }
                  },
                  required: ['x', 'y']
                }
              },
              route: {
                type: 'array',
                description: 'Array of city indices representing the route order',
                items: {
                  type: 'number'
                }
              },
              options: {
                type: 'object',
                description: 'Optional visualization settings',
                properties: {
                  width: {
                    type: 'number',
                    description: 'Image width in pixels (default: 800)'
                  },
                  height: {
                    type: 'number',
                    description: 'Image height in pixels (default: 600)'
                  },
                  showLabels: {
                    type: 'boolean',
                    description: 'Whether to show city labels (default: true)'
                  },
                  showDistance: {
                    type: 'boolean',
                    description: 'Whether to show total distance (default: true)'
                  },
                  style: {
                    type: 'string',
                    description: 'Visual style theme',
                    enum: ['modern', 'minimal', 'colorful', 'dark'],
                    default: 'modern'
                  }
                }
              }
            },
            required: ['cities', 'route']
          }
        },
        {
          name: 'solve_and_visualize_tsp',
          description: 'Solve TSP and generate an instant PNG image visualization with professional styling.',
          inputSchema: {
            type: 'object',
            properties: {
              cities: {
                type: 'array',
                description: 'Array of cities with x and y coordinates',
                items: {
                  type: 'object',
                  properties: {
                    x: {
                      type: 'number',
                      description: 'X coordinate of the city'
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate of the city'
                    },
                    name: {
                      type: 'string',
                      description: 'Optional name of the city'
                    }
                  },
                  required: ['x', 'y']
                }
              },
              options: {
                type: 'object',
                description: 'Optional visualization settings',
                properties: {
                  width: {
                    type: 'number',
                    description: 'Width in pixels (default: 800)'
                  },
                  height: {
                    type: 'number',
                    description: 'Height in pixels (default: 600)'
                  },
                  showLabels: {
                    type: 'boolean',
                    description: 'Whether to show city labels (default: true)'
                  },
                  showDistance: {
                    type: 'boolean',
                    description: 'Whether to show total distance (default: true)'
                  },
                  style: {
                    type: 'string',
                    description: 'Visual style theme',
                    enum: ['modern', 'minimal', 'colorful', 'dark'],
                    default: 'modern'
                  }
                }
              }
            },
            required: ['cities']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'solve_tsp':
            return await this.handleSolveTSP(args);
          
          case 'solve_tsp_with_names':
            return await this.handleSolveTSPWithNames(args);
          
          case 'calculate_route_distance':
            return await this.handleCalculateRouteDistance(args);

          case 'visualize_tsp_route':
            return await this.handleVisualizeTSPRoute(args);

          case 'solve_and_visualize_tsp':
            return await this.handleSolveAndVisualizeTSP(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error}`
        );
      }
    });
  }

  private createSafeOutputDir(): string {
    try {
      // Try to create in current working directory first
      const cwd = process.cwd();
      const outputDir = path.join(cwd, 'visualizations');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true, mode: 0o755 });
      }
      
      // Test write access
      const testFile = path.join(outputDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      return outputDir;
    } catch (error) {
      try {
        // Try user home directory
        const homeDir = os.homedir();
        const outputDir = path.join(homeDir, 'tsp-visualizations');
        
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true, mode: 0o755 });
        }
        
        // Test write access
        const testFile = path.join(outputDir, 'test-write.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
        return outputDir;
      } catch (homeError) {
        try {
          // Fallback to temp directory
          const tempDir = os.tmpdir();
          const outputDir = path.join(tempDir, 'tsp-mcp-visualizations');
          
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true, mode: 0o755 });
          }
          
          // Test write access
          const testFile = path.join(outputDir, 'test-write.tmp');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          
          return outputDir;
        } catch (tempError) {
          throw new Error(`Unable to create output directory. CWD: ${error}, Home: ${homeError}, Temp: ${tempError}`);
        }
      }
    }
  }

  private async handleSolveTSP(args: any) {
    if (!args.cities || !Array.isArray(args.cities)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Cities must be provided as an array'
      );
    }

    const cities: City[] = args.cities.map((city: any, index: number) => {
      if (typeof city.x !== 'number' || typeof city.y !== 'number') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `City at index ${index} must have numeric x and y coordinates`
        );
      }
      return { x: city.x, y: city.y };
    });

    if (cities.length < 2) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least 2 cities are required to solve TSP'
      );
    }

    const solver = new TSPSolver(cities);
    const result = solver.solve();

    return {
      content: [
        {
          type: 'text',
          text: `TSP Solution:
📍 Number of cities: ${cities.length}
🗺️  Optimal route: ${result.route.join(' → ')} → ${result.route[0]}
📏 Total distance: ${result.totalDistance.toFixed(2)} units

Route Details:
${result.route.map((cityIndex, i) => {
  const city = cities[cityIndex];
  return `${i + 1}. City ${cityIndex}: (${city.x}, ${city.y})`;
}).join('\n')}

The algorithm used: ${cities.length <= 10 ? 'Dynamic Programming (optimal)' : 'Nearest Neighbor + 2-opt (heuristic)'}`,
        }
      ]
    };
  }

  private async handleSolveTSPWithNames(args: any) {
    if (!args.cities || !Array.isArray(args.cities)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Cities must be provided as an array'
      );
    }

    const namedCities = args.cities.map((city: any, index: number) => {
      if (typeof city.x !== 'number' || typeof city.y !== 'number') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `City at index ${index} must have numeric x and y coordinates`
        );
      }
      if (typeof city.name !== 'string') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `City at index ${index} must have a name`
        );
      }
      return { x: city.x, y: city.y, name: city.name };
    });

    if (namedCities.length < 2) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least 2 cities are required to solve TSP'
      );
    }

    const cities: City[] = namedCities.map((city: NamedCity) => ({ x: city.x, y: city.y }));
    const solver = new TSPSolver(cities);
    const result = solver.solve();

    return {
      content: [
        {
          type: 'text',
          text: `TSP Solution with Named Cities:
📍 Number of cities: ${namedCities.length}
🗺️  Optimal route: ${result.route.map(i => namedCities[i].name).join(' → ')} → ${namedCities[result.route[0]].name}
📏 Total distance: ${result.totalDistance.toFixed(2)} units

Route Details:
${result.route.map((cityIndex, i) => {
  const city = namedCities[cityIndex];
  return `${i + 1}. ${city.name}: (${city.x}, ${city.y})`;
}).join('\n')}

The algorithm used: ${namedCities.length <= 10 ? 'Dynamic Programming (optimal)' : 'Nearest Neighbor + 2-opt (heuristic)'}`,
        }
      ]
    };
  }

  private async handleCalculateRouteDistance(args: any) {
    if (!args.cities || !Array.isArray(args.cities)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Cities must be provided as an array'
      );
    }

    if (!args.route || !Array.isArray(args.route)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Route must be provided as an array of city indices'
      );
    }

    const cities: City[] = args.cities.map((city: any, index: number) => {
      if (typeof city.x !== 'number' || typeof city.y !== 'number') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `City at index ${index} must have numeric x and y coordinates`
        );
      }
      return { x: city.x, y: city.y };
    });

    const route: number[] = args.route;

    // Validate route indices
    for (const cityIndex of route) {
      if (cityIndex < 0 || cityIndex >= cities.length) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid city index ${cityIndex} in route`
        );
      }
    }

    const solver = new TSPSolver(cities);
    const distance = solver.calculateRouteDistance(route);

    return {
      content: [
        {
          type: 'text',
          text: `Route Distance Calculation:
🗺️  Route: ${route.join(' → ')} → ${route[0]}
📏 Total distance: ${distance.toFixed(2)} units

Route breakdown:
${route.map((cityIndex, i) => {
  const nextIndex = (i + 1) % route.length;
  const nextCityIndex = route[nextIndex];
  const city = cities[cityIndex];
  const nextCity = cities[nextCityIndex];
  const segmentDistance = Math.sqrt(
    Math.pow(nextCity.x - city.x, 2) + Math.pow(nextCity.y - city.y, 2)
  );
  return `${i + 1}. City ${cityIndex} → City ${nextCityIndex}: ${segmentDistance.toFixed(2)} units`;
}).join('\n')}`,
        }
      ]
    };
  }

  private async handleVisualizeTSPRoute(args: any) {
    if (!args.cities || !Array.isArray(args.cities)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Cities must be provided as an array'
      );
    }

    if (!args.route || !Array.isArray(args.route)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Route must be provided as an array of city indices'
      );
    }

    const cities: (City & { name?: string })[] = args.cities.map((city: any, index: number) => {
      if (typeof city.x !== 'number' || typeof city.y !== 'number') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `City at index ${index} must have numeric x and y coordinates`
        );
      }
      return { 
        x: city.x, 
        y: city.y, 
        name: city.name || `City ${index}` 
      };
    });

    const route: number[] = args.route;

    // Validate route indices
    for (const cityIndex of route) {
      if (cityIndex < 0 || cityIndex >= cities.length) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid city index ${cityIndex} in route`
        );
      }
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < route.length; i++) {
      const from = cities[route[i]];
      const to = cities[route[(i + 1) % route.length]];
      totalDistance += Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    }

    // Generate image visualization
    try {
      const imageVisualizer = new ImageTSPVisualizer(args.options);
      const base64Data = imageVisualizer.generatePNGBase64(cities, route, totalDistance, args.options);

      const outputDir = this.createSafeOutputDir();
      
      const timestamp = Date.now();
      const imagePath = path.join(outputDir, `tsp-route-${timestamp}.png`);
      
      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(imagePath, imageBuffer);
      
      // Open image automatically (macOS)
      exec(`open "${imagePath}"`, (error) => {
        if (error) {
          // Silently fail - don't log to stdout
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `TSP Route Visualization Complete!

Route: ${route.join(' → ')} → ${route[0]}
Total Distance: ${totalDistance.toFixed(2)} units
Cities: ${cities.length}

Route Details:
${route.map((cityIndex, i) => {
  const city = cities[cityIndex];
  return `${i + 1}. ${city.name} (${cityIndex})`;
}).join(' → ')} → ${cities[route[0]].name} (${route[0]})

Image saved: ${imagePath}
Auto-opened: Image viewer launched
Styles available: modern, dark, minimal, colorful`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `TSP Route Data (Visualization failed)

Route: ${route.join(' → ')} → ${route[0]}
Total Distance: ${totalDistance.toFixed(2)} units
Cities: ${cities.length}

Route Details:
${route.map((cityIndex, i) => {
  const city = cities[cityIndex];
  return `${i + 1}. ${city.name} (${cityIndex})`;
}).join(' → ')} → ${cities[route[0]].name} (${route[0]})

Visualization Error: ${error}
Note: Route data available, but visualization failed.`
          }
        ]
      };
    }
  }

  private async handleSolveAndVisualizeTSP(args: any) {
    if (!args.cities || !Array.isArray(args.cities)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Cities must be provided as an array'
      );
    }

    const cities: (City & { name?: string })[] = args.cities.map((city: any, index: number) => {
      if (typeof city.x !== 'number' || typeof city.y !== 'number') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `City at index ${index} must have numeric x and y coordinates`
        );
      }
      return { 
        x: city.x, 
        y: city.y, 
        name: city.name || `City ${index}` 
      };
    });

    if (cities.length < 2) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least 2 cities are required to solve TSP'
      );
    }

    const solver = new TSPSolver(cities);
    const result = solver.solve();

    // Generate instant image file (SVG HTML method removed)
    try {
      const imageVisualizer = new ImageTSPVisualizer(args.options);
      const base64Data = imageVisualizer.generatePNGBase64(cities, result.route, result.totalDistance, args.options);
      const outputDir = this.createSafeOutputDir();
      
      const timestamp = Date.now();
      const imagePath = path.join(outputDir, `tsp-solution-${timestamp}.png`);
      
      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(imagePath, imageBuffer);
      
      // Open image automatically (macOS)
      exec(`open "${imagePath}"`, (error) => {
        if (error) {
          // Silently fail - don't log to stdout
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `TSP Solution with Visualization Complete!

Number of cities: ${cities.length}
Optimal route: ${result.route.join(' → ')} → ${result.route[0]}
Total distance: ${result.totalDistance.toFixed(2)} units
Algorithm used: ${cities.length <= 10 ? 'Dynamic Programming (optimal solution)' : 'Nearest Neighbor + 2-opt (high-quality heuristic)'}

Route Details:
${result.route.map((cityIndex, i) => {
  const city = cities[cityIndex];
  return `${i + 1}. ${city.name}: (${city.x}, ${city.y})`;
}).join('\n')}

Image saved: ${imagePath}
Auto-opened: Image viewer launched
Styles available: modern, dark, minimal, colorful`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `TSP Solution Found (Visualization failed)

Number of cities: ${cities.length}
Optimal route: ${result.route.join(' → ')} → ${result.route[0]}
Total distance: ${result.totalDistance.toFixed(2)} units

Route Details:
${result.route.map((cityIndex, i) => {
  const city = cities[cityIndex];
  return `${i + 1}. ${city.name}: (${city.x}, ${city.y})`;
}).join('\n')}

Visualization Error: ${errorMessage}
Note: TSP solution computed successfully, but image generation failed.`
          }
        ]
      };
    }
  }
}

// Start the MCP server
async function main() {
  const server = new TSPMCPServer();
  await server.run();
}

main().catch(console.error);