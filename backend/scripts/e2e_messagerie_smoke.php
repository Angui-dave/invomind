<?php

use App\Models\Inbox;
use App\Models\Organization;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use App\Services\Messagerie\InboundMessageService;
use App\Services\Messagerie\DeliveryStatusService;
use App\Services\Messagerie\Dto\NormalizedStatusUpdateDto;
use App\Models\ConversationMessage;
use App\Enums\StatutLivraisonMessage;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$org = Organization::query()->first();
if (! $org) {
    fwrite(STDERR, "NO_ORG\n");
    exit(1);
}

$inbox = Inbox::withoutGlobalScopes()->firstOrCreate(
    [
        'orga_id' => $org->id,
        'canal' => 'whatsapp',
        'nom' => 'WA Fake E2E',
    ],
    [
        'mode' => 'fake',
        'statut_connexion' => 'connectee',
        'actif' => true,
        'identifiants' => ['external_id' => 'fake-inbox'],
    ]
);

$extId = 'fake_msg_'.uniqid();
$dto = new NormalizedInboundMessageDto(
    canal: 'whatsapp',
    inboxExternalId: 'fake-inbox',
    contactExternalId: '+2250700000001',
    messageExternalId: $extId,
    contenu: 'Hello from e2e fake test',
    typeContenu: 'texte',
    contactName: 'Contact Fake E2E',
    envoyeAt: now(),
);

$msg = app(InboundMessageService::class)->ingerer($dto);
if (! $msg) {
    fwrite(STDERR, "INGEST_FAIL\n");
    exit(1);
}

echo "INGEST_OK msg={$msg->id} conv={$msg->conversation_id}\n";

// Simulate outbound then delivery receipt
$out = ConversationMessage::withoutGlobalScopes()->create([
    'orga_id' => $org->id,
    'conversation_id' => $msg->conversation_id,
    'boite_reception_id' => $inbox->id,
    'direction' => 'sortant',
    'type_contenu' => 'texte',
    'contenu' => 'Reply e2e',
    'id_externe' => 'out_'.uniqid(),
    'statut_livraison' => StatutLivraisonMessage::Envoye,
    'envoye_at' => now(),
]);

$updated = app(DeliveryStatusService::class)->appliquer(new NormalizedStatusUpdateDto(
    canal: 'whatsapp',
    inboxExternalId: 'fake-inbox',
    messageExternalId: (string) $out->id_externe,
    statut: 'delivered',
));

echo $updated && $updated->statut_livraison === StatutLivraisonMessage::Livre
    ? "DELIVERY_OK status={$updated->statut_livraison->value}\n"
    : "DELIVERY_FAIL\n";

echo "TEMPLATES_TABLE=".(\Illuminate\Support\Facades\Schema::hasTable('modeles_message') ? 'yes' : 'no')."\n";
echo "DONE\n";
