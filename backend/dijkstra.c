/*
 * FrostRoute — Dijkstra's algorithm only (non-negative edge weights).
 * Stdin (text):
 *   first line: n source target m   (n nodes 0..n-1, m undirected edges listed once)
 *   next m lines: u v w             (u,v endpoints, w weight; graph is made undirected)
 * Stdout: JSON
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#define MAX_NODES 256
#define MAX_EDGES 4096
#define INF ((long long)LLONG_MAX / 4)

typedef struct Edge {
    int to;
    long long w;
    struct Edge *next;
} Edge;

static Edge *adj[MAX_NODES];
static int n_nodes;
static Edge edge_pool[MAX_EDGES];
static int edge_pi;

static void add_edge(int u, int v, long long w) {
    if (u < 0 || v < 0 || u >= MAX_NODES || v >= MAX_NODES) return;
    if (edge_pi >= MAX_EDGES) return;
    Edge *e = &edge_pool[edge_pi++];
    e->to = v;
    e->w = w;
    e->next = adj[u];
    adj[u] = e;
}

static void clear_graph(int n) {
    int i;
    n_nodes = n;
    edge_pi = 0;
    for (i = 0; i < MAX_NODES; i++) adj[i] = NULL;
}

static void dijkstra(
    int n,
    int source,
    int target,
    long long *dist_out,
    int *parent_out,
    int *visit_order,
    int *visit_len
) {
    static int visited[MAX_NODES];
    static long long dist[MAX_NODES];
    int i, u, vl;

    for (i = 0; i < n; i++) {
        dist[i] = INF;
        parent_out[i] = -1;
        visited[i] = 0;
    }
    dist[source] = 0;
    vl = 0;

    for (;;) {
        u = -1;
        long long best = INF;
        for (i = 0; i < n; i++) {
            if (!visited[i] && dist[i] < best) {
                best = dist[i];
                u = i;
            }
        }
        if (u < 0 || best >= INF) break;
        visited[u] = 1;
        if (visit_order && vl < MAX_NODES) visit_order[vl++] = u;

        for (Edge *e = adj[u]; e; e = e->next) {
            int v = e->to;
            if (visited[v]) continue;
            if (dist[u] + e->w < dist[v]) {
                dist[v] = dist[u] + e->w;
                parent_out[v] = u;
            }
        }
    }

    for (i = 0; i < n; i++) dist_out[i] = dist[i];
    if (visit_len) *visit_len = vl;
}

int main(void) {
    int n, source, target, m;
    if (scanf("%d %d %d %d", &n, &source, &target, &m) != 4) {
        printf("{\"ok\":false,\"error\":\"bad header\"}\n");
        return 1;
    }
    if (n <= 0 || n > MAX_NODES) {
        printf("{\"ok\":false,\"error\":\"invalid n\"}\n");
        return 1;
    }

    clear_graph(n);
    {
        int i;
        for (i = 0; i < m; i++) {
            int u, v;
            long long w;
            if (scanf("%d %d %lld", &u, &v, &w) != 3) break;
            if (u < 0 || v < 0 || u >= n || v >= n) continue;
            if (w < 0) w = 0;
            add_edge(u, v, w);
            add_edge(v, u, w);
        }
    }

    static long long dist[MAX_NODES];
    static int parent[MAX_NODES];
    static int visit_order[MAX_NODES];
    int visit_len = 0;

    dijkstra(n, source, target, dist, parent, visit_order, &visit_len);

    static int path[MAX_NODES];
    int plen = 0;
    if (dist[target] < INF && target >= 0 && target < n) {
        int cur = target;
        while (cur >= 0 && plen < MAX_NODES) {
            path[plen++] = cur;
            cur = parent[cur];
        }
        int a = 0, b = plen - 1;
        while (a < b) {
            int t = path[a];
            path[a] = path[b];
            path[b] = t;
            a++;
            b--;
        }
    }

    printf("{\"ok\":true,\"source\":%d,\"target\":%d,\"distance\":", source, target);
    if (dist[target] >= INF) printf("null");
    else printf("%lld", dist[target]);
    printf(",\"path\":[");
    {
        int i;
        for (i = 0; i < plen; i++) {
            if (i) printf(",");
            printf("%d", path[i]);
        }
    }
    printf("],\"visitOrder\":[");
    {
        int i;
        for (i = 0; i < visit_len; i++) {
            if (i) printf(",");
            printf("%d", visit_order[i]);
        }
    }
    printf("],\"distances\":[");
    {
        int i;
        for (i = 0; i < n; i++) {
            if (i) printf(",");
            if (dist[i] >= INF) printf("null");
            else printf("%lld", dist[i]);
        }
    }
    printf("]}\n");
    return 0;
}
