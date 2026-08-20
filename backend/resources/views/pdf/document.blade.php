<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }} {{ $number }}</title>
    <style>
        @page { margin: 16mm 14mm 18mm; }
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1a1a1a;
            margin: 0;
        }
        h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: 0.04em; text-transform: uppercase; }
        h2 { font-size: 11px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.06em; color: #444; }
        .muted { color: #555; }
        .header { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .header td { vertical-align: top; }
        .brand { font-size: 14px; font-weight: bold; }
        .logo { max-height: 52px; max-width: 160px; }
        .pill {
            display: inline-block;
            padding: 3px 8px;
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #fff;
            background: {{ $primaryColor }};
        }
        .meta { width: 100%; border-collapse: collapse; margin: 12px 0 16px; }
        .meta td { vertical-align: top; width: 50%; padding: 8px 10px; background: #f4f4f2; }
        .meta .box + .box { }
        table.lines { width: 100%; border-collapse: collapse; margin-top: 8px; }
        table.lines th {
            text-align: left;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border-bottom: 1px solid #222;
            padding: 6px 4px;
        }
        table.lines td { padding: 6px 4px; border-bottom: 1px solid #e4e4e0; vertical-align: top; }
        .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .totals { width: 46%; margin-left: 54%; border-collapse: collapse; margin-top: 10px; }
        .totals td { padding: 4px 0; }
        .totals .grand { font-size: 12px; font-weight: bold; border-top: 2px solid {{ $primaryColor }}; padding-top: 8px; }
        .notice {
            margin: 14px 0;
            padding: 8px 10px;
            border: 1px solid #c9a227;
            background: #fff8e5;
        }
        .pay { width: 100%; border-collapse: collapse; margin-top: 18px; }
        .pay td { vertical-align: top; padding: 8px; border: 1px solid #e4e4e0; }
        .qr { width: 120px; }
        .qr svg { width: 110px; height: 110px; }
        .footer {
            margin-top: 22px;
            font-size: 8px;
            color: #555;
            border-top: 1px solid #ddd;
            padding-top: 8px;
        }
        .credit { color: #7a1f1f; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td style="width: 58%;">
                @if ($logoDataUri)
                    <img class="logo" src="{{ $logoDataUri }}" alt="">
                @else
                    <div class="brand">{{ $branding['display_name'] ?? $organization['name'] ?? '' }}</div>
                @endif
                <div style="margin-top: 8px;">
                    <strong>{{ $organization['name'] ?? '' }}</strong><br>
                    @if (!empty($organization['address'])) {{ $organization['address'] }}<br> @endif
                    {{ trim(($organization['postal_code'] ?? '').' '.($organization['city'] ?? '')) }}
                    @if (!empty($organization['country'])) — {{ $organization['country'] }} @endif
                    <br>
                    @if (!empty($organization['email'])) {{ $organization['email'] }} @endif
                    @if (!empty($organization['phone'])) · {{ $organization['phone'] }} @endif
                    <br>
                    @if (!empty($organization['tax_id']))
                        <strong>NINEA / n° fiscal :</strong> {{ $organization['tax_id'] }}
                    @endif
                </div>
            </td>
            <td style="width: 42%; text-align: right;">
                <span class="pill">{{ $title }}</span>
                <h1>{{ $number }}</h1>
                <div class="muted">Émis le {{ $issueDate }}</div>
                @if ($dueDate)
                    <div>Échéance : <strong>{{ $dueDate }}</strong></div>
                @endif
                <div class="muted" style="margin-top: 6px;">
                    TVA {{ $taxMode === 'inclusive' ? 'incluse' : 'exclusive' }}
                </div>
            </td>
        </tr>
    </table>

    <table class="meta">
        <tr>
            <td>
                <h2>Client</h2>
                <strong>{{ $client['name'] ?? '' }}</strong>
                @if (!empty($client['company']))<br>{{ $client['company'] }}@endif
                @if (!empty($client['address']))<br>{{ $client['address'] }}@endif
                <br>{{ trim(($client['postal_code'] ?? '').' '.($client['city'] ?? '')) }}
                @if (!empty($client['country'])) — {{ $client['country'] }} @endif
                @if (!empty($client['tax_id']))
                    <br><strong>NINEA client :</strong> {{ $client['tax_id'] }}
                @endif
            </td>
            <td>
                <h2>Paiement</h2>
                @if ($kind === 'quote')
                    Ce document n’est pas une facture. Il ne constitue pas une créance exigible.
                @elseif ($kind === 'credit_note')
                    <span class="credit">Avoir — montant à déduire des factures concernées.</span>
                @else
                    @if (!empty($organization['bank_name']) || !empty($organization['iban']))
                        {{ $organization['bank_name'] ?? '' }}<br>
                        @if (!empty($organization['iban'])) IBAN {{ $organization['iban'] }}<br> @endif
                        @if (!empty($organization['bic'])) BIC {{ $organization['bic'] }} @endif
                    @else
                        Paiement Mobile Money / lien portail ci-dessous.
                    @endif
                @endif
            </td>
        </tr>
    </table>

    @if ($kind === 'quote')
        <div class="notice"><strong>Devis — ce document n’est pas une facture.</strong></div>
    @endif

    <table class="lines">
        <thead>
            <tr>
                <th>Désignation</th>
                <th class="num">Qté</th>
                <th class="num">PU HT</th>
                @if ($showDiscount)
                    <th class="num">Remise</th>
                @endif
                <th class="num">TVA</th>
                <th class="num">Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($lines as $line)
                <tr>
                    <td>{{ $line['description'] }}</td>
                    <td class="num">{{ $line['quantity'] }}</td>
                    <td class="num">{{ \App\Support\Money::format($line['unit_price'], $currency) }}</td>
                    @if ($showDiscount)
                        <td class="num">{{ $line['discount_percent'] ? $line['discount_percent'].' %' : '—' }}</td>
                    @endif
                    <td class="num">{{ rtrim(rtrim($line['tax_rate'], '0'), '.') }} %</td>
                    <td class="num">{{ \App\Support\Money::format($line['ht'], $currency) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Total HT</td>
            <td class="num">{{ $subtotalHt }}</td>
        </tr>
        @foreach ($taxByRate as $rate => $amount)
            <tr>
                <td>TVA {{ rtrim(rtrim((string) $rate, '0'), '.') }} %</td>
                <td class="num">{{ $amount }}</td>
            </tr>
        @endforeach
        <tr>
            <td>Total TVA</td>
            <td class="num">{{ $taxTotal }}</td>
        </tr>
        <tr class="grand">
            <td>{{ $kind === 'credit_note' ? 'Montant crédité TTC' : 'Total TTC' }}</td>
            <td class="num">{{ $total }}</td>
        </tr>
    </table>

    @if ($notes)
        <p><strong>Notes :</strong> {{ $notes }}</p>
    @endif

    @if ($kind === 'invoice')
        <table class="pay">
            <tr>
                @if ($qrSvg)
                    <td class="qr">
                        {!! $qrSvg !!}
                        <div class="muted" style="margin-top: 4px;">{{ $qrLabel }}</div>
                    </td>
                @endif
                <td>
                    <h2>Payer cette facture</h2>
                    <div>Lien portail (à coller dans un navigateur) :</div>
                    <div><strong>{{ $portalUrl }}</strong></div>
                    @if ($qrLabel)
                        <p class="muted">Scannez le QR {{ $qrLabel }} pour payer le montant TTC.</p>
                    @endif
                </td>
            </tr>
        </table>
    @endif

    <div class="footer">
        @if (!empty($organization['legal_mentions']))
            {{ $organization['legal_mentions'] }}
        @else
            Document généré par InvoMind. Conservez ce fichier ; le contenu est figé à la date d’émission.
        @endif
        @if (!empty($organization['tax_id']))
            <br>NINEA {{ $organization['tax_id'] }} — {{ $organization['name'] ?? '' }}
        @endif
    </div>
</body>
</html>
