package com.skillbridge.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SkillBridge AI - Entry point.
 * AI-powered hyperlocal employment platform connecting workers with
 * micro-entrepreneurs for permanent jobs and hourly gigs.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class PlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlatformApplication.class, args);
    }
}
