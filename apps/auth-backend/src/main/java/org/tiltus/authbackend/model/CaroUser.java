package org.tiltus.authbackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class CaroUser {

    @Id @GeneratedValue private UUID id;
    @Column(nullable = false, name = "tag_id") private String tagId;
    @Column(nullable = false) private String username;
    @Column(nullable = false, unique = true) private String email;
    @Column(nullable = false, name = "password_hash") private String passwordHash;
    @Column(nullable = false, name = "first_name") private String firstName;
    @Column(nullable = false, name = "last_name") private String lastName;
    @Column(nullable = false, name = "created_at") private Instant createdAt = Instant.now();
    @Column(nullable = false, name = "updated_at") private Instant updatedAt = Instant.now();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CaroUserProfile profile;

    public CaroUser(String username, String email, String passwordHash, String firstName, String lastName) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public void setProfile(CaroUserProfile profile) {
        this.profile = profile;
        if (profile != null) {
            profile.setUser(this);
        }
    }
}
