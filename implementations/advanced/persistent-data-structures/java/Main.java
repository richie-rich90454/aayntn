import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StreamTokenizer;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        StreamTokenizer in = new StreamTokenizer(reader);

        in.nextToken();
        int q = (int) in.nval;

        int[] value = new int[q + 1];
        int[] parent = new int[q + 1];
        int[] root = new int[q + 1];
        root[0] = -1;

        int nodes = 0;
        int versions = 0;
        StringBuilder out = new StringBuilder();

        for (int i = 0; i < q; ++i) {
            in.nextToken();
            int type = (int) in.nval;
            in.nextToken();
            int v = (int) in.nval;

            if (type == 1) {
                in.nextToken();
                int x = (int) in.nval;
                value[nodes] = x;
                parent[nodes] = root[v];
                ++versions;
                root[versions] = nodes;
                ++nodes;
            } else if (type == 2) {
                int old = root[v];
                ++versions;
                root[versions] = (old == -1) ? -1 : parent[old];
            } else {
                int top = root[v];
                out.append(top == -1 ? -1 : value[top]).append('\n');
            }
        }

        System.out.print(out);
    }
}
