import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class Main {
    private static List<List<Integer>> adjacency;
    private static boolean[] onPath;
    private static long expanded;
    private static int target;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) {
            scanner.close();
            return;
        }
        int n = scanner.nextInt();
        int m = scanner.nextInt();
        int start = scanner.nextInt();
        target = scanner.nextInt();
        if (n < 1 || m < 0 || start < 1 || start > n || target < 1 || target > n) {
            scanner.close();
            return;
        }

        adjacency = new ArrayList<>(n + 1);
        adjacency.add(new ArrayList<>());
        for (int i = 1; i <= n; i++) {
            adjacency.add(new ArrayList<>());
        }
        for (int i = 0; i < m; i++) {
            int u = scanner.nextInt();
            int v = scanner.nextInt();
            if (u < 1 || u > n || v < 1 || v > n) {
                scanner.close();
                return;
            }
            adjacency.get(u).add(v);
            adjacency.get(v).add(u);
        }
        scanner.close();

        onPath = new boolean[n + 1];
        int answer = -1;
        for (int limit = 0; limit < n; limit++) {
            Arrays.fill(onPath, false);
            if (depthLimitedSearch(start, 0, limit)) {
                answer = limit;
                break;
            }
        }
        System.out.println(answer + " " + expanded);
    }

    private static boolean depthLimitedSearch(int vertex, int depth, int limit) {
        onPath[vertex] = true;
        expanded += 1;
        if (vertex == target) {
            return true;
        }
        if (depth == limit) {
            onPath[vertex] = false;
            return false;
        }
        for (int neighbor : adjacency.get(vertex)) {
            if (!onPath[neighbor] && depthLimitedSearch(neighbor, depth + 1, limit)) {
                return true;
            }
        }
        onPath[vertex] = false;
        return false;
    }
}
