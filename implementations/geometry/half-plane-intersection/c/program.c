#include <stdio.h>
#include <stdlib.h>

/*
 * A half-plane a*x + b*y <= c is a directed line together with the side on
 * which it is feasible. The feasible region is the intersection of all the
 * half-planes. The polygon is kept in the dual form: a cyclic list of the
 * lines that support its edges, so the vertex between two consecutive lines is
 * their intersection and no coordinate is stored until the area is printed.
 */
typedef struct {
    long long a;
    long long b;
    long long c;
} line;

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
static int inside(const line *u, const line *v, const line *h) {
    long long w = u->a * v->b - v->a * u->b;
    if (w == 0) {
        return 1;
    }
    long long x = u->c * v->b - v->c * u->b;
    long long y = u->a * v->c - v->a * u->c;
    long long numerator = h->a * x + h->b * y - h->c * w;
    return w > 0 ? numerator <= 0 : numerator >= 0;
}

/* The intersection of u and v as the reduced homogeneous point (x/w, y/w). */
static int intersect(const line *u, const line *v, long long *x, long long *y, long long *w) {
    *w = u->a * v->b - v->a * u->b;
    *x = u->c * v->b - v->c * u->b;
    *y = u->a * v->c - v->a * u->c;
    if (*w == 0) {
        return 0;
    }
    long long divisor = gcd64(gcd64(*x, *y), *w);
    *x /= divisor;
    *y /= divisor;
    *w /= divisor;
    if (*w < 0) {
        *x = -*x;
        *y = -*y;
        *w = -*w;
    }
    return 1;
}

int main(void) {
    long long n = 0;
    if (scanf("%lld", &n) != 1) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    line *planes = malloc((size_t)(n + 1) * sizeof(*planes));
    if (planes == NULL) {
        return 0;
    }

    long long max_a = 1;
    long long max_c = 0;
    for (long long i = 0; i < n; i++) {
        if (scanf("%lld %lld %lld", &planes[i].a, &planes[i].b, &planes[i].c) != 3) {
            free(planes);
            return 0;
        }
        long long aa = planes[i].a < 0 ? -planes[i].a : planes[i].a;
        long long bb = planes[i].b < 0 ? -planes[i].b : planes[i].b;
        long long cc = planes[i].c < 0 ? -planes[i].c : planes[i].c;
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
    long long m = 2 * max_a * max_c + 2;

    long long capacity = n + 8;
    line *lines = malloc((size_t)capacity * sizeof(*lines));
    int *poly = malloc((size_t)capacity * sizeof(*poly));
    int *next = malloc((size_t)capacity * sizeof(*next));
    int *ins = malloc((size_t)capacity * sizeof(*ins));
    if (lines == NULL || poly == NULL || next == NULL || ins == NULL) {
        free(planes);
        free(lines);
        free(poly);
        free(next);
        free(ins);
        return 0;
    }

    /* The box [-m, m]^2, with its edges in counterclockwise order. */
    lines[0].a = 0;
    lines[0].b = -1;
    lines[0].c = m;
    lines[1].a = 1;
    lines[1].b = 0;
    lines[1].c = m;
    lines[2].a = 0;
    lines[2].b = 1;
    lines[2].c = m;
    lines[3].a = -1;
    lines[3].b = 0;
    lines[3].c = m;
    int line_count = 4;
    int poly_count = 4;
    poly[0] = 0;
    poly[1] = 1;
    poly[2] = 2;
    poly[3] = 3;

    for (long long step = 0; step < n; step++) {
        int h = line_count;
        lines[h] = planes[step];
        line_count += 1;

        int any_inside = 0;
        for (int i = 0; i < poly_count; i++) {
            int j = (i + 1) % poly_count;
            ins[i] = inside(&lines[poly[i]], &lines[poly[j]], &lines[h]);
            any_inside |= ins[i];
        }
        if (!any_inside) {
            poly_count = 0;
            continue;
        }

        int count = 0;
        for (int i = 0; i < poly_count; i++) {
            int j = (i + 1) % poly_count;
            if (ins[i] || ins[j]) {
                next[count] = poly[j];
                count += 1;
            }
            if (ins[i] && !ins[j]) {
                next[count] = h;
                count += 1;
            }
        }
        for (int i = 0; i < count; i++) {
            poly[i] = next[i];
        }
        poly_count = count;
    }

    if (poly_count == 0) {
        printf("0\n");
        free(planes);
        free(lines);
        free(poly);
        free(next);
        free(ins);
        return 0;
    }

    /*
     * The region is unbounded exactly when some nonzero direction d satisfies
     * a*d.x + b*d.y <= 0 for every constraint. An extreme ray of that cone is
     * parallel to one of the constraint lines, so testing both directions of
     * every line is enough.
     */
    int has_normal = 0;
    for (long long i = 0; i < n; i++) {
        if (planes[i].a != 0 || planes[i].b != 0) {
            has_normal = 1;
        }
    }
    if (!has_normal) {
        printf("UNBOUNDED\n");
        free(planes);
        free(lines);
        free(poly);
        free(next);
        free(ins);
        return 0;
    }

    int unbounded = 0;
    for (long long i = 0; i < n && !unbounded; i++) {
        if (planes[i].a == 0 && planes[i].b == 0) {
            continue;
        }
        for (int direction = 0; direction < 2 && !unbounded; direction++) {
            long long dx = direction == 0 ? -planes[i].b : planes[i].b;
            long long dy = direction == 0 ? planes[i].a : -planes[i].a;
            int feasible = 1;
            for (long long j = 0; j < n; j++) {
                if (planes[j].a * dx + planes[j].b * dy > 0) {
                    feasible = 0;
                    break;
                }
            }
            if (feasible) {
                unbounded = 1;
            }
        }
    }
    if (unbounded) {
        printf("UNBOUNDED\n");
        free(planes);
        free(lines);
        free(poly);
        free(next);
        free(ins);
        return 0;
    }

    if (poly_count < 3) {
        printf("0\n");
        free(planes);
        free(lines);
        free(poly);
        free(next);
        free(ins);
        return 0;
    }

    long long *vx = malloc((size_t)poly_count * sizeof(*vx));
    long long *vy = malloc((size_t)poly_count * sizeof(*vy));
    long long *vw = malloc((size_t)poly_count * sizeof(*vw));
    if (vx == NULL || vy == NULL || vw == NULL) {
        free(planes);
        free(lines);
        free(poly);
        free(next);
        free(ins);
        free(vx);
        free(vy);
        free(vw);
        return 0;
    }
    for (int i = 0; i < poly_count; i++) {
        int j = (i + 1) % poly_count;
        if (!intersect(&lines[poly[i]], &lines[poly[j]], &vx[i], &vy[i], &vw[i])) {
            free(planes);
            free(lines);
            free(poly);
            free(next);
            free(ins);
            free(vx);
            free(vy);
            free(vw);
            printf("0\n");
            return 0;
        }
    }

    long long numerator = 0;
    long long denominator = 1;
    for (int i = 0; i < poly_count; i++) {
        int j = (i + 1) % poly_count;
        long long term = vx[i] * vy[j] - vy[i] * vx[j];
        long long scale = vw[i] * vw[j];
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
        printf("%lld\n", numerator);
    } else {
        printf("%lld/%lld\n", numerator, denominator);
    }

    free(planes);
    free(lines);
    free(poly);
    free(next);
    free(ins);
    free(vx);
    free(vy);
    free(vw);
    return 0;
}
