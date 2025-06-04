export interface City {
  x: number;
  y: number;
  id?: number;
}

export interface TSPResult {
  route: number[];
  totalDistance: number;
  cities: City[];
}

export class TSPSolver {
  private cities: City[];
  private distanceMatrix: number[][];

  constructor(cities: City[]) {
    this.cities = cities.map((city, index) => ({ ...city, id: index }));
    this.distanceMatrix = this.calculateDistanceMatrix();
  }

  private calculateDistanceMatrix(): number[][] {
    const n = this.cities.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const dx = this.cities[i].x - this.cities[j].x;
          const dy = this.cities[i].y - this.cities[j].y;
          matrix[i][j] = Math.sqrt(dx * dx + dy * dy);
        }
      }
    }
    
    return matrix;
  }

  public calculateRouteDistance(route: number[]): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length; i++) {
      const from = route[i];
      const to = route[(i + 1) % route.length];
      totalDistance += this.distanceMatrix[from][to];
    }
    return totalDistance;
  }

  // Nearest Neighbor Heuristic
  private nearestNeighbor(startCity: number = 0): number[] {
    const n = this.cities.length;
    const visited = new Set<number>();
    const route: number[] = [startCity];
    visited.add(startCity);

    let currentCity = startCity;
    
    while (route.length < n) {
      let nearestCity = -1;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && this.distanceMatrix[currentCity][i] < nearestDistance) {
          nearestDistance = this.distanceMatrix[currentCity][i];
          nearestCity = i;
        }
      }
      
      route.push(nearestCity);
      visited.add(nearestCity);
      currentCity = nearestCity;
    }
    
    return route;
  }

  // 2-opt improvement
  private twoOptImprovement(route: number[]): number[] {
    const n = route.length;
    let improved = true;
    let bestRoute = [...route];
    let bestDistance = this.calculateRouteDistance(bestRoute);

    while (improved) {
      improved = false;
      
      for (let i = 1; i < n - 2; i++) {
        for (let j = i + 1; j < n; j++) {
          if (j - i === 1) continue; // Skip adjacent edges
          
          const newRoute = [...bestRoute];
          // Reverse the section between i and j
          this.reverseSection(newRoute, i, j);
          
          const newDistance = this.calculateRouteDistance(newRoute);
          
          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }
    
    return bestRoute;
  }

  private reverseSection(route: number[], start: number, end: number): void {
    while (start < end) {
      [route[start], route[end]] = [route[end], route[start]];
      start++;
      end--;
    }
  }

  // Dynamic Programming for small instances (up to 15 cities)
  private dynamicProgramming(): number[] {
    const n = this.cities.length;
    if (n > 15) {
      throw new Error("Dynamic programming solution only works for up to 15 cities");
    }

    const dp: number[][] = Array(1 << n).fill(null).map(() => Array(n).fill(Infinity));
    const parent: number[][] = Array(1 << n).fill(null).map(() => Array(n).fill(-1));

    // Base case: starting from city 0
    dp[1][0] = 0;

    for (let mask = 1; mask < (1 << n); mask++) {
      for (let u = 0; u < n; u++) {
        if (!(mask & (1 << u)) || dp[mask][u] === Infinity) continue;

        for (let v = 0; v < n; v++) {
          if (mask & (1 << v)) continue;

          const newMask = mask | (1 << v);
          const newDist = dp[mask][u] + this.distanceMatrix[u][v];

          if (newDist < dp[newMask][v]) {
            dp[newMask][v] = newDist;
            parent[newMask][v] = u;
          }
        }
      }
    }

    // Find the minimum cost to return to start
    let minCost = Infinity;
    let lastCity = -1;
    const finalMask = (1 << n) - 1;

    for (let i = 1; i < n; i++) {
      const cost = dp[finalMask][i] + this.distanceMatrix[i][0];
      if (cost < minCost) {
        minCost = cost;
        lastCity = i;
      }
    }

    // Reconstruct path
    const route: number[] = [];
    let mask = finalMask;
    let curr = lastCity;

    while (curr !== -1) {
      route.push(curr);
      const prev = parent[mask][curr];
      mask ^= (1 << curr);
      curr = prev;
    }

    route.reverse();
    return route;
  }

  // Main solver method
  solve(): TSPResult {
    const n = this.cities.length;
    
    if (n < 2) {
      return {
        route: [0],
        totalDistance: 0,
        cities: this.cities
      };
    }

    let bestRoute: number[];
    
    if (n <= 10) {
      // Use dynamic programming for small instances
      try {
        bestRoute = this.dynamicProgramming();
      } catch {
        // Fallback to heuristic if DP fails
        bestRoute = this.nearestNeighbor();
        bestRoute = this.twoOptImprovement(bestRoute);
      }
    } else {
      // Use heuristic with improvement for larger instances
      let currentBest: number[] = [];
      let bestDistance = Infinity;

      // Try multiple starting points for nearest neighbor
      for (let start = 0; start < Math.min(n, 5); start++) {
        let route = this.nearestNeighbor(start);
        route = this.twoOptImprovement(route);
        const distance = this.calculateRouteDistance(route);
        
        if (distance < bestDistance) {
          bestDistance = distance;
          currentBest = route;
        }
      }
      
      bestRoute = currentBest;
    }

    return {
      route: bestRoute,
      totalDistance: this.calculateRouteDistance(bestRoute),
      cities: this.cities
    };
  }
} 