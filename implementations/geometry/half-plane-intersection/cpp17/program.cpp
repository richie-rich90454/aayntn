#include <cstdlib>
#include <iostream>
#include <vector>

/*
 * A half-plane a*x + b*y <= c is a directed line together with the side on
 * which it is feasible. The feasible region is the intersection of all the
 * half-planes. The polygon is kept in the dual form: a cyclic list of the
 * lines that support its edges, so the vertex between two consecutive lines is
 * their intersection and no coordinate is stored until the area is printed.
 */
struct Line {
    long long a;
    long long b;
    long long c;
};

static long long gcd64(long long a, long long b) {
    if (a < 0) {
        a = -a;
    }
    if (b < 0) {
        b = -b;
    }
    while (b != 0) {
        long long remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
}

/*
 * Whether the intersection of u and v lies in the closed half-plane h.
 * With w = det(u, v), x = X/w and y = Y/w, the value of h at that point has
 * the sign of (h.a*X + h.b*Y - h.c*w) multiplied by the sign of w.
 */
static bool inside(const Line& u, const Line& v, const Line& h) {
    const long long w = u.a * v.b - v.a * u.b;
    if (w == 0) {
        return true;
    }
    const long long x = u.c * v.b - v.c * u.b;
    const long long y = u.a * v.c - v.a * u.c;
    const long long numerator = h.a * x + h.b * y - h.c * w;
    return w > 0 ? numerator <= 0 : numerator >= 0;
}

/* The intersection of u and v as the reduced homogeneous point (x/w, y/w). */
static bool intersect(const Line& u, const Line& v, long long& x, long long& y, long long& w) {
    w = u.a * v.b - v.a * u.b;
    x = u.c * v.b - v.c * u.b;
    y = u.a * v.c - v.a * u.c;
    if (w == 0) {
        return false;
    }
    const long long divisor = gcd64(gcd64(x, y), w);
    x /= divisor;
    y /= divisor;
    w /= divisor;
    if (w < 0) {
        x = -x;
        y = -y;
        w = -w;
    }
    return true;
}

int main() {
    long long n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    std::vector<Line> planes(static_cast<std::size_t>(n));
    long long max_a = 1;
    long long max_c = 0;
    for (long long i = 0; i < n; i++) {
        std::cin >> planes[static_cast<std::size_t>(i)].a >> planes[static_cast<std::size_t>(i)].b >>
            planes[static_cast<std::size_t>(i)].c;
        const long long aa = std::llabs(planes[static_cast<std::size_t>(i)].a);
        const long long bb = std::llabs(planes[static_cast<std::size_t>(i)].b);
        const long long cc = std::llabs(planes[static_cast<std::size_t>(i)].c);
        if (aa > max_a) {
            max_a = aa;
        }
        if (bb > max_a) {
            max_a = bb;
        }
        if (cc > max_c) {
            max_c = cc;
        }
    }

    /*
     * Every vertex of a bounded region is the intersection of two input
     * lines, so its coordinates are at most 2*max_a*max_c in absolute value.
     * The box is larger than every such vertex.
     */
    const long long m = 2 * max_a * max_c + 2;

    std::vector<Line> lines{{0, -1, m}, {1, 0, m}, {0, 1, m}, {-1, 0, m}};
    std::vector<int> poly{0, 1, 2, 3};

    for (const Line& h : planes) {
        const int index = static_cast<int>(lines.size());
        lines.push_back(h);

        const int k = static_cast<int>(poly.size());
        std::vector<char> ins(static_cast<std::size_t>(k));
        bool any_inside = false;
        for (int i = 0; i < k; i++) {
            const int j = (i + 1) % k;
            ins[static_cast<std::size_t>(i)] =
                inside(lines[static_cast<std::size_t>(poly[i])],
                       lines[static_cast<std::size_t>(poly[j])], h)
                    ? 1
                    : 0;
            any_inside = any_inside || ins[static_cast<std::size_t>(i)] != 0;
        }
        if (!any_inside) {
            poly.clear();
            continue;
        }

        std::vector<int> next;
        next.reserve(static_cast<std::size_t>(k) + 1);
        for (int i = 0; i < k; i++) {
            const int j = (i + 1) % k;
            if (ins[static_cast<std::size_t>(i)] != 0 || ins[static_cast<std::size_t>(j)] != 0) {
                next.push_back(poly[static_cast<std::size_t>(j)]);
            }
            if (ins[static_cast<std::size_t>(i)] != 0 &&
                ins[static_cast<std::size_t>(j)] == 0) {
                next.push_back(index);
            }
        }
        poly.swap(next);
    }

    if (poly.empty()) {
        std::cout << "0\n";
        return 0;
    }

    /*
     * The region is unbounded exactly when some nonzero direction d satisfies
     * a*d.x + b*d.y <= 0 for every constraint. An extreme ray of that cone is
     * parallel to one of the constraint lines, so testing both directions of
     * every line is enough.
     */
    bool has_normal = false;
    for (const Line& plane : planes) {
        if (plane.a != 0 || plane.b != 0) {
            has_normal = true;
        }
    }
    if (!has_normal) {
        std::cout << "UNBOUNDED\n";
        return 0;
    }

    bool unbounded = false;
    for (std::size_t i = 0; i < planes.size() && !unbounded; i++) {
        if (planes[i].a == 0 && planes[i].b == 0) {
            continue;
        }
        for (int direction = 0; direction < 2 && !unbounded; direction++) {
            const long long dx = direction == 0 ? -planes[i].b : planes[i].b;
            const long long dy = direction == 0 ? planes[i].a : -planes[i].a;
            bool feasible = true;
            for (const Line& plane : planes) {
                if (plane.a * dx + plane.b * dy > 0) {
                    feasible = false;
                    break;
                }
            }
            if (feasible) {
                unbounded = true;
            }
        }
    }
    if (unbounded) {
        std::cout << "UNBOUNDED\n";
        return 0;
    }

    if (poly.size() < 3) {
        std::cout << "0\n";
        return 0;
    }

    const int k = static_cast<int>(poly.size());
    std::vector<long long> vx(static_cast<std::size_t>(k));
    std::vector<long long> vy(static_cast<std::size_t>(k));
    std::vector<long long> vw(static_cast<std::size_t>(k));
    for (int i = 0; i < k; i++) {
        const int j = (i + 1) % k;
        if (!intersect(lines[static_cast<std::size_t>(poly[i])],
                       lines[static_cast<std::size_t>(poly[j])], vx[static_cast<std::size_t>(i)],
                       vy[static_cast<std::size_t>(i)], vw[static_cast<std::size_t>(i)])) {
            std::cout << "0\n";
            return 0;
        }
    }

    long long numerator = 0;
    long long denominator = 1;
    for (int i = 0; i < k; i++) {
        const int j = (i + 1) % k;
        long long term = vx[static_cast<std::size_t>(i)] * vy[static_cast<std::size_t>(j)] -
                         vy[static_cast<std::size_t>(i)] * vx[static_cast<std::size_t>(j)];
        long long scale = vw[static_cast<std::size_t>(i)] * vw[static_cast<std::size_t>(j)];
        if (scale < 0) {
            term = -term;
            scale = -scale;
        }
        long long divisor = gcd64(term, scale);
        term /= divisor;
        scale /= divisor;
        numerator = numerator * scale + term * denominator;
        denominator *= scale;
        divisor = gcd64(numerator, denominator);
        numerator /= divisor;
        denominator /= divisor;
    }
    if (numerator < 0) {
        numerator = -numerator;
    }

    if (denominator == 1) {
        std::cout << numerator << '\n';
    } else {
        std::cout << numerator << '/' << denominator << '\n';
    }
    return 0;
}
