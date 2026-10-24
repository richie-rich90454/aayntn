// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/*
 * Pollard's rho with fixed constants x0 = 2n and c = 1n, 2n, 3n, ... .
 * BigInt supplies exact 64-bit input and an exact 128-bit intermediate product.
 *
 * Input: t, then t positive integers below 2^63.
 * Output: one line per integer, holding its prime factors in ascending order.
 */

const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

function mulMod(a, b, m) {
    return (a * b) % m;
}

function powMod(a, e, m) {
    let result = 1n % m;
    let base = a % m;
    while (e > 0n) {
        if ((e & 1n) === 1n) {
            result = mulMod(result, base, m);
        }
        base = mulMod(base, base, m);
        e >>= 1n;
    }
    return result;
}

function gcd(a, b) {
    while (b !== 0n) {
        const r = a % b;
        a = b;
        b = r;
    }
    return a;
}

function isPrime(n) {
    if (n < 2n) {
        return false;
    }

    for (const p of SMALL_PRIMES) {
        if (n % p === 0n) {
            return n === p;
        }
    }

    let d = n - 1n;
    let s = 0;
    while ((d & 1n) === 0n) {
        d >>= 1n;
        s += 1;
    }

    for (const a of SMALL_PRIMES) {
        let x = powMod(a, d, n);
        if (x === 1n || x === n - 1n) {
            continue;
        }
        let passed = false;
        for (let r = 1; r < s; r += 1) {
            x = mulMod(x, x, n);
            if (x === n - 1n) {
                passed = true;
                break;
            }
        }
        if (!passed) {
            return false;
        }
    }
    return true;
}

function rhoStep(x, c, n) {
    return (mulMod(x, x, n) + c) % n;
}

function pollard(n) {
    if (n % 2n === 0n) {
        return 2n;
    }
    if (n % 3n === 0n) {
        return 3n;
    }

    let c = 1n;
    for (;;) {
        let x = 2n;
        let y = 2n;
        let d = 1n;
        while (d === 1n) {
            x = rhoStep(x, c, n);
            y = rhoStep(rhoStep(y, c, n), c, n);
            const diff = x >= y ? x - y : y - x;
            d = gcd(diff, n);
        }
        if (d !== n) {
            return d;
        }
        c += 1n;
    }
}

function factorize(n) {
    const factors = [];
    if (n < 2n) {
        return factors;
    }

    for (const p of SMALL_PRIMES) {
        while (n % p === 0n) {
            factors.push(p);
            n /= p;
        }
    }

    const stack = n > 1n ? [n] : [];
    while (stack.length > 0) {
        const m = stack.pop();
        if (isPrime(m)) {
            factors.push(m);
        } else {
            const d = pollard(m);
            stack.push(d);
            stack.push(m / d);
        }
    }

    factors.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return factors;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const count = Number(tokens[0]);
    const out = [];
    for (let i = 0; i < count && i + 1 < tokens.length; i += 1) {
        const factors = factorize(BigInt(tokens[i + 1]));
        out.push(factors.map(String).join(" ") + "\n");
    }
    process.stdout.write(out.join(""));
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
