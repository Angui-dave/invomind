<?php

namespace App\Support;

class SafeOutboundUrl
{
    /**
     * Reject non-HTTPS URLs and hosts that resolve to private/link-local/loopback addresses.
     */
    public static function isAllowed(string $url): bool
    {
        $url = trim($url);
        if ($url === '') {
            return false;
        }

        $parts = parse_url($url);
        if (! is_array($parts)) {
            return false;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        if ($scheme !== 'https') {
            return false;
        }

        $host = (string) ($parts['host'] ?? '');
        if ($host === '' || filter_var($host, FILTER_VALIDATE_IP)) {
            // Raw IP hosts: only allow public IPs
            return $host !== '' && self::isPublicIp($host);
        }

        if (in_array(strtolower($host), ['localhost', 'metadata.google.internal'], true)) {
            return false;
        }

        if (str_ends_with(strtolower($host), '.local') || str_ends_with(strtolower($host), '.internal')) {
            return false;
        }

        $ips = gethostbynamel($host);
        if ($ips === false || $ips === []) {
            return false;
        }

        foreach ($ips as $ip) {
            if (! self::isPublicIp($ip)) {
                return false;
            }
        }

        return true;
    }

    private static function isPublicIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }
}
