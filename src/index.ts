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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TSP MCP server running on stdio');
  }
}

const server = new TSPMCPServer();
server.run().catch(console.error); 