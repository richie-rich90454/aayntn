// Educational reference implementation: JavaScript is not a USACO submission language.
//
// The suffix-array-based palindrome method.
//
// Input: one nonempty string of lowercase Latin letters, length at most 100000.
// Output: the length of the longest palindromic substring and its first
// 0-based starting position, one per line.
//
// The program builds the suffix array and the LCP array of s # reverse(s),
// answers longest-common-prefix queries with a sparse table over the LCP
// array, and binary searches the palindrome radius at every center.

"use strict";

function suffixArray(u) {
    const n = u.length;
    const sa = new Int32Array(n);
    const cnt = new Int32Array(Math.max(n, 256));

    for (let i = 0; i < n; i += 1) cnt[u.charCodeAt(i)] += 1;
    for (let i = 1; i < 256; i += 1) cnt[i] += cnt[i - 1];
    for (let i = n - 1; i >= 0; i -= 1) {
        const c = u.charCodeAt(i);
        cnt[c] -= 1;
        sa[cnt[c]] = i;
    }

    let rank = new Int32Array(n);
    let classes = 0;
    rank[sa[0]] = 0;
    for (let i = 1; i < n; i += 1) {
        if (u[sa[i]] !== u[sa[i - 1]]) classes += 1;
        rank[sa[i]] = classes;
    }

    for (let k = 1; k < n && classes < n - 1; k <<= 1) {
        const y = new Int32Array(n);
        let p = 0;
        for (let i = n - k; i < n; i += 1) y[p++] = i;
        for (let i = 0; i < n; i += 1) {
            if (sa[i] >= k) y[p++] = sa[i] - k;
        }

        const bucket = new Int32Array(classes + 1);
        for (let i = 0; i < n; i += 1) bucket[rank[i]] += 1;
        for (let i = 1; i <= classes; i += 1) bucket[i] += bucket[i - 1];
        for (let i = n - 1; i >= 0; i -= 1) {
            const v = y[i];
            bucket[rank[v]] -= 1;
            sa[bucket[rank[v]]] = v;
        }

        const old = rank;
        rank = new Int32Array(n);
        classes = 0;
        rank[sa[0]] = 0;
        for (let i = 1; i < n; i += 1) {
            const a = sa[i - 1];
            const b = sa[i];
            const a2 = a + k < n ? old[a + k] : -1;
            const b2 = b + k < n ? old[b + k] : -1;
            if (old[a] !== old[b] || a2 !== b2) classes += 1;
            rank[b] = classes;
        }
    }

    for (let i = 0; i < n; i += 1) rank[sa[i]] = i;
    return { sa, rank };
}

function longestPalindrome(s) {
    const n = s.length;
    if (n === 0) return { length: 0, start: 0 };

    const u = s + "#" + s.split("").reverse().join("");
    const N = u.length;
    const { sa, rank } = suffixArray(u);

    const lcp = new Int32Array(N);
    let h = 0;
    for (let i = 0; i < N; i += 1) {
        const r = rank[i];
        if (r === 0) {
            h = 0;
            continue;
        }
        const j = sa[r - 1];
        while (i + h < N && j + h < N && u[i + h] === u[j + h]) h += 1;
        lcp[r] = h;
        if (h > 0) h -= 1;
    }

    const lg = new Int32Array(N + 1);
    for (let i = 2; i <= N; i += 1) lg[i] = lg[i >> 1] + 1;
    const levels = lg[N] + 1;
    const st = [lcp];
    for (let j = 1; j < levels; j += 1) {
        const span = 1 << (j - 1);
        const limit = N - (1 << j) + 1;
        const prev = st[j - 1];
        const cur = new Int32Array(N);
        for (let i = 0; i < limit; i += 1) {
            const a = prev[i];
            const b = prev[i + span];
            cur[i] = a < b ? a : b;
        }
        st.push(cur);
    }

    function lcpQuery(i, j) {
        if (i === j) return N - i;
        let a = rank[i];
        let b = rank[j];
        if (a > b) {
            const t = a;
            a = b;
            b = t;
        }
        a += 1;
        const length = b - a + 1;
        const k = lg[length];
        const x = st[k][a];
        const y = st[k][b - (1 << k) + 1];
        return x < y ? x : y;
    }

    let bestLen = 0;
    let bestStart = 0;

    for (let c = 0; c < n; c += 1) {
        const radius = Math.min(c, n - 1 - c);
        let lo = 0;
        let hi = radius;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lcpQuery(c, 2 * n - c) >= mid + 1) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        const length = 2 * lo + 1;
        const start = c - lo;
        if (length > bestLen || (length === bestLen && start < bestStart)) {
            bestLen = length;
            bestStart = start;
        }
    }

    for (let c = 1; c < n; c += 1) {
        const radius = Math.min(c, n - c);
        let lo = 0;
        let hi = radius;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lcpQuery(c, 2 * n + 1 - c) >= mid) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        const length = 2 * lo;
        const start = c - lo;
        if (length > bestLen || (length === bestLen && start < bestStart)) {
            bestLen = length;
            bestStart = start;
        }
    }

    return { length: bestLen, start: bestStart };
}

function main(input) {
    const s = input.trim();
    const answer = longestPalindrome(s);
    process.stdout.write(answer.length + "\n" + answer.start + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
