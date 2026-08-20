<?php

namespace Tests\Feature;

use App\Jobs\PingOrganizationJob;
use App\Mail\InfrastructureTestMail;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class QueueInfrastructureTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    public function test_schedule_registers_overdue_and_reminder_commands_every_fifteen_minutes(): void
    {
        Artisan::call('schedule:list');

        $schedule = $this->app->make(Schedule::class);
        $events = collect($schedule->events());

        $overdue = $events->first(
            fn ($event) => str_contains($event->command ?? '', 'documents:mark-overdue'),
        );
        $reminders = $events->first(
            fn ($event) => str_contains($event->command ?? '', 'documents:dispatch-reminders'),
        );

        $this->assertNotNull($overdue);
        $this->assertNotNull($reminders);
        $this->assertSame('*/15 * * * *', $overdue->expression);
        $this->assertSame('*/15 * * * *', $reminders->expression);
    }

    public function test_scheduled_commands_succeed(): void
    {
        $this->artisan('documents:mark-overdue')->assertSuccessful();
        $this->artisan('documents:dispatch-reminders')->assertSuccessful();
    }

    public function test_failed_jobs_table_is_usable(): void
    {
        $this->assertTrue(Schema::hasTable('jobs'));
        $this->assertTrue(Schema::hasTable('failed_jobs'));
        $this->assertTrue(Schema::hasTable('job_batches'));

        $this->artisan('queue:failed')->assertSuccessful();
    }

    public function test_infrastructure_mail_sends_without_resend_credentials(): void
    {
        config([
            'mail.default' => 'array',
            'services.resend.key' => null,
        ]);

        Mail::fake();

        Mail::to('ops@test.invomind')->send(new InfrastructureTestMail);

        Mail::assertSent(InfrastructureTestMail::class, function (InfrastructureTestMail $mail) {
            return $mail->hasTo('ops@test.invomind')
                && $mail->envelope()->subject === 'InvoMind — e-mail de test infrastructure';
        });
    }

    public function test_mail_test_command_sends_without_resend_key(): void
    {
        config([
            'mail.default' => 'array',
            'services.resend.key' => null,
        ]);

        $this->artisan('mail:test', ['email' => 'ops@test.invomind'])->assertSuccessful();
    }

    public function test_dummy_tenant_job_is_dispatched_with_organization_id(): void
    {
        $this->requirePgsql();
        $this->seedTenant();

        Bus::fake();

        PingOrganizationJob::dispatch($this->organization->id);

        Bus::assertDispatched(PingOrganizationJob::class, function (PingOrganizationJob $job) {
            return $job->organizationId === $this->organization->id
                && $job->tries === 3
                && $job->timeout === 120
                && $job->backoff === [30, 60, 120]
                && $job->uniqueId() === $this->organization->id;
        });
    }

    public function test_database_queue_persists_a_tenant_job_payload(): void
    {
        $this->requirePgsql();
        $this->seedTenant();

        config(['queue.default' => 'database']);

        PingOrganizationJob::dispatch($this->organization->id);

        $row = DB::table('jobs')->orderByDesc('id')->first();

        $this->assertNotNull($row);
        $payload = json_decode($row->payload, true);
        $this->assertSame(PingOrganizationJob::class, $payload['displayName']);
        $this->assertStringContainsString($this->organization->id, $payload['data']['command']);
    }

    private function requirePgsql(): void
    {
        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL (native enums and row locks).');
        }
    }
}
