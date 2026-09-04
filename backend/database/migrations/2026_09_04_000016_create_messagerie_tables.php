<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function createEnumIfNotExists(string $typeName, array $values): void
    {
        $quoted = implode(', ', array_map(fn ($v) => "'".$v."'", $values));
        DB::statement(
            "DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{$typeName}') THEN
                    CREATE TYPE {$typeName} AS ENUM ({$quoted});
                END IF;
            END $$;"
        );
    }

    public function up(): void
    {
        $this->createEnumIfNotExists('canal_messagerie', ['whatsapp', 'messenger', 'instagram', 'tiktok']);
        $this->createEnumIfNotExists('mode_boite_reception', ['fake', 'sandbox', 'production']);
        $this->createEnumIfNotExists('statut_connexion_boite', ['connectee', 'erreur', 'desactivee']);
        $this->createEnumIfNotExists('statut_conversation', ['ouverte', 'en_attente', 'resolue']);
        $this->createEnumIfNotExists('direction_message', ['entrant', 'sortant']);
        $this->createEnumIfNotExists('type_contenu_message', ['texte', 'image', 'fichier', 'audio', 'video', 'modele']);
        $this->createEnumIfNotExists('statut_livraison_message', ['en_attente', 'envoye', 'livre', 'lu', 'echec']);

        Schema::create('boites_reception', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom');
            $table->text('identifiants')->nullable();
            $table->text('derniere_erreur')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        DB::statement("ALTER TABLE boites_reception ADD COLUMN canal canal_messagerie NOT NULL");
        DB::statement("ALTER TABLE boites_reception ADD COLUMN mode mode_boite_reception NOT NULL DEFAULT 'fake'");
        DB::statement("ALTER TABLE boites_reception ADD COLUMN statut_connexion statut_connexion_boite NOT NULL DEFAULT 'desactivee'");
        DB::statement('CREATE INDEX boites_reception_orga_canal_idx ON boites_reception (orga_id, canal)');

        Schema::create('contacts_messagerie', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom_affichage');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('avatar_url')->nullable();
            $table->timestampsTz();
        });

        Schema::create('contacts_boite_reception', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts_messagerie')->cascadeOnDelete();
            $table->foreignId('boite_reception_id')->constrained('boites_reception')->cascadeOnDelete();
            $table->string('identifiant_externe');
            $table->jsonb('donnees_brutes')->nullable();
            $table->timestampsTz();
            $table->unique(['boite_reception_id', 'identifiant_externe'], 'contacts_boite_externe_unique');
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('boite_reception_id')->constrained('boites_reception')->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained('contacts_messagerie')->cascadeOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('derniere_activite_at')->nullable();
            $table->unsignedInteger('non_lus_count')->default(0);
            $table->boolean('archivee')->default(false);
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE conversations ADD COLUMN statut statut_conversation NOT NULL DEFAULT 'ouverte'");
        DB::statement('CREATE INDEX conversations_orga_statut_idx ON conversations (orga_id, statut)');
        DB::statement('CREATE INDEX conversations_orga_activite_idx ON conversations (orga_id, derniere_activite_at DESC)');

        Schema::create('conversation_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('boite_reception_id')->constrained('boites_reception')->cascadeOnDelete();
            $table->text('contenu')->nullable();
            $table->string('url_media')->nullable();
            $table->string('id_externe')->nullable();
            $table->text('erreur')->nullable();
            $table->foreignId('expediteur_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('envoye_at')->nullable();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE conversation_messages ADD COLUMN direction direction_message NOT NULL");
        DB::statement("ALTER TABLE conversation_messages ADD COLUMN type_contenu type_contenu_message NOT NULL DEFAULT 'texte'");
        DB::statement('ALTER TABLE conversation_messages ADD COLUMN statut_livraison statut_livraison_message NULL');
        DB::statement(
            'CREATE UNIQUE INDEX conversation_messages_boite_externe_unique
             ON conversation_messages (boite_reception_id, id_externe)
             WHERE id_externe IS NOT NULL'
        );
        DB::statement('CREATE INDEX conversation_messages_conv_envoye_idx ON conversation_messages (conversation_id, envoye_at)');

        Schema::create('etiquettes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('nom');
            $table->string('couleur', 32)->default('#64748b');
            $table->timestampsTz();
            $table->unique(['orga_id', 'nom']);
        });

        Schema::create('conversation_etiquette', function (Blueprint $table) {
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('etiquette_id')->constrained('etiquettes')->cascadeOnDelete();
            $table->primary(['conversation_id', 'etiquette_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_etiquette');
        Schema::dropIfExists('etiquettes');
        Schema::dropIfExists('conversation_messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('contacts_boite_reception');
        Schema::dropIfExists('contacts_messagerie');
        Schema::dropIfExists('boites_reception');

        foreach ([
            'statut_livraison_message',
            'type_contenu_message',
            'direction_message',
            'statut_conversation',
            'statut_connexion_boite',
            'mode_boite_reception',
            'canal_messagerie',
        ] as $type) {
            DB::statement("DROP TYPE IF EXISTS {$type}");
        }
    }
};
