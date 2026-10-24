#include <iostream>
#include <vector>

/*
 * The circle is stored as the points that define it, never as a center and a
 * radius: the center of a circumcircle is rational, and storing it would drag
 * rational arithmetic into every containment test.
 */
struct Point {
    long long x;
    long long y;
};

struct Circle {
    int kind; // 0 point, 1 diameter, 2 counterclockwise circumcircle
    Point a;
    Point b;
    Point c;
};

long long dist2(const Point& a, const Point& b) {
    long long dx = a.x - b.x;
    long long dy = a.y - b.y;
    return dx * dx + dy * dy;
}

long long cross(const Point& a, const Point& b, const Point& c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

long long dot(const Point& a, const Point& b) {
    return a.x * b.x + a.y * b.y;
}

Circle point_circle(const Point& p) {
    return Circle{0, p, p, p};
}

Circle diameter_circle(const Point& a, const Point& b) {
    return Circle{1, a, b, a};
}

bool inside(const Circle& c, const Point& p) {
    if (c.kind == 0) {
        return c.a.x == p.x && c.a.y == p.y;
    }
    if (c.kind == 1) {
        Point u{p.x - c.a.x, p.y - c.a.y};
        Point v{p.x - c.b.x, p.y - c.b.y};
        return dot(u, v) <= 0;
    }
    long long ax = c.a.x - p.x;
    long long ay = c.a.y - p.y;
    long long bx = c.b.x - p.x;
    long long by = c.b.y - p.y;
    long long cx = c.c.x - p.x;
    long long cy = c.c.y - p.y;
    long long al = ax * ax + ay * ay;
    long long bl = bx * bx + by * by;
    long long cl = cx * cx + cy * cy;
    long long det = ax * (by * cl - bl * cy)
                  - ay * (bx * cl - bl * cx)
                  + al * (bx * cy - by * cx);
    return det >= 0;
}

/*
 * Three non-collinear points have exactly one circumcircle. Three collinear
 * points have none, and the smallest circle containing them is the diameter of
 * the farthest pair.
 */
void set_circumcircle(Circle& c, Point a, Point b, Point d) {
    if (cross(a, b, d) < 0) {
        std::swap(b, d);
    }
    if (cross(a, b, d) == 0) {
        long long ab = dist2(a, b);
        long long ad = dist2(a, d);
        long long bd = dist2(b, d);
        if (ab >= ad && ab >= bd) {
            c = diameter_circle(a, b);
        } else if (ad >= bd) {
            c = diameter_circle(a, d);
        } else {
            c = diameter_circle(b, d);
        }
        return;
    }
    c = Circle{2, a, b, d};
}

long long squared_radius(const Circle& c) {
    if (c.kind == 0) {
        return 0;
    }
    if (c.kind == 1) {
        return dist2(c.a, c.b) / 4;
    }
    long long ab = dist2(c.a, c.b);
    long long bc = dist2(c.b, c.c);
    long long ca = dist2(c.c, c.a);
    long long cr = cross(c.a, c.b, c.c);
    return (ab * bc * ca) / (4 * cr * cr);
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n <= 0) {
        std::cout << "0\n";
        return 0;
    }

    std::vector<Point> pts(n);
    for (Point& p : pts) {
        std::cin >> p.x >> p.y;
    }

    Circle c = point_circle(pts[0]);
    for (int i = 0; i < n; i++) {
        if (inside(c, pts[i])) {
            continue;
        }
        c = point_circle(pts[i]);
        for (int j = 0; j < i; j++) {
            if (inside(c, pts[j])) {
                continue;
            }
            c = diameter_circle(pts[i], pts[j]);
            for (int k = 0; k < j; k++) {
                if (!inside(c, pts[k])) {
                    set_circumcircle(c, pts[i], pts[j], pts[k]);
                }
            }
        }
    }

    std::cout << squared_radius(c) << '\n';
    return 0;
}
