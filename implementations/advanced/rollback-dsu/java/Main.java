import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Main {
    private static int[] parent;
    private static int[] size;
    private static int[] historyChild;
    private static int[] historyRoot;
    private static int[] historySize;
    private static int historyTop;

    private static int find(int v) {
        while (parent[v] != v) {
            v = parent[v];
        }
        return v;
    }

    private static void unite(int a, int b) {
        int ra = find(a);
        int rb = find(b);
        if (ra == rb) {
            historyChild[historyTop] = 0;
            historyRoot[historyTop] = 0;
            historySize[historyTop] = 0;
            historyTop += 1;
            return;
        }
        if (size[ra] < size[rb]) {
            int swap = ra;
            ra = rb;
            rb = swap;
        }
        historyChild[historyTop] = rb;
        historyRoot[historyTop] = ra;
        historySize[historyTop] = size[ra];
        historyTop += 1;
        parent[rb] = ra;
        size[ra] += size[rb];
    }

    private static void rollback() {
        if (historyTop == 0) {
            return;
        }
        historyTop -= 1;
        int child = historyChild[historyTop];
        if (child == 0) {
            return;
        }
        parent[child] = child;
        size[historyRoot[historyTop]] = historySize[historyTop];
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String first = in.readLine();
        if (first == null) {
            return;
        }
        StringTokenizer header = new StringTokenizer(first);
        int n = Integer.parseInt(header.nextToken());
        int q = Integer.parseInt(header.nextToken());

        parent = new int[n + 1];
        size = new int[n + 1];
        historyChild = new int[q + 1];
        historyRoot = new int[q + 1];
        historySize = new int[q + 1];
        for (int v = 1; v <= n; ++v) {
            parent[v] = v;
            size[v] = 1;
        }

        StringBuilder out = new StringBuilder();
        for (int i = 0; i < q; ++i) {
            String line = in.readLine();
            while (line != null && line.trim().isEmpty()) {
                line = in.readLine();
            }
            if (line == null) {
                break;
            }
            StringTokenizer tokens = new StringTokenizer(line);
            String command = tokens.nextToken();
            if (command.equals("union")) {
                int u = Integer.parseInt(tokens.nextToken());
                int v = Integer.parseInt(tokens.nextToken());
                unite(u, v);
            } else if (command.equals("rollback")) {
                rollback();
            } else {
                int u = Integer.parseInt(tokens.nextToken());
                int v = Integer.parseInt(tokens.nextToken());
                out.append(find(u) == find(v) ? "YES" : "NO").append('\n');
            }
        }
        System.out.print(out);
    }
}
