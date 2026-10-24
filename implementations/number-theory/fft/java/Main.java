import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StreamTokenizer;

/**
 * Multiply two polynomials with the iterative radix-2 complex FFT.
 *
 * <p>Input: n, the n coefficients of the first polynomial, m, and the m
 * coefficients of the second.
 * Output: the n + m - 1 coefficients of the product, rounded to integers.
 */
public final class Main {

    private Main() {
    }

    /*
     * The iterative radix-2 Cooley-Tukey transform, in place. A positive
     * angle is the forward transform and a negative angle is the inverse,
     * which is then divided by n.
     */
    private static void fft(double[] re, double[] im, boolean invert) {
        final int n = re.length;

        int j = 0;
        for (int i = 1; i < n; i++) {
            int bit = n >> 1;
            while ((j & bit) != 0) {
                j ^= bit;
                bit >>= 1;
            }
            j ^= bit;
            if (i < j) {
                double t = re[i];
                re[i] = re[j];
                re[j] = t;
                t = im[i];
                im[i] = im[j];
                im[j] = t;
            }
        }

        for (int len = 2; len <= n; len <<= 1) {
            final double angle = (invert ? -2.0 : 2.0) * Math.PI / len;
            final double wlenRe = Math.cos(angle);
            final double wlenIm = Math.sin(angle);
            final int half = len >> 1;
            for (int start = 0; start < n; start += len) {
                double wRe = 1.0;
                double wIm = 0.0;
                for (int k = 0; k < half; k++) {
                    final double uRe = re[start + k];
                    final double uIm = im[start + k];
                    final double vRe =
                            re[start + k + half] * wRe - im[start + k + half] * wIm;
                    final double vIm =
                            re[start + k + half] * wIm + im[start + k + half] * wRe;
                    re[start + k] = uRe + vRe;
                    im[start + k] = uIm + vIm;
                    re[start + k + half] = uRe - vRe;
                    im[start + k + half] = uIm - vIm;
                    final double nextRe = wRe * wlenRe - wIm * wlenIm;
                    wIm = wRe * wlenIm + wIm * wlenRe;
                    wRe = nextRe;
                }
            }
        }

        if (invert) {
            for (int i = 0; i < n; i++) {
                re[i] /= n;
                im[i] /= n;
            }
        }
    }

    /** Round to nearest, with exact halves going away from zero. */
    private static long roundHalfAway(double x) {
        return (long) (x >= 0.0 ? x + 0.5 : x - 0.5);
    }

    private static int nextInt(StreamTokenizer in) throws IOException {
        in.nextToken();
        return (int) in.nval;
    }

    public static void main(String[] args) throws IOException {
        final StreamTokenizer in =
                new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));

        final int n = nextInt(in);
        final double[] aRe = new double[n];
        final double[] aIm = new double[n];
        for (int i = 0; i < n; i++) {
            aRe[i] = nextInt(in);
        }

        final int m = nextInt(in);
        final double[] bRe = new double[m];
        final double[] bIm = new double[m];
        for (int i = 0; i < m; i++) {
            bRe[i] = nextInt(in);
        }

        final int total = n + m - 1;
        int size = 1;
        while (size < total) {
            size <<= 1;
        }

        final double[] reA = new double[size];
        final double[] imA = new double[size];
        final double[] reB = new double[size];
        final double[] imB = new double[size];
        System.arraycopy(aRe, 0, reA, 0, n);
        System.arraycopy(bRe, 0, reB, 0, m);

        fft(reA, imA, false);
        fft(reB, imB, false);
        for (int i = 0; i < size; i++) {
            final double re = reA[i] * reB[i] - imA[i] * imB[i];
            final double im = reA[i] * imB[i] + imA[i] * reB[i];
            reA[i] = re;
            imA[i] = im;
        }
        fft(reA, imA, true);

        final StringBuilder out = new StringBuilder();
        for (int i = 0; i < total; i++) {
            if (i > 0) {
                out.append(' ');
            }
            out.append(roundHalfAway(reA[i]));
        }
        out.append('\n');
        System.out.print(out);
    }
}
