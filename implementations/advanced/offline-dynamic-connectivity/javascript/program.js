// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

const EOL = process.platform === "win32" ? "\r\n" : "\n";

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    let position = 0;
    const n = Number(tokens[position]);
    position += 1;
    const q = Number(tokens[position]);
    position += 1;
    if (q <= 0) {
        return;
    }

    const opType = new Int32Array(q + 1);
    const opU = new Int32Array(q + 1);
    const opV = new Int32Array(q + 1);

    const edgeU = [0];
    const edgeV = [0];
    const buckets = Array.from({ length: 4 * q + 5 }, () => []);
    const active = new Map();

    const addInterval = (node, lo, hi, ql, qr, edge) => {
        if (qr < lo || hi < ql) {
            return;
        }
        if (ql <= lo && hi <= qr) {
            buckets[node].push(edge);
            return;
        }
        const mid = Math.floor((lo + hi) / 2);
        addInterval(node * 2, lo, mid, ql, qr, edge);
        addInterval(node * 2 + 1, mid + 1, hi, ql, qr, edge);
    };

    for (let time = 1; time <= q; time += 1) {
        if (position + 2 >= tokens.length) {
            break;
        }
        const type = Number(tokens[position]);
        const u = Number(tokens[position + 1]);
        const v = Number(tokens[position + 2]);
        position += 3;
        opType[time] = type;
        opU[time] = u;
        opV[time] = v;
        const key = Math.min(u, v) * (n + 1) + Math.max(u, v);
        if (type === 1) {
            edgeU.push(u);
            edgeV.push(v);
            active.set(key, [time, edgeU.length - 1]);
        } else if (type === 2) {
            const opened = active.get(key);
            if (opened !== undefined) {
                active.delete(key);
                if (opened[0] <= time - 1) {
                    addInterval(1, 1, q, opened[0], time - 1, opened[1]);
                }
            }
        }
    }

    for (const opened of active.values()) {
        addInterval(1, 1, q, opened[0], q, opened[1]);
    }

    const parent = new Int32Array(n + 1);
    const setSize = new Int32Array(n + 1);
    for (let v = 1; v <= n; v += 1) {
        parent[v] = v;
        setSize[v] = 1;
    }
    const history = [];

    const find = (start) => {
        let v = start;
        while (parent[v] !== v) {
            v = parent[v];
        }
        return v;
    };

    const unite = (a, b) => {
        let ra = find(a);
        let rb = find(b);
        if (ra === rb) {
            return;
        }
        if (setSize[ra] < setSize[rb]) {
            const swap = ra;
            ra = rb;
            rb = swap;
        }
        history.push([rb, ra, setSize[ra]]);
        parent[rb] = ra;
        setSize[ra] += setSize[rb];
    };

    const rollbackTo = (checkpoint) => {
        while (history.length > checkpoint) {
            const [child, root, oldSize] = history.pop();
            parent[child] = child;
            setSize[root] = oldSize;
        }
    };

    const answer = new Uint8Array(q + 1);

    const solve = (node, lo, hi) => {
        const checkpoint = history.length;
        for (const edge of buckets[node]) {
            unite(edgeU[edge], edgeV[edge]);
        }
        if (lo === hi) {
            if (opType[lo] === 3) {
                answer[lo] = find(opU[lo]) === find(opV[lo]) ? 1 : 0;
            }
        } else {
            const mid = Math.floor((lo + hi) / 2);
            solve(node * 2, lo, mid);
            solve(node * 2 + 1, mid + 1, hi);
        }
        rollbackTo(checkpoint);
    };

    solve(1, 1, q);

    const lines = [];
    for (let time = 1; time <= q; time += 1) {
        if (opType[time] === 3) {
            lines.push(answer[time] === 1 ? "YES" : "NO");
        }
    }
    if (lines.length > 0) {
        process.stdout.write(lines.join(EOL) + EOL);
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
