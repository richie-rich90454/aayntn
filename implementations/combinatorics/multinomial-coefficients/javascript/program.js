// Educational reference implementation: JavaScript/Pascal is not a USACO submission language.
import { readFileSync } from "node:fs";

const MODULO = 1000000007n;

function modPow(base, exponent) {
    let result = 1n;
    let factor = base % MODULO;
    let power = exponent;
    while (power > 0n) {
        if (power % 2n === 1n) {
            result = (result * factor) % MODULO;
        }
        factor = (factor * factor) % MODULO;
        power /= 2n;
    }
    return result;
}

function main() {
    const data = readFileSync(0, "utf8").trim().split(/\s+/);
    const word = data[0] ?? "";
    const n = word.length;

    const frequency = new Array(26).fill(0);
    for (const letter of word) {
        frequency[letter.charCodeAt(0) - 97] += 1;
    }

    const factorial = new Array(n + 1).fill(1n);
    for (let i = 1; i <= n; i += 1) {
        factorial[i] = (factorial[i - 1] * BigInt(i)) % MODULO;
    }

    const inverseFactorial = new Array(n + 1).fill(1n);
    inverseFactorial[n] = modPow(factorial[n], MODULO - 2n);
    for (let i = n; i >= 1; i -= 1) {
        inverseFactorial[i - 1] = (inverseFactorial[i] * BigInt(i)) % MODULO;
    }

    let answer = factorial[n];
    for (const count of frequency) {
        answer = (answer * inverseFactorial[count]) % MODULO;
    }

    console.log(answer.toString());
}

main();
