<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'raceresult' => [
        'timeout' => env('RACERESULT_TIMEOUT', 30),
        'cache_ttl' => env('RACERESULT_CACHE_TTL', 60),
        'stale_ttl' => env('RACERESULT_STALE_TTL', 300),
        'refresh_async' => env('RACERESULT_REFRESH_ASYNC', true),
        'refresh_cooldown' => env('RACERESULT_REFRESH_COOLDOWN', 15),
        'refresh_lock_seconds' => env('RACERESULT_REFRESH_LOCK_SECONDS', 20),
        'refresh_lock_wait' => env('RACERESULT_REFRESH_LOCK_WAIT', 5),
        'log_metrics' => env('RACERESULT_LOG_METRICS', false),
    ],

];
