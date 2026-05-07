function isSepChar(c: string | undefined): boolean {
  return c == " " || c == "-" || c == "." || c == "_" || c == undefined;
}

const notAllowedCost = Infinity;
const baseDeleteCost = 5000;
const baseMoveCost = 1000;
const nominalCost = 10;
const haystackLenCost = 0.001;

function calcShortestDistance(haystack: string, needle: string, scoreCutoff: number = Infinity, distMatrix: number[] = [], pathMatrix: number[] = []): number {
  if (needle == "") return 0;
  if (haystack == "") return needle.length * baseDeleteCost;

  const hLen = haystack.length;
  const rowLen = hLen + 1;
  const nLen = needle.length;

  for (let hi = 0; hi <= hLen; hi++) distMatrix[hi + nLen * rowLen] = 0;

  for (let ni = 0; ni <= nLen; ni++) distMatrix[hLen + ni * rowLen] = (nLen - ni) * baseDeleteCost;

  for (let ni = nLen - 1; ni >= 0; ni--) {
    const nc = needle[ni];
    const ncSep = isSepChar(nc);
    const deleteCost = isSepChar(nc) ? nominalCost : baseDeleteCost;
    const moveCost = ni == 0 ? 0 : baseMoveCost;
    let previousIsSep = true;
    let wordStartIdx = hLen;
    let bestScore = Infinity;

    for (let hi = hLen - 1; hi >= 0; hi--) {
      const hc = haystack[hi];
      const hcSep = isSepChar(hc);
      const sameChar = nc == hc;
      const bothSep = hcSep && ncSep;
      let canPrefix = wordStartIdx != hLen && sameChar && !ncSep;

      for (let d = 1; canPrefix; d++) {
        const pnc = needle[ni - d];
        const phc = haystack[hi - d];
        if (isSepChar(phc)) break;
        canPrefix &&= pnc == phc;
      }

      const deleteOpt = distMatrix[hi + (ni + 1) * rowLen] + deleteCost;
      const useOpt = sameChar || bothSep ? distMatrix[hi + 1 + (ni + 1) * rowLen] : notAllowedCost;
      const skipCharOpt = distMatrix[hi + 1 + ni * rowLen] + moveCost;
      const skipWordOpt = ncSep || hcSep ? distMatrix[wordStartIdx + ni * rowLen] + nominalCost : notAllowedCost;
      const prefixOpt = canPrefix ? distMatrix[wordStartIdx + 1 + (ni + 1) * rowLen] + nominalCost : notAllowedCost;
      const thisIdx = hi + ni * rowLen;
      const min = Math.min(deleteOpt, useOpt, skipCharOpt, skipWordOpt, prefixOpt);

      distMatrix[thisIdx] = min;
      bestScore = Math.min(bestScore, min);

      switch (min) {
        case deleteOpt:
          pathMatrix[thisIdx] = hi + (ni + 1) * rowLen;
          break;
        case useOpt:
          pathMatrix[thisIdx] = hi + 1 + (ni + 1) * rowLen;
          break;
        case skipCharOpt:
          pathMatrix[thisIdx] = hi + 1 + ni * rowLen;
          break;
        case skipWordOpt:
          pathMatrix[thisIdx] = wordStartIdx + ni * rowLen;
          break;
        case prefixOpt:
          pathMatrix[thisIdx] = wordStartIdx + 1 + (ni + 1) * rowLen;
          break;
      }

      if (!previousIsSep && hcSep) wordStartIdx = hi;
      previousIsSep = hcSep;
    }

    if (bestScore > scoreCutoff) return scoreCutoff + 1;
  }

  return distMatrix[0] + haystack.length * haystackLenCost;
}

function calcHighlights(pathMatrix: number[], hLen: number, nLen: number): number[] {
  if (Number.isNaN(hLen) || Number.isNaN(nLen)) return [];

  const rowLen = hLen + 1;
  let hi = 0;
  let ni = 0;
  const positions: number[] = [];

  while (hi != hLen && ni != nLen) {
    const next = pathMatrix[hi + ni * rowLen];
    const nHi = next % rowLen;
    const nNi = Math.floor(next / rowLen);

    if (nHi >= hi + 1 && nNi == ni + 1) positions.push(hi);

    hi = nHi;
    ni = nNi;
  }

  return positions;
}

export interface FuzzyResult<T> {
  document: T;
  distance: number;
  highlights: number[];
}

export function getFuzzyDistance(haystack: string, needle: string, scoreCutoff: number = Infinity, distMatrix: number[] = [], pathMatrix: number[] = []): FuzzyResult<string> {
  haystack = haystack.toLowerCase().trim();
  needle = needle.toLowerCase().trim();

  pathMatrix ??= [];

  const distance = calcShortestDistance(haystack, needle, scoreCutoff, distMatrix, pathMatrix);
  const highlights = distance > scoreCutoff ? [] : calcHighlights(pathMatrix, haystack.length, needle.length);

  return { document: haystack, distance, highlights };
}

function insert<T>(results: FuzzyResult<T>[], newR: FuzzyResult<T>) {
  let low = 0;
  let high = results.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (newR.distance > results[mid].distance) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  results.splice(low, 0, newR);
}

export function calcCutoff(dist: number, needleLen: number = 10, needleSepChars: number = 2): number {
  return Math.min(dist * 2 + (needleSepChars + 1) * nominalCost + haystackLenCost * 10, baseDeleteCost * Math.max(Math.min(5, Math.ceil(needleLen / 2)), needleLen / 4));
}

export function fuzzySearch<T>(documents: T[], needle: string, maxResults?: number, key?: keyof T, sort: boolean = false): FuzzyResult<T>[] {
  needle = needle.slice(0, 50);

  if (needle == "") {
    return documents.slice(0, maxResults).map((document) => ({ document, distance: 0, highlights: [] }));
  }

  const distMatrix: number[] = [];
  const pathMatrix: number[] = [];

  maxResults ??= Infinity;

  const needleSepChars = needle.split("").filter(isSepChar).length;
  let scoreCutoff = Infinity;
  let sortedResults: FuzzyResult<T>[] = [];

  for (let i = 0; i < documents.length; i++) {
    const haystack = key ? documents[i][key] : documents[i];
    const res = getFuzzyDistance(haystack + "", needle, scoreCutoff, distMatrix, pathMatrix);
    const dist = res.distance;
    const newCutoff = calcCutoff(dist, needle.length, needleSepChars);

    if (newCutoff < scoreCutoff) {
      scoreCutoff = newCutoff;
      sortedResults = sortedResults.filter((r) => r.distance <= scoreCutoff);
    }

    const lastDist = sortedResults[sortedResults.length - 1]?.distance ?? Infinity;

    if (dist > scoreCutoff) continue;
    if (dist > lastDist && sortedResults.length >= maxResults) continue;

    const documentRes = { ...res, document: documents[i] };
    if (sort) {
      insert(sortedResults, documentRes);
    } else {
      sortedResults.push(documentRes);
    }
  }

  return sortedResults;
}

export function highlight(str: string, highlights: number[], start: string = "<b>", end: string = "</b>"): string {
  if (highlights.length == 0) return str;

  let newStr = "";
  let highlightsPos = 0;
  let inHighlight = false;

  for (let i = 0; i < str.length; i++) {
    const newInHighlight = highlights[highlightsPos] == i;
    if (newInHighlight) highlightsPos++;

    if (!inHighlight && newInHighlight) newStr += start;
    if (inHighlight && !newInHighlight) newStr += end;
    newStr += str[i];

    inHighlight = newInHighlight;
  }

  if (inHighlight) newStr += end;

  return newStr;
}
