package com.skillbridge.platform.chat.repository;

import com.skillbridge.platform.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c WHERE (c.participantAId = :userId OR c.participantBId = :userId) ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<Conversation> findAllForUser(@Param("userId") UUID userId);

    @Query("""
            SELECT c FROM Conversation c
            WHERE (c.participantAId = :userA AND c.participantBId = :userB)
               OR (c.participantAId = :userB AND c.participantBId = :userA)
            """)
    Optional<Conversation> findBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
