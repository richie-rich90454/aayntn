import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;

/**
 * Suffix tree of s + '$', built by inserting every suffix and splitting an
 * edge whenever two suffixes diverge inside it. Each node stores the start and
 * the length of its incoming edge, so every label is a view of the input.
 */
public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        if (s == null) {
            s = "";
        }

        String t = s + "$";
        int N = t.length();
        int cap = 2 * N + 2;

        int[] child = new int[cap * 27];
        Arrays.fill(child, -1);
        int[] edgeStart = new int[cap];
        int[] edgeLen = new int[cap];
        int[] depth = new int[cap];
        int[] childCount = new int[cap];

        int size = 1;
        for (int i = 0; i < N; i++) {
            int v = 0;
            int pos = i;
            while (true) {
                int c = t.charAt(pos) == '$' ? 26 : t.charAt(pos) - 'a';
                int u = child[v * 27 + c];
                if (u == -1) {
                    int leaf = size++;
                    edgeStart[leaf] = pos;
                    edgeLen[leaf] = N - pos;
                    depth[leaf] = depth[v] + edgeLen[leaf];
                    child[v * 27 + c] = leaf;
                    childCount[v]++;
                    break;
                }

                int maxl = Math.min(edgeLen[u], N - pos);
                int l = 0;
                while (l < maxl && t.charAt(edgeStart[u] + l) == t.charAt(pos + l)) {
                    l++;
                }

                if (l == edgeLen[u]) {
                    v = u;
                    pos += l;
                    if (pos == N) {
                        break;
                    }
                } else {
                    int w = size++;
                    child[v * 27 + c] = w;
                    edgeStart[w] = edgeStart[u];
                    edgeLen[w] = l;
                    depth[w] = depth[v] + l;

                    int code = t.charAt(edgeStart[u] + l) == '$' ? 26 : t.charAt(edgeStart[u] + l) - 'a';
                    child[w * 27 + code] = u;
                    childCount[w]++;
                    edgeStart[u] += l;
                    edgeLen[u] -= l;

                    int leaf = size++;
                    edgeStart[leaf] = pos + l;
                    edgeLen[leaf] = N - (pos + l);
                    depth[leaf] = depth[w] + edgeLen[leaf];
                    code = t.charAt(pos + l) == '$' ? 26 : t.charAt(pos + l) - 'a';
                    child[w * 27 + code] = leaf;
                    childCount[w]++;
                    break;
                }
            }
        }

        long total = 0;
        int best = 0;
        for (int v = 1; v < size; v++) {
            total += edgeLen[v];
            if (childCount[v] >= 2 && depth[v] > best) {
                best = depth[v];
            }
        }

        System.out.println(total - N);
        System.out.println(best);
    }
}
