package com.skillbridge.platform.websocket.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/** Promotes the Principal stashed in handshake attributes (by {@link WebSocketAuthInterceptor}) to the STOMP session. */
@Component
public class PrincipalHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        Object principal = attributes.get("principal");
        return principal instanceof Principal p ? p : super.determineUser(request, wsHandler, attributes);
    }
}
