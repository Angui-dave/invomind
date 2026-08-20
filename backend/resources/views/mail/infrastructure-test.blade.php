<x-mail::message>
# Infrastructure OK

Ceci est un e-mail de test InvoMind. En local il est écrit dans les logs (`MAIL_MAILER=log`), sans credential Resend.

Mailer : `{{ config('mail.default') }}`

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
