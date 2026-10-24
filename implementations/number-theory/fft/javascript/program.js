// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/*
 * The iterative radix-2 Cooley-Tukey transform, in place. A positive angle
 * is the forward transform and a negative angle is the inverse, which is
 * then divided by n.
 */
function fft(re, im, invert) {
    const n = re.length;

    let j = 0;
    for (let i = 1; i < n; i += 1) {
        let bit = n >> 1;
        while ((j & bit) !== 0) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            let t = re[i];
            re[i] = re[j];
            re[j] = t;
            t = im[i];
            im[i] = im[j];
            im[j] = t;
        }
    }

    for (let len = 2; len <= n; len <<= 1) {
        const angle = ((invert ? -2.0 : 2.0) * Math.PI) / len;
        const wlenRe = Math.cos(angle);
        const wlenIm = Math.sin(angle);
        const half = len >> 1;
        for (let start = 0; start < n; start += len) {
            let wRe = 1.0;
            let wIm = 0.0;
            for (let k = 0; k < half; k += 1) {
                const uRe = re[start + k];
                const uIm = im[start + k];
                const vRe = re[start + k + half] * wRe - im[start + k + half] * wIm;
                const vIm = re[start + k + half] * wIm + im[start + k + half] * wRe;
                re[start + k] = uRe + vRe;
                im[start + k] = uIm + vIm;
                re[start + k + half] = uRe - vRe;
                im[start + k + half] = uIm - vIm;
                const nextRe = wRe * wlenRe - wIm * wlenIm;
                wIm = wRe * wlenIm + wIm * wlenRe;
                wRe = nextRe;
            }
        }
    }

    if (invert) {
        for (let i = 0; i < n; i += 1) {
            re[i] /= n;
            im[i] /= n;
        }
    }
}

/** Round to nearest, with exact halves going away from zero. */
function roundHalfAway(x) {
    return x >= 0.0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5);
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }
    const values = tokens.map(Number);

    let at = 0;
    const n = values[at];
    at += 1;
    const a = values.slice(at, at + n);
    at += n;
    const m = values[at];
    at += 1;
    const b = values.slice(at, at + m);

    const total = n + m - 1;
    let size = 1;
    while (size < total) {
        size <<= 1;
    }

    const reA = new Array(size).fill(0.0);
    const imA = new Array(size).fill(0.0);
    const reB = new Array(size).fill(0.0);
    const imB = new Array(size).fill(0.0);
    for (let i = 0; i < n; i += 1) {
        reA[i] = a[i];
    }
    for (let i = 0; i < m; i += 1) {
        reB[i] = b[i];
    }

    fft(reA, imA, false);
    fft(reB, imB, false);
    for (let i = 0; i < size; i += 1) {
        const re = reA[i] * reB[i] - imA[i] * imB[i];
        const im = reA[i] * imB[i] + imA[i] * reB[i];
        reA[i] = re;
        imA[i] = im;
    }
    fft(reA, imA, true);

    const out = [];
    for (let i = 0; i < total; i += 1) {
        out.push(String(roundHalfAway(reA[i])));
    }
    process.stdout.write(out.join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
