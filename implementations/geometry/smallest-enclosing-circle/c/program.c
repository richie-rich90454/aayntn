#include <stdio.h>
#include <stdlib.h>

/*
 * The circle is stored as the points that define it, never as a center and a
 * radius: the center of a circumcircle is rational, and storing it would drag
 * rational arithmetic into every containment test.
 */
typedef struct {
    long long x;
    long long y;
} point;

typedef struct {
    int kind; /* 0 point, 1 diameter, 2 counterclockwise circumcircle */
    point a;
    point b;
    point c;
} circle;

static long long dist2(point a, point b) {
    long long dx = a.x - b.x;
    long long dy = a.y - b.y;
    return dx * dx + dy * dy;
}

static long long cross(point a, point b, point c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

static long long dot(point a, point b) {
    return a.x * b.x + a.y * b.y;
}

static circle make_point(point p) {
    circle c;
    c.kind = 0;
    c.a = p;
    c.b = p;
    c.c = p;
    return c;
}

static circle make_diameter(point a, point b) {
    circle c;
    c.kind = 1;
    c.a = a;
    c.b = b;
    c.c = a;
    return c;
}

static int inside(const circle *c, point p) {
    if (c->kind == 0) {
        return c->a.x == p.x && c->a.y == p.y;
    }
    if (c->kind == 1) {
        point u;
        point v;
        u.x = p.x - c->a.x;
        u.y = p.y - c->a.y;
        v.x = p.x - c->b.x;
        v.y = p.y - c->b.y;
        return dot(u, v) <= 0;
    }
    {
        long long ax = c->a.x - p.x;
        long long ay = c->a.y - p.y;
        long long bx = c->b.x - p.x;
        long long by = c->b.y - p.y;
        long long cx = c->c.x - p.x;
        long long cy = c->c.y - p.y;
        long long al = ax * ax + ay * ay;
        long long bl = bx * bx + by * by;
        long long cl = cx * cx + cy * cy;
        long long det = ax * (by * cl - bl * cy)
                      - ay * (bx * cl - bl * cx)
                      + al * (bx * cy - by * cx);
        return det >= 0;
    }
}

/*
 * Three non-collinear points have exactly one circumcircle. Three collinear
 * points have none, and the smallest circle containing them is the diameter of
 * the farthest pair.
 */
static void set_circumcircle(circle *c, point a, point b, point d) {
    if (cross(a, b, d) < 0) {
        point t = b;
        b = d;
        d = t;
    }
    if (cross(a, b, d) == 0) {
        long long ab = dist2(a, b);
        long long ad = dist2(a, d);
        long long bd = dist2(b, d);
        if (ab >= ad && ab >= bd) {
            *c = make_diameter(a, b);
        } else if (ad >= bd) {
            *c = make_diameter(a, d);
        } else {
            *c = make_diameter(b, d);
        }
        return;
    }
    c->kind = 2;
    c->a = a;
    c->b = b;
    c->c = d;
}

static long long squared_radius(const circle *c) {
    if (c->kind == 0) {
        return 0;
    }
    if (c->kind == 1) {
        return dist2(c->a, c->b) / 4;
    }
    {
        long long ab = dist2(c->a, c->b);
        long long bc = dist2(c->b, c->c);
        long long ca = dist2(c->c, c->a);
        long long cr = cross(c->a, c->b, c->c);
        return (ab * bc * ca) / (4 * cr * cr);
    }
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n <= 0) {
        printf("0\n");
        return 0;
    }

    point *pts = malloc((size_t)n * sizeof *pts);
    if (pts == NULL) {
        return 0;
    }
    for (int i = 0; i < n; i++) {
        if (scanf("%lld %lld", &pts[i].x, &pts[i].y) != 2) {
            free(pts);
            return 0;
        }
    }

    circle c = make_point(pts[0]);
    for (int i = 0; i < n; i++) {
        if (inside(&c, pts[i])) {
            continue;
        }
        c = make_point(pts[i]);
        for (int j = 0; j < i; j++) {
            if (inside(&c, pts[j])) {
                continue;
            }
            c = make_diameter(pts[i], pts[j]);
            for (int k = 0; k < j; k++) {
                if (!inside(&c, pts[k])) {
                    set_circumcircle(&c, pts[i], pts[j], pts[k]);
                }
            }
        }
    }

    printf("%lld\n", squared_radius(&c));
    free(pts);
    return 0;
}
