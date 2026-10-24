// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

const EOL = process.platform === "win32" ? "\r\n" : "\n";

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let position = 0;
    const q = Number(tokens[position]);
    position += 1;

    const value = new Array(q + 1).fill(0);
    const parent = new Array(q + 1).fill(-1);
    const root = new Array(q + 1).fill(-1);

    let nodes = 0;
    let versions = 0;
    const output = [];

    for (let i = 0; i < q; ++i) {
        const kind = Number(tokens[position]);
        const v = Number(tokens[position + 1]);
        position += 2;

        if (kind === 1) {
            const x = Number(tokens[position]);
            position += 1;
            value[nodes] = x;
            parent[nodes] = root[v];
            versions += 1;
            root[versions] = nodes;
            nodes += 1;
        } else if (kind === 2) {
            const old = root[v];
            versions += 1;
            root[versions] = old === -1 ? -1 : parent[old];
        } else {
            const top = root[v];
            output.push(top === -1 ? "-1" : String(value[top]));
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
