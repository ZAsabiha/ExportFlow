package com.example.exportsystem.notification;

import com.example.exportsystem.dto.notification.NotificationResponse;
import com.example.exportsystem.event.NotificationCreatedEvent;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class NotificationStreamService {

    private static final long EMITTER_TIMEOUT_MS = 30L * 60 * 1000;
    private static final String ROLE_PREFIX = "role:";
    private static final String EMAIL_PREFIX = "email:";

    private final Map<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribeClient(String email) {
        return subscribe(EMAIL_PREFIX + email.toLowerCase(Locale.ROOT));
    }

    public SseEmitter subscribeRole(String role) {
        return subscribe(ROLE_PREFIX + role);
    }

    @TransactionalEventListener(fallbackExecution = true)
    public void onNotificationCreated(NotificationCreatedEvent event) {
        if (event.getRecipientEmail() != null) {
            send(EMAIL_PREFIX + event.getRecipientEmail().toLowerCase(Locale.ROOT), event.getNotification());
        }
        if (event.getRecipientRole() != null) {
            send(ROLE_PREFIX + event.getRecipientRole(), event.getNotification());
        }
    }

    @Scheduled(fixedRate = 25000)
    public void heartbeat() {
        emitters.forEach((key, set) -> set.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (IOException | IllegalStateException e) {
                remove(key, emitter);
            }
        }));
    }

    private SseEmitter subscribe(String key) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.computeIfAbsent(key, k -> new CopyOnWriteArraySet<>()).add(emitter);
        emitter.onCompletion(() -> remove(key, emitter));
        emitter.onTimeout(() -> remove(key, emitter));
        emitter.onError(e -> remove(key, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            remove(key, emitter);
        }
        return emitter;
    }

    private void send(String key, NotificationResponse notification) {
        Set<SseEmitter> targets = emitters.get(key);
        if (targets == null) {
            return;
        }
        for (SseEmitter emitter : List.copyOf(targets)) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .id(String.valueOf(notification.getId()))
                        .data(notification, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException e) {
                remove(key, emitter);
            }
        }
    }

    private void remove(String key, SseEmitter emitter) {
        emitters.computeIfPresent(key, (k, set) -> {
            set.remove(emitter);
            return set.isEmpty() ? null : set;
        });
    }
}
