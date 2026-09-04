<?php

return [

    'tiktok' => [
        'enabled' => (bool) env('MESSAGERIE_TIKTOK_ENABLED', false),
    ],

    'fenetre_reponse_heures' => [
        'whatsapp' => 24,
        'messenger' => 24,
        'instagram' => 24,
        'tiktok' => 48,
    ],

    'rate_limits' => [
        // max outbound sends per minute per inbox
        'whatsapp' => (int) env('MESSAGERIE_RATE_WHATSAPP', 60),
        'messenger' => (int) env('MESSAGERIE_RATE_MESSENGER', 60),
        'instagram' => (int) env('MESSAGERIE_RATE_INSTAGRAM', 60),
        'tiktok' => (int) env('MESSAGERIE_RATE_TIKTOK', 20),
    ],

    'meta' => [
        'graph_version' => env('META_GRAPH_VERSION', 'v21.0'),
        'graph_base' => env('META_GRAPH_BASE', 'https://graph.facebook.com'),
    ],

];
