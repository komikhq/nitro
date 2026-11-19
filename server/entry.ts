import { DurableObject } from "cloudflare:workers";

export class GlobalPresenceDO extends DurableObject {
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const visitorId =
      url.searchParams.get("visitorId") || `visitor_${Date.now()}_${crypto.randomUUID()}`;

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server, [visitorId]);
    this.broadcastOnlineCount();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (message === "ping") {
      ws.send("pong");
    }
  }

  override async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): Promise<void> {
    this.broadcastOnlineCount();
  }

  override async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.broadcastOnlineCount();
  }

  private broadcastOnlineCount(): void {
    const sockets = this.ctx.getWebSockets();
    const uniqueVisitorIds = new Set<string>();

    for (const ws of sockets) {
      const tags = this.ctx.getTags(ws);
      if (tags && tags.length > 0 && tags[0]) {
        uniqueVisitorIds.add(tags[0]);
      } else {
        uniqueVisitorIds.add(Math.random().toString());
      }
    }

    const count = uniqueVisitorIds.size;
    const payload = JSON.stringify({ event: "online_count", count });

    for (const ws of sockets) {
      try {
        ws.send(payload);
      } catch {
        // Ignore dead sockets
      }
    }
  }
}

export class CommentStreamDO extends DurableObject {
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal HTTP broadcast endpoint
    if (request.method === "POST" && url.pathname.endsWith("/broadcast")) {
      const payload = await request.json();
      this.broadcastPayload(payload);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // WebSocket upgrade endpoint
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (message === "ping") {
      ws.send("pong");
    }
  }

  override async webSocketClose(): Promise<void> {}
  override async webSocketError(): Promise<void> {}

  private broadcastPayload(payload: any): void {
    const dataStr = JSON.stringify(payload);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(dataStr);
      } catch {
        // Ignore dead sockets
      }
    }
  }
}
