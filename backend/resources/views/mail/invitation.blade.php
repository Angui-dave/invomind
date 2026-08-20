<x-mail::message>
# Vous êtes invité(e)

**{{ $organizationName }}** vous invite à rejoindre son espace InvoMind.

Définissez votre mot de passe pour activer votre accès.

<x-mail::button :url="$acceptUrl">
Accepter l’invitation
</x-mail::button>

Ce lien expire dans 7 jours. Si vous n’attendiez pas cet e-mail, ignorez-le.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
