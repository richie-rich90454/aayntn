import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.StringTokenizer;

public class Main {
    private static int[] parent;
    private static int[] setSize;
    private static int[] historyChild;
    private static int[] historyRoot;
    private static int[] historySize;
    private static int historyTop;

    private static int[] opType;
    private static int[] opU;
    private static int[] opV;

    private static int[] edgeU;
    private static int[] edgeV;
    private static int edgeCount;

    private static int[] head;
    private static int[] nextEntry;
    private static int[] entryEdge;
    private static int entryCount;

    private static boolean[] answer;

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
            return;
        }
        if (setSize[ra] < setSize[rb]) {
            int swap = ra;
            ra = rb;
            rb = swap;
        }
        historyChild[historyTop] = rb;
        historyRoot[historyTop] = ra;
        historySize[historyTop] = setSize[ra];
        historyTop += 1;
        parent[rb] = ra;
        setSize[ra] += setSize[rb];
    }

    private static void rollbackTo(int checkpoint) {
        while (historyTop > checkpoint) {
            historyTop -= 1;
            parent[historyChild[historyTop]] = historyChild[historyTop];
            setSize[historyRoot[historyTop]] = historySize[historyTop];
        }
    }

    private static void addInterval(int node, int lo, int hi, int ql, int qr, int edge) {
        if (qr < lo || hi < ql) {
            return;
        }
        if (ql <= lo && hi <= qr) {
            nextEntry[entryCount] = head[node];
            entryEdge[entryCount] = edge;
            head[node] = entryCount;
            entryCount += 1;
            return;
        }
        int mid = (lo + hi) / 2;
        addInterval(node * 2, lo, mid, ql, qr, edge);
        addInterval(node * 2 + 1, mid + 1, hi, ql, qr, edge);
    }

    private static void solve(int node, int lo, int hi) {
        int checkpoint = historyTop;
        for (int e = head[node]; e != -1; e = nextEntry[e]) {
            int id = entryEdge[e];
            unite(edgeU[id], edgeV[id]);
        }
        if (lo == hi) {
            if (opType[lo] == 3) {
                answer[lo] = find(opU[lo]) == find(opV[lo]);
            }
        } else {
            int mid = (lo + hi) / 2;
            solve(node * 2, lo, mid);
            solve(node * 2 + 1, mid + 1, hi);
        }
        rollbackTo(checkpoint);
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line = in.readLine();
        while (line != null && line.trim().isEmpty()) {
            line = in.readLine();
        }
        if (line == null) {
            return;
        }
        StringTokenizer header = new StringTokenizer(line);
        int n = Integer.parseInt(header.nextToken());
        int q = Integer.parseInt(header.nextToken());
        if (q <= 0) {
            return;
        }

        opType = new int[q + 1];
        opU = new int[q + 1];
        opV = new int[q + 1];
        edgeU = new int[q + 1];
        edgeV = new int[q + 1];
        head = new int[4 * q + 5];
        Arrays.fill(head, -1);
        int slotLimit = 40 * q + 10;
        nextEntry = new int[slotLimit];
        entryEdge = new int[slotLimit];
        answer = new boolean[q + 1];

        parent = new int[n + 1];
        setSize = new int[n + 1];
        historyChild = new int[q + 1];
        historyRoot = new int[q + 1];
        historySize = new int[q + 1];
        for (int v = 1; v <= n; ++v) {
            parent[v] = v;
            setSize[v] = 1;
        }

        Map<Long, int[]> active = new HashMap<>();
        for (int t = 1; t <= q; ++t) {
            line = in.readLine();
            while (line != null && line.trim().isEmpty()) {
                line = in.readLine();
            }
            if (line == null) {
                break;
            }
            StringTokenizer tokens = new StringTokenizer(line);
            int type = Integer.parseInt(tokens.nextToken());
            int u = Integer.parseInt(tokens.nextToken());
            int v = Integer.parseInt(tokens.nextToken());
            opType[t] = type;
            opU[t] = u;
            opV[t] = v;
            long key = (long) Math.min(u, v) * (n + 1) + Math.max(u, v);
            if (type == 1) {
                edgeCount += 1;
                edgeU[edgeCount] = u;
                edgeV[edgeCount] = v;
                active.put(key, new int[] {t, edgeCount});
            } else if (type == 2) {
                int[] opened = active.remove(key);
                if (opened != null && opened[0] <= t - 1) {
                    addInterval(1, 1, q, opened[0], t - 1, opened[1]);
                }
            }
        }
        for (int[] opened : active.values()) {
            addInterval(1, 1, q, opened[0], q, opened[1]);
        }

        solve(1, 1, q);

        StringBuilder out = new StringBuilder();
        for (int t = 1; t <= q; ++t) {
            if (opType[t] == 3) {
                out.append(answer[t] ? "YES" : "NO").append('\n');
            }
        }
        System.out.print(out);
    }
}
