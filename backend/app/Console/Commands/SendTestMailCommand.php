<?php

namespace App\Console\Commands;

use App\Mail\InfrastructureTestMail;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('mail:test {email? : Destinataire (défaut : MAIL_FROM_ADDRESS)}')]
#[Description('Envoie un e-mail de test (log en local, Resend en production).')]
class SendTestMailCommand extends Command
{
    public function handle(): int
    {
        $email = $this->argument('email') ?: (string) config('mail.from.address');

        Mail::to($email)->send(new InfrastructureTestMail);

        $this->info('E-mail de test envoyé via « '.config('mail.default').' » vers '.$email.'.');

        return self::SUCCESS;
    }
}
