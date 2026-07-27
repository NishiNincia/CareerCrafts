package com.skillbridge.platform.common.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares the exchanges/queues used for async cross-module workflows,
 * e.g. gig-dispatch fan-out, notification delivery, and resume-parsing jobs.
 */
@Configuration
public class RabbitMqConfig {

    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";
    public static final String NOTIFICATION_QUEUE = "notification.queue";
    public static final String NOTIFICATION_ROUTING_KEY = "notification.send";

    public static final String GIG_DISPATCH_EXCHANGE = "gig.dispatch.exchange";
    public static final String GIG_DISPATCH_QUEUE = "gig.dispatch.queue";
    public static final String GIG_DISPATCH_ROUTING_KEY = "gig.dispatch";

    public static final String RESUME_PARSE_EXCHANGE = "resume.parse.exchange";
    public static final String RESUME_PARSE_QUEUE = "resume.parse.queue";
    public static final String RESUME_PARSE_ROUTING_KEY = "resume.parse";

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public DirectExchange notificationExchange() {
        return new DirectExchange(NOTIFICATION_EXCHANGE);
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder.bind(notificationQueue()).to(notificationExchange()).with(NOTIFICATION_ROUTING_KEY);
    }

    @Bean
    public DirectExchange gigDispatchExchange() {
        return new DirectExchange(GIG_DISPATCH_EXCHANGE);
    }

    @Bean
    public Queue gigDispatchQueue() {
        return new Queue(GIG_DISPATCH_QUEUE, true);
    }

    @Bean
    public Binding gigDispatchBinding() {
        return BindingBuilder.bind(gigDispatchQueue()).to(gigDispatchExchange()).with(GIG_DISPATCH_ROUTING_KEY);
    }

    @Bean
    public DirectExchange resumeParseExchange() {
        return new DirectExchange(RESUME_PARSE_EXCHANGE);
    }

    @Bean
    public Queue resumeParseQueue() {
        return new Queue(RESUME_PARSE_QUEUE, true);
    }

    @Bean
    public Binding resumeParseBinding() {
        return BindingBuilder.bind(resumeParseQueue()).to(resumeParseExchange()).with(RESUME_PARSE_ROUTING_KEY);
    }
}
