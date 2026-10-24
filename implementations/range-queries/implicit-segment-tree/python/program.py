"""An implicit segment tree over the fixed domain [1, m].

Input: m q, then q operations. "1 p v" adds v to position p, and "2 l r"
queries the sum over the inclusive range [l, r]. All values start at zero, so a
node that was never created stands for an all-zero interval.

Output: one line per query, holding the range sum.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    m = int(data[0])
    q = int(data[1])
    if m < 1 or q < 0:
        return

    left = [0]
    right = [0]
    total = [0]

    def new_node():
        left.append(0)
        right.append(0)
        total.append(0)
        return len(total) - 1

    def add(node, lo, hi, pos, delta):
        total[node] += delta
        if lo == hi:
            return
        mid = (lo + hi) // 2
        if pos <= mid:
            if left[node] == 0:
                left[node] = new_node()
            add(left[node], lo, mid, pos, delta)
        else:
            if right[node] == 0:
                right[node] = new_node()
            add(right[node], mid + 1, hi, pos, delta)

    def query(node, lo, hi, ql, qr):
        if node == 0 or qr < lo or hi < ql:
            return 0
        if ql <= lo and hi <= qr:
            return total[node]
        mid = (lo + hi) // 2
        result = 0
        if ql <= mid:
            result += query(left[node], lo, mid, ql, qr)
        if qr > mid:
            result += query(right[node], mid + 1, hi, ql, qr)
        return result

    root = new_node()
    index = 2
    output = []
    for _ in range(q):
        if index + 1 >= len(data):
            break
        kind = int(data[index])
        index += 1
        if kind == 1:
            pos = int(data[index])
            delta = int(data[index + 1])
            index += 2
            add(root, 1, m, pos, delta)
        elif kind == 2:
            l = int(data[index])
            r = int(data[index + 1])
            index += 2
            output.append(str(query(root, 1, m, l, r)))
        else:
            break

    if output:
        sys.stdout.write("\n".join(output) + "\n")


if __name__ == "__main__":
    main()
