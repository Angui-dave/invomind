<?php

namespace App\Services\Messagerie;

use App\Enums\CanalMessagerie;
use App\Enums\ModeBoiteReception;
use App\Models\Inbox;
use App\Services\Messagerie\Adapters\FakeCanalAdapter;
use App\Services\Messagerie\Adapters\InstagramAdapter;
use App\Services\Messagerie\Adapters\MessengerAdapter;
use App\Services\Messagerie\Adapters\TiktokAdapter;
use App\Services\Messagerie\Adapters\WhatsAppAdapter;
use App\Services\Messagerie\Contracts\CanalAdapterInterface;
use App\Services\Messagerie\Exceptions\CanalIndisponibleException;
use InvalidArgumentException;

class CanalAdapterFactory
{
    public function for(Inbox $boite): CanalAdapterInterface
    {
        if ($boite->mode === ModeBoiteReception::Fake) {
            return app(FakeCanalAdapter::class);
        }

        return match ($boite->canal) {
            CanalMessagerie::Whatsapp => app(WhatsAppAdapter::class),
            CanalMessagerie::Messenger => app(MessengerAdapter::class),
            CanalMessagerie::Instagram => app(InstagramAdapter::class),
            CanalMessagerie::Tiktok => $this->tiktok(),
            default => throw new InvalidArgumentException('Canal non supporté.'),
        };
    }

    public function forCanal(CanalMessagerie|string $canal): CanalAdapterInterface
    {
        $value = $canal instanceof CanalMessagerie ? $canal : CanalMessagerie::from($canal);

        return match ($value) {
            CanalMessagerie::Whatsapp => app(WhatsAppAdapter::class),
            CanalMessagerie::Messenger => app(MessengerAdapter::class),
            CanalMessagerie::Instagram => app(InstagramAdapter::class),
            CanalMessagerie::Tiktok => $this->tiktok(),
        };
    }

    public function metaSignatureAdapter(): CanalAdapterInterface
    {
        return app(WhatsAppAdapter::class);
    }

    private function tiktok(): CanalAdapterInterface
    {
        if (! config('messagerie.tiktok.enabled')) {
            throw new CanalIndisponibleException(
                'TikTok est désactivé (MESSAGERIE_TIKTOK_ENABLED=false).'
            );
        }

        return app(TiktokAdapter::class);
    }
}
