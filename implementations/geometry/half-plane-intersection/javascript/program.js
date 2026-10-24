// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * A half-plane a*x + b*y <= c is a directed line together with the side on
 * which it is feasible. The feasible region is the intersection of all the
 * half-planes. The polygon is kept in the dual form: a cyclic list of the
 * lines that support its edges, so the vertex between two consecutive lines
 * is their intersection and no coordinate is stored until the area is printed.
 */

function gcd(a, b) {
    if (a < 0n) {
        a = -a;
    }
    if (b < 0n) {
        b = -b;
    }
    while (b !== 0n) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
}

/**
 * Whether the intersection of u and v lies in the closed half-plane h.
 *
 * With w = det(u, v), x = X/w and y = Y/w, the value of h at that point has
 * the sign of (h.a*X + h.b*Y - h.c*w) multiplied by the sign of w.
 *
 * @param {{a: bigint, b: bigint, c: bigint}} u
 * @param {{a: bigint, b: bigint, c: bigint}} v
 * @param {{a: bigint, b: bigint, c: bigint}} h
 * @returns {boolean}
 */
function inside(u, v, h) {
    const w = u.a * v.b - v.a * u.b;
    if (w === 0n) {
        return true;
    }
    const x = u.c * v.b - v.c * u.b;
    const y = u.a * v.c - v.a * u.c;
    const numerator = h.a * x + h.b * y - h.c * w;
    return w > 0n ? numerator <= 0n : numerator >= 0n;
}

/**
 * The intersection of u and v as the reduced homogeneous point (x/w, y/w).
 *
 * @param {{a: bigint, b: bigint, c: bigint}} u
 * @param {{a: bigint, b: bigint, c: bigint}} v
 * @returns {{x: bigint, y: bigint, w: bigint}}
 */
function intersect(u, v) {
    let w = u.a * v.b - v.a * u.b;
    let x = u.c * v.b - v.c * u.b;
    let y = u.a * v.c - v.a * u.c;
    if (w === 0n) {
        return { x, y, w };
    }
    const divisor = gcd(gcd(x, y), w);
    x /= divisor;
    y /= divisor;
    w /= divisor;
    if (w < 0n) {
        x = -x;
        y = -y;
        w = -w;
    }
    return { x, y, w };
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Math.max(0, Number(tokens[0]));
    const planes = [];
    let maxA = 1n;
    let maxC = 0n;
    let index = 1;
    for (let i = 0; i < n; i += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const a = BigInt(tokens[index]);
        const b = BigInt(tokens[index + 1]);
        const c = BigInt(tokens[index + 2]);
        index += 3;
        planes.push({ a, b, c });
        const aa = a < 0n ? -a : a;
        const bb = b < 0n ? -b : b;
        const cc = c < 0n ? -c : c;
        if (aa > maxA) {
            maxA = aa;
        }
        if (bb > maxA) {
            maxA = bb;
        }
        if (cc > maxC) {
            maxC = cc;
        }
    }

    // Every vertex of a bounded region is the intersection of two input
    // lines, so its coordinates are at most 2*maxA*maxC in absolute value.
    // The box is larger than every such vertex.
    const m = 2n * maxA * maxC + 2n;

    // The box [-m, m]^2, with its edges in counterclockwise order.
    const lines = [
        { a: 0n, b: -1n, c: m },
        { a: 1n, b: 0n, c: m },
        { a: 0n, b: 1n, c: m },
        { a: -1n, b: 0n, c: m },
    ];
    let poly = [0, 1, 2, 3];

    for (const plane of planes) {
        const h = lines.length;
        lines.push(plane);
        const k = poly.length;
        const ins = new Array(k);
        let anyInside = false;
        for (let i = 0; i < k; i += 1) {
            const j = (i + 1) % k;
            ins[i] = inside(lines[poly[i]], lines[poly[j]], plane);
            anyInside = anyInside || ins[i];
        }
        if (!anyInside) {
            poly = [];
            continue;
        }
        const next = [];
        for (let i = 0; i < k; i += 1) {
            const j = (i + 1) % k;
            if (ins[i] || ins[j]) {
                next.push(poly[j]);
            }
            if (ins[i] && !ins[j]) {
                next.push(h);
            }
        }
        poly = next;
    }

    if (poly.length === 0) {
        process.stdout.write("0" + EOL);
        return;
    }

    // The region is unbounded exactly when some nonzero direction d satisfies
    // a*d.x + b*d.y <= 0 for every constraint. An extreme ray of that cone is
    // parallel to one of the constraint lines, so testing both directions of
    // every line is enough.
    let hasNormal = false;
    for (const plane of planes) {
        if (plane.a !== 0n || plane.b !== 0n) {
            hasNormal = true;
        }
    }
    if (!hasNormal) {
        process.stdout.write("UNBOUNDED" + EOL);
        return;
    }

    let unbounded = false;
    for (let i = 0; i < planes.length && !unbounded; i += 1) {
        if (planes[i].a === 0n && planes[i].b === 0n) {
            continue;
        }
        for (let direction = 0; direction < 2 && !unbounded; direction += 1) {
            const dx = direction === 0 ? -planes[i].b : planes[i].b;
            const dy = direction === 0 ? planes[i].a : -planes[i].a;
            let feasible = true;
            for (const plane of planes) {
                if (plane.a * dx + plane.b * dy > 0n) {
                    feasible = false;
                    break;
                }
            }
            if (feasible) {
                unbounded = true;
            }
        }
    }
    if (unbounded) {
        process.stdout.write("UNBOUNDED" + EOL);
        return;
    }

    if (poly.length < 3) {
        process.stdout.write("0" + EOL);
        return;
    }

    const vertices = [];
    for (let i = 0; i < poly.length; i += 1) {
        const u = lines[poly[i]];
        const v = lines[poly[(i + 1) % poly.length]];
        const point = intersect(u, v);
        if (point.w === 0n) {
            process.stdout.write("0" + EOL);
            return;
        }
        vertices.push(point);
    }

    let numerator = 0n;
    let denominator = 1n;
    for (let i = 0; i < vertices.length; i += 1) {
        const first = vertices[i];
        const second = vertices[(i + 1) % vertices.length];
        let term = first.x * second.y - first.y * second.x;
        let scale = first.w * second.w;
        if (scale < 0n) {
            term = -term;
            scale = -scale;
        }
        const divisor = gcd(term, scale);
        term /= divisor;
        scale /= divisor;
        numerator = numerator * scale + term * denominator;
        denominator *= scale;
        const reduced = gcd(numerator, denominator);
        numerator /= reduced;
        denominator /= reduced;
    }
    if (numerator < 0n) {
        numerator = -numerator;
    }

    if (denominator === 1n) {
        process.stdout.write(numerator.toString() + EOL);
    } else {
        process.stdout.write(numerator.toString() + "/" + denominator.toString() + EOL);
    }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
