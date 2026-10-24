// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * The circle is stored as the points that define it, never as a center and a
 * radius: the center of a circumcircle is rational, and storing it would drag
 * rational arithmetic into every containment test.
 */

const EOL = process.platform === "win32" ? "\r\n" : "\n";

function dist2(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

function cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointCircle(p) {
    return { kind: 0, a: p, b: p, c: p };
}

function diameterCircle(a, b) {
    return { kind: 1, a, b, c: a };
}

function inside(circle, p) {
    if (circle.kind === 0) {
        return circle.a.x === p.x && circle.a.y === p.y;
    }
    if (circle.kind === 1) {
        return (
            (p.x - circle.a.x) * (p.x - circle.b.x) + (p.y - circle.a.y) * (p.y - circle.b.y) <= 0
        );
    }
    const ax = circle.a.x - p.x;
    const ay = circle.a.y - p.y;
    const bx = circle.b.x - p.x;
    const by = circle.b.y - p.y;
    const cx = circle.c.x - p.x;
    const cy = circle.c.y - p.y;
    const al = ax * ax + ay * ay;
    const bl = bx * bx + by * by;
    const cl = cx * cx + cy * cy;
    const det = ax * (by * cl - bl * cy) - ay * (bx * cl - bl * cx) + al * (bx * cy - by * cx);
    return det >= 0;
}

/**
 * Three non-collinear points have exactly one circumcircle. Three collinear
 * points have none, and the smallest circle containing them is the diameter of
 * the farthest pair.
 *
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @param {{x: number, y: number}} d
 * @returns {{kind: number, a: object, b: object, c: object}}
 */
function setCircumcircle(a, b, d) {
    if (cross(a, b, d) < 0) {
        const t = b;
        b = d;
        d = t;
    }
    if (cross(a, b, d) === 0) {
        const ab = dist2(a, b);
        const ad = dist2(a, d);
        const bd = dist2(b, d);
        if (ab >= ad && ab >= bd) {
            return diameterCircle(a, b);
        }
        if (ad >= bd) {
            return diameterCircle(a, d);
        }
        return diameterCircle(b, d);
    }
    return { kind: 2, a, b, c: d };
}

function squaredRadius(circle) {
    if (circle.kind === 0) {
        return 0;
    }
    if (circle.kind === 1) {
        return dist2(circle.a, circle.b) / 4;
    }
    const ab = dist2(circle.a, circle.b);
    const bc = dist2(circle.b, circle.c);
    const ca = dist2(circle.c, circle.a);
    const cr = cross(circle.a, circle.b, circle.c);
    return (ab * bc * ca) / (4 * cr * cr);
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }
    const n = Number(tokens[0]);
    if (!(n > 0)) {
        process.stdout.write("0" + EOL);
        return;
    }

    const pts = [];
    let at = 1;
    for (let i = 0; i < n; i += 1) {
        pts.push({ x: Number(tokens[at]), y: Number(tokens[at + 1]) });
        at += 2;
    }

    let circle = pointCircle(pts[0]);
    for (let i = 0; i < n; i += 1) {
        if (inside(circle, pts[i])) {
            continue;
        }
        circle = pointCircle(pts[i]);
        for (let j = 0; j < i; j += 1) {
            if (inside(circle, pts[j])) {
                continue;
            }
            circle = diameterCircle(pts[i], pts[j]);
            for (let k = 0; k < j; k += 1) {
                if (!inside(circle, pts[k])) {
                    circle = setCircumcircle(pts[i], pts[j], pts[k]);
                }
            }
        }
    }

    process.stdout.write(String(squaredRadius(circle)) + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
