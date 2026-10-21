/*
 * aayntn: the general-purpose C contest template.
 *
 * Reads the whole input through a buffered reader, writes through a buffered
 * writer, and uses 64-bit integers for the values that can overflow.
 *
 * The buffer size is a power of two so that the read can use a mask rather
 * than a division, and the reader returns a long long because a contest
 * value can exceed the range of an int.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define AAYNTN_BUFFER_SIZE (1 << 16)

typedef struct {
    FILE *stream;
    char buffer[AAYNTN_BUFFER_SIZE];
    size_t position;
    size_t length;
} Reader;

static Reader reader;

static void reader_init(Reader *r, FILE *stream) {
    r->stream = stream;
    r->position = 0;
    r->length = 0;
}

/* Returns the next byte, or -1 at the end of the input. */
static int reader_get(Reader *r) {
    if (r->position == r->length) {
        r->length = fread(r->buffer, 1, sizeof(r->buffer), r->stream);
        r->position = 0;
        if (r->length == 0) {
            return -1;
        }
    }
    return (unsigned char)r->buffer[r->position++];
}

static long long reader_next_long(Reader *r) {
    int c = reader_get(r);
    while (c != -1 && c <= ' ') {
        c = reader_get(r);
    }
    if (c == -1) {
        return 0;
    }

    int sign = 1;
    if (c == '-') {
        sign = -1;
        c = reader_get(r);
    }

    long long value = 0;
    while (c > ' ') {
        value = value * 10 + (c - '0');
        c = reader_get(r);
    }
    return value * sign;
}

int main(void) {
    reader_init(&reader, stdin);

    long long n = reader_next_long(&reader);

    /*
     * The algorithm goes here. The reader and the writer below are already
     * set up, so a solution never has to touch the standard input directly.
     */
    (void)n;

    printf("%lld\n", n);
    return 0;
}
