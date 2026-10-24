// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

const EOL = process.platform === "win32" ? "\r\n" : "\n";

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    let index = 0;
    const n = Number(tokens[index]);
    index += 1;
    const q = Number(tokens[index]);
    index += 1;

    const parent = new Array(n + 1);
    const size = new Array(n + 1).fill(1);
    for (let v = 1; v <= n; v += 1) {
        parent[v] = v;
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
            history.push([0, 0, 0]);
            return;
        }
        if (size[ra] < size[rb]) {
            const swap = ra;
            ra = rb;
            rb = swap;
        }
        history.push([rb, ra, size[ra]]);
        parent[rb] = ra;
        size[ra] += size[rb];
    };

    const rollback = () => {
        if (history.length === 0) {
            return;
        }
        const [child, root, oldSize] = history.pop();
        if (child === 0) {
            return;
        }
        parent[child] = child;
        size[root] = oldSize;
    };

    const lines = [];
    for (let i = 0; i < q; i += 1) {
        if (index >= tokens.length) {
            break;
        }
        const command = tokens[index];
        index += 1;
        if (command === "union") {
            const u = Number(tokens[index]);
            const v = Number(tokens[index + 1]);
            index += 2;
            unite(u, v);
        } else if (command === "rollback") {
            rollback();
        } else {
            const u = Number(tokens[index]);
            const v = Number(tokens[index + 1]);
            index += 2;
            lines.push(find(u) === find(v) ? "YES" : "NO");
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
