import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/*
 * Palindrome tree (eertree) over the lowercase Latin alphabet.
 *
 * Input: one line holding the string.
 * Output: two lines, the number of distinct nonempty palindromic substrings and
 * the number of palindromic substrings counting multiplicity.
 *
 * Two roots are kept. Node 0 has length -1 and stands for the imaginary string
 * that makes a single character the child of a real node. Node 1 has length 0
 * and stands for the empty palindrome. Every other node is one distinct
 * palindrome. An edge labeled c adds c to both ends of its parent, and the
 * suffix link of a node is its longest proper palindromic suffix.
 */

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String text = reader.readLine();
        if (text == null) {
            text = "";
        }
        if (text.endsWith("\r")) {
            text = text.substring(0, text.length() - 1);
        }

        int n = text.length();
        int size = n + 2;
        int[] len = new int[size];
        int[] link = new int[size];
        int[] head = new int[size];
        int[] to = new int[size];
        int[] next = new int[size];
        int[] label = new int[size];
        long[] occ = new long[size];

        java.util.Arrays.fill(head, -1);
        len[0] = -1;

        int nodes = 2;
        int last = 1;
        int edges = 0;

        for (int i = 0; i < n; ++i) {
            int cur = last;
            int at;
            int code = text.charAt(i);
            int child = -1;

            while (true) {
                at = i - 1 - len[cur];
                if (at >= 0 && text.charAt(at) == text.charAt(i)) {
                    break;
                }
                cur = link[cur];
            }

            for (int edge = head[cur]; edge != -1; edge = next[edge]) {
                if (label[edge] == code) {
                    child = to[edge];
                    break;
                }
            }

            if (child == -1) {
                child = nodes;
                ++nodes;
                len[child] = len[cur] + 2;
                head[child] = -1;
                label[edges] = code;
                to[edges] = child;
                next[edges] = head[cur];
                head[cur] = edges;
                ++edges;

                if (len[child] == 1) {
                    link[child] = 1;
                } else {
                    int temp = link[cur];
                    while (true) {
                        at = i - 1 - len[temp];
                        if (at >= 0 && text.charAt(at) == text.charAt(i)) {
                            break;
                        }
                        temp = link[temp];
                    }
                    int found = -1;
                    for (int edge = head[temp]; edge != -1; edge = next[edge]) {
                        if (label[edge] == code) {
                            found = to[edge];
                            break;
                        }
                    }
                    link[child] = found;
                }
            }

            last = child;
            ++occ[last];
        }

        for (int v = nodes - 1; v >= 2; --v) {
            occ[link[v]] += occ[v];
        }

        long total = 0;
        for (int v = 2; v < nodes; ++v) {
            total += occ[v];
        }

        StringBuilder out = new StringBuilder();
        out.append(nodes - 2).append('\n').append(total).append('\n');
        System.out.print(out);
    }
}
