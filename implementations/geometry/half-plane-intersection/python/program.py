"""Intersect a family of half-planes a*x + b*y <= c exactly.

A half-plane a*x + b*y <= c is a directed line together with the side on which
it is feasible. The feasible region is the intersection of all the half-planes.
The polygon is kept in the dual form: a cyclic list of the lines that support
its edges, so the vertex between two consecutive lines is their intersection
and no coordinate is stored until the area is printed.

Input: n, then n lines "a b c".
Output: twice the area as an exact integer, as an exact fraction if the
denominator is not one, or UNBOUNDED.
"""

import sys
from math import gcd


def inside(u, v, h):
    """Whether the intersection of u and v lies in the closed half-plane h.

    With w = det(u, v), x = X/w and y = Y/w, the value of h at that point has
    the sign of (h[0]*X + h[1]*Y - h[2]*w) multiplied by the sign of w.
    """
    w = u[0] * v[1] - v[0] * u[1]
    if w == 0:
        return True
    x = u[2] * v[1] - v[2] * u[1]
    y = u[0] * v[2] - v[0] * u[2]
    numerator = h[0] * x + h[1] * y - h[2] * w
    return numerator <= 0 if w > 0 else numerator >= 0


def intersect(u, v):
    """The intersection of u and v as the reduced homogeneous point (x/w, y/w)."""
    w = u[0] * v[1] - v[0] * u[1]
    x = u[2] * v[1] - v[2] * u[1]
    y = u[0] * v[2] - v[0] * u[2]
    if w == 0:
        return x, y, w
    divisor = gcd(gcd(abs(x), abs(y)), abs(w))
    x //= divisor
    y //= divisor
    w //= divisor
    if w < 0:
        x = -x
        y = -y
        w = -w
    return x, y, w


def solve(data):
    if not data:
        return ""
    n = max(0, data[0])
    planes = []
    index = 1
    max_a = 1
    max_c = 0
    for _ in range(n):
        if index + 2 >= len(data):
            break
        a, b, c = data[index], data[index + 1], data[index + 2]
        index += 3
        planes.append((a, b, c))
        max_a = max(max_a, abs(a), abs(b))
        max_c = max(max_c, abs(c))

    # Every vertex of a bounded region is the intersection of two input
    # lines, so its coordinates are at most 2*max_a*max_c in absolute value.
    # The box is larger than every such vertex.
    m = 2 * max_a * max_c + 2

    # The box [-m, m]^2, with its edges in counterclockwise order.
    lines = [(0, -1, m), (1, 0, m), (0, 1, m), (-1, 0, m)]
    poly = [0, 1, 2, 3]

    for a, b, c in planes:
        h = len(lines)
        lines.append((a, b, c))
        k = len(poly)
        ins = [inside(lines[poly[i]], lines[poly[(i + 1) % k]], lines[h]) for i in range(k)]
        if not any(ins):
            poly = []
            continue
        new_poly = []
        for i in range(k):
            j = (i + 1) % k
            if ins[i] or ins[j]:
                new_poly.append(poly[j])
            if ins[i] and not ins[j]:
                new_poly.append(h)
        poly = new_poly

    if not poly:
        return "0\n"

    # The region is unbounded exactly when some nonzero direction d satisfies
    # a*d.x + b*d.y <= 0 for every constraint. An extreme ray of that cone is
    # parallel to one of the constraint lines, so testing both directions of
    # every line is enough.
    has_normal = any(a != 0 or b != 0 for a, b, _ in planes)
    if not has_normal:
        return "UNBOUNDED\n"
    for a, b, _ in planes:
        if a == 0 and b == 0:
            continue
        for dx, dy in ((-b, a), (b, -a)):
            if all(pa * dx + pb * dy <= 0 for pa, pb, _ in planes):
                return "UNBOUNDED\n"

    if len(poly) < 3:
        return "0\n"

    vertices = []
    for i in range(len(poly)):
        u = lines[poly[i]]
        v = lines[poly[(i + 1) % len(poly)]]
        x, y, w = intersect(u, v)
        if w == 0:
            return "0\n"
        vertices.append((x, y, w))

    numerator = 0
    denominator = 1
    for i in range(len(vertices)):
        x1, y1, w1 = vertices[i]
        x2, y2, w2 = vertices[(i + 1) % len(vertices)]
        term = x1 * y2 - y1 * x2
        scale = w1 * w2
        if scale < 0:
            term = -term
            scale = -scale
        divisor = gcd(abs(term), scale)
        term //= divisor
        scale //= divisor
        numerator = numerator * scale + term * denominator
        denominator *= scale
        divisor = gcd(abs(numerator), denominator)
        numerator //= divisor
        denominator //= divisor
    if numerator < 0:
        numerator = -numerator

    if denominator == 1:
        return f"{numerator}\n"
    return f"{numerator}/{denominator}\n"


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    sys.stdout.write(solve(data))


if __name__ == "__main__":
    main()
