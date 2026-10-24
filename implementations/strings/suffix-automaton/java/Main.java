import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/*
 * The suffix automaton of a string.
 *
 * Input: one line holding a nonempty string of lowercase Latin letters.
 * Output: the number of distinct nonempty substrings, then the number of
 * occurrences of the lexicographically smallest nonempty substring.
 *
 * The transition table is a flat int array, so the 26 entries of a state are
 * contiguous. Prefix states are seeded with one occurrence and clones with
 * zero; the counters are pushed up the suffix links in decreasing length order.
 */
public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String s = reader.readLine();
        if (s == null) {
            s = "";
        }
        while (s.endsWith("\r")) {
            s = s.substring(0, s.length() - 1);
        }

        final int n = s.length();
        if (n == 0) {
            System.out.println(0);
            System.out.println(0);
            return;
        }

        final int states = 2 * n + 2;
        final int[] go = new int[states * 26];
        java.util.Arrays.fill(go, -1);
        final int[] maxLen = new int[states];
        final int[] link = new int[states];
        final long[] count = new long[states];
        link[0] = -1;

        int size = 1;
        int last = 0;
        for (int i = 0; i < n; ++i) {
            final int c = s.charAt(i) - 'a';
            final int cur = size++;
            maxLen[cur] = maxLen[last] + 1;
            count[cur] = 1;

            int p = last;
            while (p != -1 && go[p * 26 + c] == -1) {
                go[p * 26 + c] = cur;
                p = link[p];
            }

            if (p == -1) {
                link[cur] = 0;
            } else {
                final int q = go[p * 26 + c];
                if (maxLen[p] + 1 == maxLen[q]) {
                    link[cur] = q;
                } else {
                    final int clone = size++;
                    maxLen[clone] = maxLen[p] + 1;
                    System.arraycopy(go, q * 26, go, clone * 26, 26);
                    link[clone] = link[q];
                    count[clone] = 0;

                    while (p != -1 && go[p * 26 + c] == q) {
                        go[p * 26 + c] = clone;
                        p = link[p];
                    }
                    link[q] = clone;
                    link[cur] = clone;
                }
            }
            last = cur;
        }

        final int[] bucket = new int[n + 1];
        for (int v = 1; v < size; ++v) {
            ++bucket[maxLen[v]];
        }
        for (int i = 1; i <= n; ++i) {
            bucket[i] += bucket[i - 1];
        }

        final int[] order = new int[size - 1];
        for (int v = size - 1; v >= 1; --v) {
            order[--bucket[maxLen[v]]] = v;
        }
        for (int i = size - 2; i >= 0; --i) {
            final int v = order[i];
            count[link[v]] += count[v];
        }

        long distinct = 0;
        for (int v = 1; v < size; ++v) {
            distinct += (long) (maxLen[v] - maxLen[link[v]]);
        }

        int smallest = 25;
        for (int i = 0; i < n; ++i) {
            smallest = Math.min(smallest, s.charAt(i) - 'a');
        }
        final int target = go[smallest];

        System.out.println(distinct);
        System.out.println(count[target]);
    }
}
