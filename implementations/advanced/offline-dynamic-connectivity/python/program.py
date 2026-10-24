import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    position = 0
    n = int(data[position])
    position += 1
    q = int(data[position])
    position += 1
    if q <= 0:
        return

    op_type = [0] * (q + 1)
    op_u = [0] * (q + 1)
    op_v = [0] * (q + 1)
    edge_u = [0]
    edge_v = [0]
    buckets = [[] for _ in range(4 * q + 5)]
    active: dict[tuple[int, int], tuple[int, int]] = {}

    def add_interval(node: int, lo: int, hi: int, ql: int, qr: int, edge: int) -> None:
        if qr < lo or hi < ql:
            return
        if ql <= lo and hi <= qr:
            buckets[node].append(edge)
            return
        mid = (lo + hi) // 2
        add_interval(node * 2, lo, mid, ql, qr, edge)
        add_interval(node * 2 + 1, mid + 1, hi, ql, qr, edge)

    for time in range(1, q + 1):
        if position + 2 >= len(data):
            break
        kind = int(data[position])
        u = int(data[position + 1])
        v = int(data[position + 2])
        position += 3
        op_type[time] = kind
        op_u[time] = u
        op_v[time] = v
        key = (u, v) if u <= v else (v, u)
        if kind == 1:
            edge_u.append(u)
            edge_v.append(v)
            active[key] = (time, len(edge_u) - 1)
        elif kind == 2:
            opened = active.pop(key, None)
            if opened is not None:
                start, edge = opened
                if start <= time - 1:
                    add_interval(1, 1, q, start, time - 1, edge)

    for start, edge in active.values():
        add_interval(1, 1, q, start, q, edge)

    parent = list(range(n + 1))
    set_size = [1] * (n + 1)
    history: list[tuple[int, int, int]] = []

    def find(v: int) -> int:
        while parent[v] != v:
            v = parent[v]
        return v

    def unite(a: int, b: int) -> None:
        ra = find(a)
        rb = find(b)
        if ra == rb:
            return
        if set_size[ra] < set_size[rb]:
            ra, rb = rb, ra
        history.append((rb, ra, set_size[ra]))
        parent[rb] = ra
        set_size[ra] += set_size[rb]

    def rollback_to(checkpoint: int) -> None:
        while len(history) > checkpoint:
            child, root, old_size = history.pop()
            parent[child] = child
            set_size[root] = old_size

    answer = [False] * (q + 1)

    def solve(node: int, lo: int, hi: int) -> None:
        checkpoint = len(history)
        for edge in buckets[node]:
            unite(edge_u[edge], edge_v[edge])
        if lo == hi:
            if op_type[lo] == 3:
                answer[lo] = find(op_u[lo]) == find(op_v[lo])
        else:
            mid = (lo + hi) // 2
            solve(node * 2, lo, mid)
            solve(node * 2 + 1, mid + 1, hi)
        rollback_to(checkpoint)

    solve(1, 1, q)

    out = []
    for time in range(1, q + 1):
        if op_type[time] == 3:
            out.append("YES" if answer[time] else "NO")
    if out:
        sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
