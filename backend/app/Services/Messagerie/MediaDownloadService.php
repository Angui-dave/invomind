<?php

namespace App\Services\Messagerie;

use App\Models\Inbox;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Resolve WhatsApp media IDs (Graph) into stored public URLs.
 * Messenger/Instagram already provide direct URLs in webhooks.
 */
class MediaDownloadService
{
    public function resoudreUrlMedia(?string $urlOuId, Inbox $inbox, string $typeContenu = 'image'): ?string
    {
        if ($urlOuId === null || $urlOuId === '') {
            return null;
        }

        // Already a URL (Messenger / Instagram / public link)
        if (str_starts_with($urlOuId, 'http://') || str_starts_with($urlOuId, 'https://')) {
            return $urlOuId;
        }

        // WhatsApp media ID → fetch URL then download
        $creds = $inbox->identifiants ?? [];
        $token = (string) ($creds['access_token'] ?? '');
        if ($token === '') {
            return $urlOuId;
        }

        try {
            $meta = Http::withToken($token)
                ->timeout(15)
                ->get($this->graphUrl($urlOuId));

            if (! $meta->successful()) {
                Log::warning('WhatsApp media metadata fetch failed', [
                    'media_id' => $urlOuId,
                    'status' => $meta->status(),
                ]);

                return $urlOuId;
            }

            $downloadUrl = $meta->json('url');
            if (! is_string($downloadUrl) || $downloadUrl === '') {
                return $urlOuId;
            }

            $binary = Http::withToken($token)
                ->timeout(30)
                ->withHeaders(['User-Agent' => 'InvoMind/1.0'])
                ->get($downloadUrl);

            if (! $binary->successful()) {
                Log::warning('WhatsApp media binary download failed', [
                    'media_id' => $urlOuId,
                ]);

                return $urlOuId;
            }

            $ext = match ($typeContenu) {
                'image' => 'jpg',
                'audio' => 'ogg',
                'video' => 'mp4',
                'fichier' => 'bin',
                default => 'bin',
            };
            $mime = (string) ($binary->header('Content-Type') ?? '');
            if (str_contains($mime, 'png')) {
                $ext = 'png';
            } elseif (str_contains($mime, 'jpeg') || str_contains($mime, 'jpg')) {
                $ext = 'jpg';
            } elseif (str_contains($mime, 'webp')) {
                $ext = 'webp';
            } elseif (str_contains($mime, 'pdf')) {
                $ext = 'pdf';
            } elseif (str_contains($mime, 'mp4')) {
                $ext = 'mp4';
            } elseif (str_contains($mime, 'ogg') || str_contains($mime, 'opus')) {
                $ext = 'ogg';
            }

            $path = 'messagerie/'.($inbox->orga_id).'/'.Str::uuid().'.'.$ext;
            Storage::disk('public')->put($path, $binary->body());

            return Storage::disk('public')->url($path);
        } catch (\Throwable $e) {
            Log::warning('MediaDownloadService failed', [
                'media_id' => $urlOuId,
                'error' => $e->getMessage(),
            ]);

            return $urlOuId;
        }
    }

    private function graphUrl(string $path): string
    {
        $base = rtrim((string) config('messagerie.meta.graph_base'), '/');
        $version = (string) config('messagerie.meta.graph_version');

        return "{$base}/{$version}/".ltrim($path, '/');
    }
}
