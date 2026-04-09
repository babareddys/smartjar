package com.smartjar.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Simulating Redis-level high-speed bucket
    // Key: IP address, Value: [Timestamp, HitCount]
    private final ConcurrentHashMap<String, long[]> cache = new ConcurrentHashMap<>();

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final long TIME_WINDOW_MS = 60000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
            
        String path = request.getRequestURI();
        
        // Only throttle the verification and highly-sensitive vectors
        if (path.startsWith("/api/auth/verify") || path.startsWith("/api/security/confirm-reset")) {
            String ip = request.getRemoteAddr();
            long currentTime = System.currentTimeMillis();
            
            cache.compute(ip, (key, val) -> {
                if (val == null || currentTime - val[0] > TIME_WINDOW_MS) {
                    return new long[]{currentTime, 1};
                } else {
                    val[1]++;
                    return val;
                }
            });

            long[] stats = cache.get(ip);
            if (stats[1] > MAX_REQUESTS_PER_MINUTE) {
                logger.warn("Velocity/Rate Limiter Blocked IP: " + ip);
                response.setStatus(429);
                response.getWriter().write("Too Many Requests. Rate Limit Exceeded.");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
