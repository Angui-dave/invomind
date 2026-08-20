<?php

namespace App\Providers;

use App\Contracts\PspGateway;
use App\Services\Psp\CinetPayGateway;
use App\Services\Psp\FakePspGateway;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(FakePspGateway::class);

        $this->app->bind(PspGateway::class, function ($app) {
            if (config('services.psp.driver') === 'fake') {
                $env = (string) config('app.env');
                if (! in_array($env, ['local', 'testing'], true)) {
                    throw new \RuntimeException('PSP_DRIVER=fake is only allowed in local/testing.');
                }

                return $app->make(FakePspGateway::class);
            }

            return $app->make(CinetPayGateway::class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('portal-pdf', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip().'|'.$request->route('token'));
        });

        RateLimiter::for('portal-checkout', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip().'|'.$request->route('token'));
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip().'|'.strtolower((string) $request->input('email')));
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('reset-password', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip().'|'.strtolower((string) $request->input('email')));
        });

        RateLimiter::for('forgot-password', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip().'|'.strtolower((string) $request->input('email')));
        });

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $email = urlencode((string) $user->getEmailForPasswordReset());

            return rtrim((string) config('services.frontend.url'), '/').'/reset-password?token='.$token.'&email='.$email;
        });

        VerifyEmail::createUrlUsing(function (object $notifiable) {
            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ],
            );
        });
    }
}
