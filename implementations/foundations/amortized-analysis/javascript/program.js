// Educational reference implementation: JavaScript is not a USACO submission language.

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    const data = input.trim().split(/\s+/);
    if (data.length === 0 || data[0] === "") {
        return;
    }

    let n = Number(data[0]);
    if (n < 0) {
        n = 0;
    }

    let copies = 0;
    let capacity = 1;
    while (capacity < n) {
        copies += capacity;
        capacity *= 2;
    }

    process.stdout.write(`${copies} ${capacity}\n`);
});
