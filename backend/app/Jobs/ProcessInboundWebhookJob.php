<?php

namespace App\Jobs;

use App\Enums\CanalMessagerie;
use App\Services\Messagerie\CanalAdapterFactory;
use App\Services\Messagerie\DeliveryStatusService;
use App\Services\Messagerie\InboundMessageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProcessInboundWebhookJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [5, 15, 60, 180];

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, string>  $headers
     */
    public function __construct(
        public string $canal,
        public array $payload,
        public array $headers = [],
        public string $rawBody = '',
    ) {}

    public function handle(
        CanalAdapterFactory $factory,
        InboundMessageService $ingest,
        DeliveryStatusService $statuses,
    ): void {
        $request = Request::create('/webhooks/internal', 'POST', $this->payload, [], [], [], $this->rawBody);
        foreach ($this->headers as $key => $value) {
            $request->headers->set($key, $value);
        }

        try {
            $adapter = $factory->forCanal(CanalMessagerie::from($this->canal));
        } catch (\Throwable $e) {
            Log::info('Inbound webhook skipped', ['canal' => $this->canal, 'reason' => $e->getMessage()]);

            return;
        }

        foreach ($adapter->normaliserEvenement($request) as $dto) {
            $ingest->ingerer($dto);
        }

        foreach ($adapter->normaliserStatuts($request) as $statusDto) {
            $statuses->appliquer($statusDto);
        }
    }
}
