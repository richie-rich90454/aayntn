// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/*
 * An implicit segment tree over [1, m]. A node is created the first time an
 * update enters its interval, so the untouched domain costs nothing and every
 * missing node stands for an all-zero interval.
 */
const EOL = process.platform === "win32" ? "\r\n" : "\n";

function main(input) {
    const data = input.trim().split(/\s+/);
    if (data.length < 2) {
        return;
    }

    const m = Number(data[0]);
    const q = Number(data[1]);
    if (m < 1 || q < 0) {
        return;
    }

    const left = [0];
    const right = [0];
    const total = [0];

    function newNode() {
        left.push(0);
        right.push(0);
        total.push(0);
        return total.length - 1;
    }

    function add(node, lo, hi, pos, delta) {
        total[node] += delta;
        if (lo === hi) {
            return;
        }
        const mid = Math.floor((lo + hi) / 2);
        if (pos <= mid) {
            if (left[node] === 0) {
                left[node] = newNode();
            }
            add(left[node], lo, mid, pos, delta);
        } else {
            if (right[node] === 0) {
                right[node] = newNode();
            }
            add(right[node], mid + 1, hi, pos, delta);
        }
    }

    function query(node, lo, hi, ql, qr) {
        if (node === 0 || qr < lo || hi < ql) {
            return 0;
        }
        if (ql <= lo && hi <= qr) {
            return total[node];
        }
        const mid = Math.floor((lo + hi) / 2);
        let result = 0;
        if (ql <= mid) {
            result += query(left[node], lo, mid, ql, qr);
        }
        if (qr > mid) {
            result += query(right[node], mid + 1, hi, ql, qr);
        }
        return result;
    }

    const root = newNode();
    let index = 2;
    const output = [];
    for (let step = 0; step < q && index + 1 < data.length; step++) {
        const kind = Number(data[index++]);
        if (kind === 1) {
            const pos = Number(data[index++]);
            const delta = Number(data[index++]);
            add(root, 1, m, pos, delta);
        } else if (kind === 2) {
            const l = Number(data[index++]);
            const r = Number(data[index++]);
            output.push(String(query(root, 1, m, l, r)));
        } else {
            break;
        }
    }

    if (output.length > 0) {
        process.stdout.write(output.join(EOL) + EOL);
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
