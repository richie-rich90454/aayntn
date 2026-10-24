// Educational reference implementation: JavaScript is not a USACO submission language.

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    const tokens = input.trim().split(/\s+/);
    if (tokens.length === 0 || tokens[0] === "") {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n < 0) {
        return;
    }

    const square = n * n;
    let total = 0;
    for (let k = 1; k <= n; k += 1) {
        total += 2 * k - 1;
    }

    process.stdout.write(`${square}\n${total}\n${square === total ? "MATCH" : "DIFFER"}\n`);
});
