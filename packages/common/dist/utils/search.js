"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlight = exports.fuzzySearch = exports.calcCutoff = exports.getFuzzyDistance = void 0;
function isSepChar(c) {
    return c == " " || c == "-" || c == "." || c == "_" || c == undefined;
}
const notAllowedCost = Infinity;
const baseDeleteCost = 5000;
const baseMoveCost = 1000;
const nominalCost = 10;
const haystackLenCost = 0.001;
function calcShortestDistance(haystack, needle, scoreCutoff = Infinity, distMatrix = [], pathMatrix = []) {
    if (needle == "")
        return 0;
    if (haystack == "")
        return needle.length * baseDeleteCost;
    let hLen = haystack.length;
    let rowLen = hLen + 1;
    let nLen = needle.length;
    for (let hi = 0; hi <= hLen; hi++)
        distMatrix[hi + nLen * rowLen] = 0;
    for (let ni = 0; ni <= nLen; ni++)
        distMatrix[hLen + ni * rowLen] = (nLen - ni) * baseDeleteCost;
    for (let ni = nLen - 1; ni >= 0; ni--) {
        let nc = needle[ni];
        let ncSep = isSepChar(nc);
        let deleteCost = isSepChar(nc) ? nominalCost : baseDeleteCost;
        let moveCost = ni == 0 ? 0 : baseMoveCost;
        let previousIsSep = true;
        let wordStartIdx = hLen;
        let bestScore = Infinity;
        for (let hi = hLen - 1; hi >= 0; hi--) {
            let hc = haystack[hi];
            let hcSep = isSepChar(hc);
            let sameChar = nc == hc;
            let bothSep = hcSep && ncSep;
            let canPrefix = wordStartIdx != hLen && sameChar && !ncSep;
            for (let d = 1; canPrefix; d++) {
                let pnc = needle[ni - d];
                let phc = haystack[hi - d];
                if (isSepChar(phc))
                    break;
                canPrefix && (canPrefix = pnc == phc);
            }
            let deleteOpt = distMatrix[hi + (ni + 1) * rowLen] + deleteCost;
            let useOpt = sameChar || bothSep ? distMatrix[hi + 1 + (ni + 1) * rowLen] : notAllowedCost;
            let skipCharOpt = distMatrix[hi + 1 + ni * rowLen] + moveCost;
            let skipWordOpt = ncSep || hcSep
                ? distMatrix[wordStartIdx + ni * rowLen] + nominalCost
                : notAllowedCost;
            let prefixOpt = canPrefix
                ? distMatrix[wordStartIdx + 1 + (ni + 1) * rowLen] + nominalCost
                : notAllowedCost;
            let thisIdx = hi + ni * rowLen;
            let min = Math.min(deleteOpt, useOpt, skipCharOpt, skipWordOpt, prefixOpt);
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
            if (!previousIsSep && hcSep)
                wordStartIdx = hi;
            previousIsSep = hcSep;
        }
        if (bestScore > scoreCutoff) {
            return scoreCutoff + 1;
        }
    }
    return distMatrix[0] + haystack.length * haystackLenCost;
}
function calcHighlights(pathMatrix, hLen, nLen) {
    if (isNaN(hLen) || isNaN(nLen))
        return [];
    let rowLen = hLen + 1;
    let hi = 0;
    let ni = 0;
    let positions = [];
    while (hi != hLen && ni != nLen) {
        let next = pathMatrix[hi + ni * rowLen];
        let nHi = next % rowLen;
        let nNi = Math.floor(next / rowLen);
        if (nHi >= hi + 1 && nNi == ni + 1)
            positions.push(hi);
        hi = nHi;
        ni = nNi;
    }
    return positions;
}
function getFuzzyDistance(haystack, needle, scoreCutoff = Infinity, distMatrix = [], pathMatrix = []) {
    haystack = haystack.toLowerCase().trim();
    needle = needle.toLowerCase().trim();
    pathMatrix !== null && pathMatrix !== void 0 ? pathMatrix : (pathMatrix = []);
    let distance = calcShortestDistance(haystack, needle, scoreCutoff, distMatrix, pathMatrix);
    let highlights = distance > scoreCutoff ? [] : calcHighlights(pathMatrix, haystack.length, needle.length);
    return { document: haystack, distance, highlights };
}
exports.getFuzzyDistance = getFuzzyDistance;
function insert(results, newR) {
    let low = 0;
    let high = results.length;
    while (low < high) {
        let mid = Math.floor((low + high) / 2);
        if (newR.distance > results[mid].distance) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    results.splice(low, 0, newR);
}
function calcCutoff(dist, needleLen = 10, needleSepChars = 2) {
    return Math.min(dist * 2 + (needleSepChars + 1) * nominalCost + haystackLenCost * 10, baseDeleteCost * Math.max(Math.min(5, Math.ceil(needleLen / 2)), needleLen / 4));
}
exports.calcCutoff = calcCutoff;
function fuzzySearch(documents, needle, maxResults, key, sort = false) {
    var _a, _b;
    needle = needle.slice(0, 50);
    if (needle == "") {
        return documents
            .slice(0, maxResults)
            .map((document) => ({ document, distance: 0, highlights: [] }));
    }
    let distMatrix = [];
    let pathMatrix = [];
    maxResults !== null && maxResults !== void 0 ? maxResults : (maxResults = Infinity);
    let needleSepChars = needle.split("").filter(isSepChar).length;
    let scoreCutoff = Infinity;
    let sortedResults = [];
    for (let i = 0; i < documents.length; i++) {
        let haystack = key ? documents[i][key] : documents[i];
        let res = getFuzzyDistance(haystack + "", needle, scoreCutoff, distMatrix, pathMatrix);
        let dist = res.distance;
        let newCutoff = calcCutoff(dist, needle.length, needleSepChars);
        if (newCutoff < scoreCutoff) {
            scoreCutoff = newCutoff;
            sortedResults = sortedResults.filter((r) => r.distance <= scoreCutoff);
        }
        let lastDist = (_b = (_a = sortedResults[sortedResults.length - 1]) === null || _a === void 0 ? void 0 : _a.distance) !== null && _b !== void 0 ? _b : Infinity;
        if (dist > scoreCutoff)
            continue;
        if (dist > lastDist && sortedResults.length >= maxResults)
            continue;
        let documentRes = Object.assign(Object.assign({}, res), { document: documents[i] });
        if (sort) {
            insert(sortedResults, documentRes);
        }
        else {
            sortedResults.push(documentRes);
        }
    }
    return sortedResults;
}
exports.fuzzySearch = fuzzySearch;
function highlight(str, highlights, start = "<b>", end = "</b>") {
    if (highlights.length == 0)
        return str;
    let newStr = "";
    let highlightsPos = 0;
    let inHighlight = false;
    for (let i = 0; i < str.length; i++) {
        let newInHighlight = highlights[highlightsPos] == i;
        if (newInHighlight)
            highlightsPos++;
        if (!inHighlight && newInHighlight)
            newStr += start;
        if (inHighlight && !newInHighlight)
            newStr += end;
        newStr += str[i];
        inHighlight = newInHighlight;
    }
    if (inHighlight)
        newStr += end;
    return newStr;
}
exports.highlight = highlight;
//# sourceMappingURL=search.js.map