<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu {{ $number }}</title>
    <style>
        @page { margin: 18mm; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; }
        h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 0.06em; }
        .box { border: 1px solid #ddd; padding: 12px; margin-top: 16px; }
        .muted { color: #555; }
    </style>
</head>
<body>
    <h1>Reçu de paiement</h1>
    <p class="muted">{{ $organization['name'] ?? '' }}</p>
    @if (!empty($organization['tax_id']))
        <p>NINEA {{ $organization['tax_id'] }}</p>
    @endif

    <div class="box">
        <p>Client : <strong>{{ $clientName }}</strong></p>
        <p>Pièce : <strong>{{ $number }}</strong></p>
        <p>Montant encaissé : <strong>{{ $amount }}</strong></p>
        <p>Date : {{ $paidAt }}</p>
        @if ($method)
            <p>Mode : {{ $method }}</p>
        @endif
        @if ($reference)
            <p>Référence : {{ $reference }}</p>
        @endif
    </div>
</body>
</html>
