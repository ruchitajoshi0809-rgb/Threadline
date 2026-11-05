/**
 * Isolation Forest — a from-scratch, dependency-free implementation.
 *
 * Isolation Forest detects anomalies by recursively partitioning the feature
 * space. Anomalous points are "isolated" after very few splits (short path
 * length), while normal points require many splits to isolate (long path
 * length). The raw anomaly score is *not* a probability of attack — it is an
 * unsupervised outlier score in the range [0, 1] where values closer to 1
 * indicate points that the ensemble found easier to isolate. Threadline uses
 * this score as one input into its combined risk engine, never as a calibrated
 * probability.
 *
 * Reference: Liu, Ting & Zhou, "Isolation Forest" (ICDM 2008).
 */

/** Deterministic PRNG for repeatable model output. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Average path length of an unsuccessful BST search, c(n). */
function averagePathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const harmonic = Math.log(n - 1) + 0.5772156649015329; // Euler–Mascheroni
  return 2 * harmonic - (2 * (n - 1)) / n;
}

interface TreeNode {
  isLeaf: boolean;
  size?: number;
  feature?: number;
  value?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function buildTree(
  X: number[][],
  depth: number,
  maxDepth: number,
  rng: () => number,
): TreeNode {
  const n = X.length;
  if (n <= 1 || depth >= maxDepth) {
    return { isLeaf: true, size: n };
  }

  const dim = X[0].length;
  const feature = Math.floor(rng() * dim);

  let min = Infinity;
  let max = -Infinity;
  for (const row of X) {
    const v = row[feature];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    return { isLeaf: true, size: n };
  }

  const value = min + rng() * (max - min);
  const left: number[][] = [];
  const right: number[][] = [];
  for (const row of X) {
    if (row[feature] < value) left.push(row);
    else right.push(row);
  }
  if (left.length === 0 || right.length === 0) {
    return { isLeaf: true, size: n };
  }

  return {
    isLeaf: false,
    feature,
    value,
    left: buildTree(left, depth + 1, maxDepth, rng),
    right: buildTree(right, depth + 1, maxDepth, rng),
  };
}

function pathLength(node: TreeNode, x: number[]): number {
  if (node.isLeaf) {
    return averagePathLength(node.size ?? 1);
  }
  const v = x[node.feature!];
  if (v < node.value!) return 1 + pathLength(node.left!, x);
  return 1 + pathLength(node.right!, x);
}

export interface IsolationForestOptions {
  nTrees?: number;
  subSampleSize?: number;
  maxDepth?: number;
  seed?: number;
}

export class IsolationForest {
  private trees: TreeNode[] = [];
  private means: number[] = [];
  private stds: number[] = [];
  private cMax = 1;
  private dimension = 0;
  private readonly options: Required<IsolationForestOptions>;

  constructor(options: IsolationForestOptions = {}) {
    this.options = {
      nTrees: options.nTrees ?? 120,
      subSampleSize: options.subSampleSize ?? 256,
      maxDepth: options.maxDepth ?? 10,
      seed: options.seed ?? 1337,
    };
    this.cMax = averagePathLength(this.options.subSampleSize);
  }

  get trained(): boolean {
    return this.trees.length > 0;
  }

  /** Fit the ensemble on a matrix of (standardised-able) feature rows. */
  fit(X: number[][]): void {
    const n = X.length;
    if (n === 0) {
      this.trees = [];
      return;
    }
    this.dimension = X[0].length;

    this.means = new Array(this.dimension).fill(0);
    this.stds = new Array(this.dimension).fill(1);
    for (let f = 0; f < this.dimension; f++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += X[i][f];
      const mean = sum / n;
      this.means[f] = mean;
      let sq = 0;
      for (let i = 0; i < n; i++) sq += (X[i][f] - mean) ** 2;
      const std = Math.sqrt(sq / n);
      this.stds[f] = std === 0 ? 1 : std;
    }

    const standardised = X.map((row) =>
      row.map((v, f) => (v - this.means[f]) / this.stds[f]),
    );

    const rng = mulberry32(this.options.seed);
    const psi = Math.min(this.options.subSampleSize, n);
    const maxDepth = Math.min(
      this.options.maxDepth,
      Math.ceil(Math.log2(psi)) + 1,
    );

    this.trees = [];
    for (let t = 0; t < this.options.nTrees; t++) {
      const sample: number[][] = [];
      for (let i = 0; i < psi; i++) {
        sample.push(standardised[Math.floor(rng() * n)]);
      }
      this.trees.push(buildTree(sample, 0, maxDepth, rng));
    }
  }

  /** Score rows. Returns the anomaly score in [0, 1]; 1 == most anomalous. */
  score(X: number[][]): number[] {
    if (!this.trained) return X.map(() => 0.5); // no signal without a baseline
    return X.map((row) => {
      const xs = row.map((v, f) => (v - this.means[f]) / this.stds[f]);
      let total = 0;
      for (const tree of this.trees) total += pathLength(tree, xs);
      const avg = total / this.trees.length;
      // 2^(-avg / c(n)): short average path => score close to 1.
      return Math.pow(2, -avg / this.cMax);
    });
  }
}
