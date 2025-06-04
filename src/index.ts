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
import { TSPVisualizer, VisualizationOptions } from './visualization.js';

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
          description: 'Generate an SVG visualization of a TSP route. Cities are shown as red dots, routes as blue lines.',
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
                    description: 'SVG width in pixels (default: 800)'
                  },
                  height: {
                    type: 'number',
                    description: 'SVG height in pixels (default: 600)'
                  },
                  showLabels: {
                    type: 'boolean',
                    description: 'Whether to show city labels (default: true)'
                  },
                  showDistance: {
                    type: 'boolean',
                    description: 'Whether to show total distance (default: true)'
                  }
                }
              }
            },
            required: ['cities', 'route']
          }
        },
        {
          name: 'solve_and_visualize_tsp',
          description: 'Solve TSP and generate an SVG visualization in one step. Returns both the solution and the visualization.',
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
                    description: 'SVG width in pixels (default: 800)'
                  },
                  height: {
                    type: 'number',
                    description: 'SVG height in pixels (default: 600)'
                  },
                  showLabels: {
                    type: 'boolean',
                    description: 'Whether to show city labels (default: true)'
                  },
                  showDistance: {
                    type: 'boolean',
                    description: 'Whether to show total distance (default: true)'
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

    const visualizer = new TSPVisualizer();
    const totalDistance = TSPVisualizer.calculateRouteDistance(cities, route);
    const svgVisualization = visualizer.generateSVG(cities, route, totalDistance, args.options);

    return {
      content: [
        {
          type: 'text',
          text: `📊 **TSP Route Visualization**

🗺️  Route: ${route.join(' → ')} → ${route[0]}
📏 Total Distance: ${totalDistance.toFixed(2)} units
📍 Cities: ${cities.length}

The visualization shows:
- 🔴 Red circles: Cities with index numbers
- 🔵 Blue lines: Route connections
- 📝 Labels: City names and visit order`
        },
        {
          type: 'text',
          text: svgVisualization
        }
      ]
    };
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

    const visualizer = new TSPVisualizer();
    const svgVisualization = visualizer.generateSVG(cities, result.route, result.totalDistance, args.options);

    return {
      content: [
        {
          type: 'text',
          text: `🎯 **TSP Solution Found!**

📍 Number of cities: ${cities.length}
🗺️  Optimal route: ${result.route.join(' → ')} → ${result.route[0]}
📏 Total distance: ${result.totalDistance.toFixed(2)} units

🏙️ **Route Details:**
${result.route.map((cityIndex, i) => {
  const city = cities[cityIndex];
  return `${i + 1}. ${city.name}: (${city.x}, ${city.y})`;
}).join('\n')}

🧠 **Algorithm used:** ${cities.length <= 10 ? 'Dynamic Programming (optimal solution)' : 'Nearest Neighbor + 2-opt (high-quality heuristic)'}

📊 **Visualization below shows:**
- 🔴 Red circles: Cities with index numbers  
- 🔵 Blue lines: Optimal route connections
- 📝 Labels: City names and visit order`
        },
        {
          type: 'text',
          text: svgVisualization
        }
      ]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TSP MCP server running on stdio');
  }
}

const server = new TSPMCPServer();
server.run().catch(console.error); 