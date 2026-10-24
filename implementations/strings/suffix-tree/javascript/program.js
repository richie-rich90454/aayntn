// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Suffix tree of s + '$', built by inserting every suffix and splitting an
 * edge when two suffixes diverge inside it.
 *
 * Every distinct substring of s is a locus on an edge of the tree of s + '$'
 * that does not contain the sentinel, so the sum of the edge lengths minus the
 * number of suffixes counts the distinct substrings. The deepest node with two
 * children is the longest repeated substring.
 */
function main(input) {
    let s = input;
    const lineEnd = s.indexOf("\n");
    if (lineEnd !== -1) {
        s = s.slice(0, lineEnd);
    }
    if (s.endsWith("\r")) {
        s = s.slice(0, -1);
    }

    const t = s + "$";
    const N = t.length;
    const cap = 2 * N + 2;

    const child = new Int32Array(cap * 27).fill(-1);
    const edgeStart = new Int32Array(cap);
    const edgeLen = new Int32Array(cap);
    const depth = new Int32Array(cap);
    const childCount = new Int32Array(cap);

    let size = 1;
    for (let i = 0; i < N; i += 1) {
        let v = 0;
        let pos = i;
        for (;;) {
            const ch = t.charAt(pos);
            const c = ch === "$" ? 26 : ch.charCodeAt(0) - 97;
            const u = child[v * 27 + c];
            if (u === -1) {
                const leaf = size;
                size += 1;
                edgeStart[leaf] = pos;
                edgeLen[leaf] = N - pos;
                depth[leaf] = depth[v] + edgeLen[leaf];
                child[v * 27 + c] = leaf;
                childCount[v] += 1;
                break;
            }

            const maxLen = Math.min(edgeLen[u], N - pos);
            let l = 0;
            while (l < maxLen && t.charAt(edgeStart[u] + l) === t.charAt(pos + l)) {
                l += 1;
            }

            if (l === edgeLen[u]) {
                v = u;
                pos += l;
                if (pos === N) {
                    break;
                }
            } else {
                const w = size;
                size += 1;
                child[v * 27 + c] = w;
                edgeStart[w] = edgeStart[u];
                edgeLen[w] = l;
                depth[w] = depth[v] + l;

                let code =
                    t.charAt(edgeStart[u] + l) === "$" ? 26 : t.charCodeAt(edgeStart[u] + l) - 97;
                child[w * 27 + code] = u;
                childCount[w] += 1;
                edgeStart[u] += l;
                edgeLen[u] -= l;

                const leaf = size;
                size += 1;
                edgeStart[leaf] = pos + l;
                edgeLen[leaf] = N - (pos + l);
                depth[leaf] = depth[w] + edgeLen[leaf];
                code = t.charAt(pos + l) === "$" ? 26 : t.charCodeAt(pos + l) - 97;
                child[w * 27 + code] = leaf;
                childCount[w] += 1;
                break;
            }
        }
    }

    let total = 0;
    let best = 0;
    for (let v = 1; v < size; v += 1) {
        total += edgeLen[v];
        if (childCount[v] >= 2 && depth[v] > best) {
            best = depth[v];
        }
    }

    process.stdout.write(total - N + "\n" + best + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
