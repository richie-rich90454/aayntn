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
    if (!Number.isInteger(n) || n < 0 || tokens.length < n + 2) {
        return;
    }

    const a = tokens.slice(1, 1 + n).map(Number);
    const target = Number(tokens[n + 1]);

    let lo = 0;
    let hi = n;
    let probes = 0;
    while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        probes += 1;
        if (a[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    process.stdout.write(`${lo} ${probes}\n`);
});
