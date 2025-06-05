import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { City } from './tsp-solver.js';

export interface ImageVisualizationOptions {
  width?: number;
  height?: number;
  showLabels?: boolean;
  showDistance?: boolean;
  backgroundColor?: string;
  cityColor?: string;
  routeColor?: string;
  textColor?: string;
  style?: 'modern' | 'minimal' | 'colorful' | 'dark';
}

export class ImageTSPVisualizer {
  private width: number;
  private height: number;
  private margin: number = 50;

  constructor(options: ImageVisualizationOptions = {}) {
    this.width = options.width || 800;
    this.height = options.height || 600;
  }

  generatePNGBase64(
    cities: (City & { name?: string })[],
    route: number[],
    totalDistance: number,
    options: ImageVisualizationOptions = {}
  ): string {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Apply styling
    const style = options.style || 'modern';
    const colors = this.getColorScheme(style);
    
    // Clear background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, this.width, this.height);

    // Calculate scaling
    const bounds = this.calculateBounds(cities);
    const scale = this.calculateScale(bounds);
    const offset = this.calculateOffset(bounds, scale);

    // Draw route lines
    this.drawRoute(ctx, cities, route, scale, offset, colors);

    // Draw cities
    this.drawCities(ctx, cities, scale, offset, colors, options.showLabels !== false);

    // Draw title and stats
    this.drawTitle(ctx, cities.length, totalDistance, colors);

    // Convert to base64
    return canvas.toDataURL('image/png').split(',')[1];
  }

  private getColorScheme(style: string) {
    switch (style) {
      case 'dark':
        return {
          background: '#1a1a1a',
          city: '#ef4444',
          cityStroke: '#dc2626',
          route: '#3b82f6',
          text: '#ffffff',
          subtitle: '#d1d5db'
        };
      case 'minimal':
        return {
          background: '#ffffff',
          city: '#6b7280',
          cityStroke: '#4b5563',
          route: '#374151',
          text: '#111827',
          subtitle: '#6b7280'
        };
      case 'colorful':
        return {
          background: '#f0f9ff',
          city: '#f59e0b',
          cityStroke: '#d97706',
          route: '#8b5cf6',
          text: '#1e40af',
          subtitle: '#3730a3'
        };
      default: // modern
        return {
          background: '#ffffff',
          city: '#ef4444',
          cityStroke: '#dc2626',
          route: '#3b82f6',
          text: '#1f2937',
          subtitle: '#6b7280'
        };
    }
  }

  private calculateBounds(cities: City[]) {
    const xs = cities.map(c => c.x);
    const ys = cities.map(c => c.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  private calculateScale(bounds: any) {
    const dataWidth = bounds.maxX - bounds.minX;
    const dataHeight = bounds.maxY - bounds.minY;
    const availableWidth = this.width - 2 * this.margin;
    const availableHeight = this.height - 2 * this.margin - 80; // Space for title

    return Math.min(
      dataWidth > 0 ? availableWidth / dataWidth : 1,
      dataHeight > 0 ? availableHeight / dataHeight : 1
    );
  }

  private calculateOffset(bounds: any, scale: number) {
    const dataWidth = bounds.maxX - bounds.minX;
    const dataHeight = bounds.maxY - bounds.minY;
    const scaledWidth = dataWidth * scale;
    const scaledHeight = dataHeight * scale;
    
    return {
      x: this.margin + (this.width - 2 * this.margin - scaledWidth) / 2 - bounds.minX * scale,
      y: this.margin + 80 + (this.height - 2 * this.margin - 80 - scaledHeight) / 2 - bounds.minY * scale
    };
  }

  private drawRoute(
    ctx: CanvasRenderingContext2D,
    cities: City[],
    route: number[],
    scale: number,
    offset: any,
    colors: any
  ) {
    if (route.length < 2) return;

    ctx.strokeStyle = colors.route;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add glow effect
    ctx.shadowColor = colors.route;
    ctx.shadowBlur = 5;
    
    ctx.beginPath();
    
    for (let i = 0; i < route.length; i++) {
      const cityIndex = route[i];
      const city = cities[cityIndex];
      const x = city.x * scale + offset.x;
      const y = city.y * scale + offset.y;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Close the loop
    if (route.length > 0) {
      const firstCity = cities[route[0]];
      const x = firstCity.x * scale + offset.x;
      const y = firstCity.y * scale + offset.y;
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow
  }

  private drawCities(
    ctx: CanvasRenderingContext2D,
    cities: (City & { name?: string })[],
    scale: number,
    offset: any,
    colors: any,
    showLabels: boolean
  ) {
    cities.forEach((city, index) => {
      const x = city.x * scale + offset.x;
      const y = city.y * scale + offset.y;
      
      // Draw city circle with glow
      ctx.shadowColor = colors.cityStroke;
      ctx.shadowBlur = 8;
      
      ctx.fillStyle = colors.city;
      ctx.strokeStyle = colors.cityStroke;
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      ctx.shadowBlur = 0; // Reset shadow
      
      // Draw city index
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index.toString(), x, y);
      
      // Draw city label
      if (showLabels && city.name) {
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(city.name, x, y - 20);
      }
    });
  }

  private drawTitle(
    ctx: CanvasRenderingContext2D,
    cityCount: number,
    totalDistance: number,
    colors: any
  ) {
    // Main title
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🗺️ TSP Route Visualization', this.width / 2, 20);
    
    // Stats
    ctx.fillStyle = colors.subtitle;
    ctx.font = '16px Arial';
    ctx.fillText(
      `📍 ${cityCount} cities • 📏 ${totalDistance.toFixed(2)} units total distance`,
      this.width / 2,
      50
    );
  }
} 