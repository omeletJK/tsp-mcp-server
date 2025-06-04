export interface City {
  x: number;
  y: number;
  name?: string;
}

export interface VisualizationOptions {
  width?: number;
  height?: number;
  padding?: number;
  cityRadius?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  showDistance?: boolean;
}

export class TSPVisualizer {
  private defaultOptions: Required<VisualizationOptions> = {
    width: 800,
    height: 600,
    padding: 50,
    cityRadius: 8,
    strokeWidth: 2,
    showLabels: true,
    showDistance: true
  };

  /**
   * Generate SVG visualization of TSP route
   */
  generateSVG(
    cities: City[],
    route: number[],
    totalDistance?: number,
    options?: VisualizationOptions
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    
    if (cities.length === 0) {
      return this.createEmptySVG(opts);
    }

    const { normalizedCities, bounds } = this.normalizeCities(cities, opts);
    
    const svgElements: string[] = [];
    
    // Add route lines
    svgElements.push(this.generateRouteLines(normalizedCities, route, opts));
    
    // Add cities
    svgElements.push(this.generateCities(normalizedCities, opts));
    
    // Add labels if requested
    if (opts.showLabels) {
      svgElements.push(this.generateLabels(normalizedCities, route, opts));
    }
    
    // Add title and distance info
    const titleElements = this.generateTitle(totalDistance, cities.length, opts);
    
    return this.wrapInSVG(svgElements.join('\n'), titleElements, opts);
  }

  /**
   * Normalize city coordinates to fit within SVG bounds
   */
  private normalizeCities(cities: City[], options: Required<VisualizationOptions>) {
    if (cities.length === 0) {
      return { normalizedCities: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };
    }

    const xs = cities.map(city => city.x);
    const ys = cities.map(city => city.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const bounds = { minX, maxX, minY, maxY };
    
    // Calculate scaling factors
    const dataWidth = maxX - minX || 1;
    const dataHeight = maxY - minY || 1;
    const availableWidth = options.width - 2 * options.padding;
    const availableHeight = options.height - 2 * options.padding - 60; // Reserve space for title
    
    const scaleX = availableWidth / dataWidth;
    const scaleY = availableHeight / dataHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Center the visualization
    const offsetX = (availableWidth - dataWidth * scale) / 2;
    const offsetY = (availableHeight - dataHeight * scale) / 2;
    
    const normalizedCities = cities.map(city => ({
      ...city,
      x: options.padding + offsetX + (city.x - minX) * scale,
      y: options.padding + 60 + offsetY + (city.y - minY) * scale
    }));
    
    return { normalizedCities, bounds };
  }

  /**
   * Generate SVG path elements for the route
   */
  private generateRouteLines(cities: City[], route: number[], options: Required<VisualizationOptions>): string {
    if (route.length < 2) return '';
    
    const lines: string[] = [];
    
    for (let i = 0; i < route.length; i++) {
      const fromIndex = route[i];
      const toIndex = route[(i + 1) % route.length];
      
      if (fromIndex >= cities.length || toIndex >= cities.length) continue;
      
      const from = cities[fromIndex];
      const to = cities[toIndex];
      
      lines.push(`
        <line 
          x1="${from.x}" 
          y1="${from.y}" 
          x2="${to.x}" 
          y2="${to.y}" 
          stroke="#2563eb" 
          stroke-width="${options.strokeWidth}"
          stroke-linecap="round"
        />`);
    }
    
    return `<g id="route-lines">${lines.join('')}</g>`;
  }

  /**
   * Generate SVG circle elements for cities
   */
  private generateCities(cities: City[], options: Required<VisualizationOptions>): string {
    const circles = cities.map((city, index) => `
      <circle 
        cx="${city.x}" 
        cy="${city.y}" 
        r="${options.cityRadius}" 
        fill="#dc2626" 
        stroke="#ffffff" 
        stroke-width="2"
        opacity="0.9"
      />
      <text 
        x="${city.x}" 
        y="${city.y + 1}" 
        text-anchor="middle" 
        alignment-baseline="central" 
        fill="white" 
        font-family="Arial, sans-serif" 
        font-size="10" 
        font-weight="bold"
      >${index}</text>`
    ).join('');
    
    return `<g id="cities">${circles}</g>`;
  }

  /**
   * Generate labels for cities
   */
  private generateLabels(cities: City[], route: number[], options: Required<VisualizationOptions>): string {
    const labels = cities.map((city, index) => {
      const routePosition = route.indexOf(index);
      const label = city.name || `City ${index}`;
      const orderLabel = routePosition >= 0 ? ` (${routePosition + 1})` : '';
      
      return `
        <text 
          x="${city.x}" 
          y="${city.y + options.cityRadius + 15}" 
          text-anchor="middle" 
          fill="#374151" 
          font-family="Arial, sans-serif" 
          font-size="11"
          font-weight="500"
        >${label}${orderLabel}</text>`;
    }).join('');
    
    return `<g id="labels">${labels}</g>`;
  }

  /**
   * Generate title and distance information
   */
  private generateTitle(totalDistance?: number, cityCount?: number, options?: Required<VisualizationOptions>): string {
    const title = `TSP Solution${cityCount ? ` (${cityCount} cities)` : ''}`;
    const distanceText = totalDistance ? `Total Distance: ${totalDistance.toFixed(2)}` : '';
    
    return `
      <text x="${options!.width / 2}" y="25" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
        ${title}
      </text>
      ${distanceText ? `
        <text x="${options!.width / 2}" y="45" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">
          ${distanceText}
        </text>
      ` : ''}
    `;
  }

  /**
   * Wrap elements in SVG container
   */
  private wrapInSVG(content: string, title: string, options: Required<VisualizationOptions>): string {
    return `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .route-line { stroke: #2563eb; stroke-width: ${options.strokeWidth}; fill: none; }
    .city { fill: #dc2626; stroke: #ffffff; stroke-width: 2; }
    .city-label { fill: #374151; font-family: Arial, sans-serif; font-size: 11px; }
    .title { fill: #111827; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; }
    .distance { fill: #6b7280; font-family: Arial, sans-serif; font-size: 14px; }
  </style>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  
  <!-- Title -->
  ${title}
  
  <!-- Main content -->
  ${content}
</svg>`;
  }

  /**
   * Create empty SVG for edge cases
   */
  private createEmptySVG(options: Required<VisualizationOptions>): string {
    return `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  <text x="${options.width / 2}" y="${options.height / 2}" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="16">
    No cities to visualize
  </text>
</svg>`;
  }

  /**
   * Calculate distance between two cities
   */
  static calculateDistance(city1: City, city2: City): number {
    const dx = city1.x - city2.x;
    const dy = city1.y - city2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate total route distance
   */
  static calculateRouteDistance(cities: City[], route: number[]): number {
    if (route.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < route.length; i++) {
      const fromIndex = route[i];
      const toIndex = route[(i + 1) % route.length];
      
      if (fromIndex >= cities.length || toIndex >= cities.length) continue;
      
      totalDistance += this.calculateDistance(cities[fromIndex], cities[toIndex]);
    }
    
    return totalDistance;
  }
} 