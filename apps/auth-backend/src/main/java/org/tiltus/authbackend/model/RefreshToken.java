package org.tiltus.authbackend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
public class RefreshToken {

    @Id @GeneratedValue private UUID id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private CaroUser user;
    @Column(nullable = false, unique = true) private String token;
    @Column(nullable = false, name = "expires") private Instant expiresAt;
    @Column(nullable = false, name = "created_at") private Instant createdAt = Instant.now();

    public RefreshToken(CaroUser user, String token, Instant expiresAt) {
        this.user = user;
        this.token = token;
        this.expiresAt = expiresAt;
    }
}
