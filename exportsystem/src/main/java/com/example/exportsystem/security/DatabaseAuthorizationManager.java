package com.example.exportsystem.security;

import com.example.exportsystem.entity.ApiAccessRule;
import com.example.exportsystem.repository.ApiAccessRuleRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.server.PathContainer;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

import java.util.List;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Component
public class DatabaseAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private static final Logger log = LoggerFactory.getLogger(DatabaseAuthorizationManager.class);

    private final ApiAccessRuleRepository ruleRepository;
    private final PathPatternParser parser = new PathPatternParser();
    private volatile List<CompiledRule> rules = List.of();

    public DatabaseAuthorizationManager(ApiAccessRuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(fixedDelayString = "${app.security.access-rules-refresh-ms:30000}", initialDelayString = "${app.security.access-rules-refresh-ms:30000}")
    public void reload() {
        try {
            rules = ruleRepository.findAll().stream()
                    .map(this::compile)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to reload API access rules, keeping previous rules", e);
        }
    }

    private CompiledRule compile(ApiAccessRule rule) {
        String method = rule.getHttpMethod();
        boolean anyMethod = method == null || method.isBlank() || method.equals("*");
        String permission = rule.getPermission();
        return new CompiledRule(
                anyMethod ? null : method.trim().toUpperCase(),
                parser.parse(rule.getPathPattern().trim()),
                "ROLE_" + rule.getRoleName().trim(),
                permission == null || permission.isBlank() ? null : permission.trim()
        );
    }

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authenticationSupplier, RequestAuthorizationContext context) {
        Authentication authentication = authenticationSupplier.get();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return new AuthorizationDecision(false);
        }

        HttpServletRequest request = context.getRequest();
        String path = request.getRequestURI().substring(request.getContextPath().length());
        PathContainer pathContainer = PathContainer.parsePath(path);
        String method = request.getMethod();

        List<CompiledRule> matching = rules.stream()
                .filter(rule -> rule.method() == null || rule.method().equalsIgnoreCase(method))
                .filter(rule -> rule.pattern().matches(pathContainer))
                .toList();
        if (matching.isEmpty()) {
            return new AuthorizationDecision(false);
        }

        PathPattern mostSpecific = matching.stream()
                .map(CompiledRule::pattern)
                .min(PathPattern.SPECIFICITY_COMPARATOR)
                .orElseThrow();

        Set<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        boolean granted = matching.stream()
                .filter(rule -> rule.pattern().getPatternString().equals(mostSpecific.getPatternString()))
                .anyMatch(rule -> authorities.contains(rule.role())
                        && (rule.permission() == null || authorities.contains(rule.permission())));

        return new AuthorizationDecision(granted);
    }

    private record CompiledRule(String method, PathPattern pattern, String role, String permission) {}
}
