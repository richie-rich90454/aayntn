"""The smallest enclosing circle, by the deterministic incremental construction.

The circle is stored as the points that define it, never as a center and a
radius: the center of a circumcircle is rational, and storing it would drag
rational arithmetic into every containment test.
"""

import sys


def dist2(a, b):
    dx = a[0] - b[0]
    dy = a[1] - b[1]
    return dx * dx + dy * dy


def cross(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def point_circle(p):
    return (0, p, p, p)


def diameter_circle(a, b):
    return (1, a, b, a)


def inside(circle, p):
    kind, a, b, c = circle
    if kind == 0:
        return a[0] == p[0] and a[1] == p[1]
    if kind == 1:
        return (p[0] - a[0]) * (p[0] - b[0]) + (p[1] - a[1]) * (p[1] - b[1]) <= 0
    ax = a[0] - p[0]
    ay = a[1] - p[1]
    bx = b[0] - p[0]
    by = b[1] - p[1]
    cx = c[0] - p[0]
    cy = c[1] - p[1]
    al = ax * ax + ay * ay
    bl = bx * bx + by * by
    cl = cx * cx + cy * cy
    det = (
        ax * (by * cl - bl * cy)
        - ay * (bx * cl - bl * cx)
        + al * (bx * cy - by * cx)
    )
    return det >= 0


def set_circumcircle(a, b, d):
    """Normalize the orientation, or fall back to the farthest pair."""
    if cross(a, b, d) < 0:
        b, d = d, b
    if cross(a, b, d) == 0:
        pairs = [(dist2(a, b), a, b), (dist2(a, d), a, d), (dist2(b, d), b, d)]
        _, first, second = max(pairs, key=lambda item: item[0])
        return diameter_circle(first, second)
    return (2, a, b, d)


def squared_radius(circle):
    kind, a, b, c = circle
    if kind == 0:
        return 0
    if kind == 1:
        return dist2(a, b) // 4
    ab = dist2(a, b)
    bc = dist2(b, c)
    ca = dist2(c, a)
    cr = cross(a, b, c)
    return (ab * bc * ca) // (4 * cr * cr)


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return
    n = data[0]
    if n <= 0:
        print(0)
        return
    pts = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]

    circle = point_circle(pts[0])
    for i in range(n):
        if inside(circle, pts[i]):
            continue
        circle = point_circle(pts[i])
        for j in range(i):
            if inside(circle, pts[j]):
                continue
            circle = diameter_circle(pts[i], pts[j])
            for k in range(j):
                if not inside(circle, pts[k]):
                    circle = set_circumcircle(pts[i], pts[j], pts[k])

    print(squared_radius(circle))


if __name__ == "__main__":
    main()
