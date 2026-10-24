"""Aho-Corasick over the lowercase Latin alphabet, driven from standard input.

Input: n, then n patterns on separate lines, then the text on the last line.
Output: one line per pattern, holding the number of its occurrences in the
text, overlapping occurrences included.

The trie stores 26 transitions per node, all initialized to -1. The failure
links are built in breadth-first order, and a missing transition is filled
with the transition of the failure link, so the scan performs one lookup per
text character. The counters are then pushed up the failure tree in reverse
breadth-first order, which counts the occurrences without enumerating them.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n < 0:
        n = 0

    patterns = data[1 : 1 + n]
    if len(patterns) < n:
        patterns.extend([b""] * (n - len(patterns)))
    text = data[1 + n] if len(data) > 1 + n else b""

    total = sum(len(pattern) for pattern in patterns)
    go = [[-1] * 26 for _ in range(total + 1)]
    fail = [0] * (total + 1)
    count = [0] * (total + 1)
    terminal = [0] * n
    order = []

    # Insert every pattern, remembering the terminal node of each one.
    nodes = 1
    for i, pattern in enumerate(patterns):
        v = 0
        for byte in pattern:
            c = byte - 97
            if c < 0 or c >= 26:
                continue
            if go[v][c] == -1:
                go[v][c] = nodes
                nodes += 1
            v = go[v][c]
        terminal[i] = v

    # Build the failure links and complete the transition table.
    for c in range(26):
        u = go[0][c]
        if u == -1:
            go[0][c] = 0
        else:
            fail[u] = 0
            order.append(u)

    head = 0
    while head < len(order):
        v = order[head]
        head += 1
        fv = fail[v]
        row = go[v]
        fail_row = go[fv]
        for c in range(26):
            u = row[c]
            if u == -1:
                row[c] = fail_row[c]
            else:
                fail[u] = fail_row[c]
                order.append(u)

    state = 0
    for byte in text:
        c = byte - 97
        if c < 0 or c >= 26:
            continue
        state = go[state][c]
        count[state] += 1

    for i in range(len(order) - 1, -1, -1):
        v = order[i]
        count[fail[v]] += count[v]

    lines = [str(count[terminal[i]]) for i in range(n)]
    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
