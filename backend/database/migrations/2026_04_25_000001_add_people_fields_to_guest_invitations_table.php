<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('guest_invitations', 'additional_guest_names')) {
            Schema::table('guest_invitations', function (Blueprint $table) {
                $table->json('additional_guest_names')->nullable()->after('custom_message');
            });
        }

        if (! Schema::hasColumn('guest_invitations', 'people_count')) {
            Schema::table('guest_invitations', function (Blueprint $table) {
                $table->unsignedInteger('people_count')->default(1)->after('additional_guest_names');
            });
        }

        DB::statement('update guest_invitations set guest_email = lower(guest_email)');
        DB::statement(<<<'SQL'
            delete from guest_invitations
            where id in (
                select id
                from (
                    select id, row_number() over (partition by guest_email order by id desc) as duplicate_rank
                    from guest_invitations
                ) ranked_invitations
                where duplicate_rank > 1
            )
        SQL);

        if (! $this->hasIndex('guest_invitations_guest_email_unique')) {
            Schema::table('guest_invitations', function (Blueprint $table) {
                $table->unique('guest_email');
            });
        }
    }

    public function down(): void
    {
        Schema::table('guest_invitations', function (Blueprint $table) {
            $table->dropUnique(['guest_email']);
            $table->dropColumn(['additional_guest_names', 'people_count']);
        });
    }

    private function hasIndex(string $indexName): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            return count(DB::select("SELECT name FROM sqlite_master WHERE type='index' AND name=?", [$indexName])) > 0;
        }

        return DB::table('pg_indexes')
            ->where('schemaname', DB::raw('current_schema()'))
            ->where('indexname', $indexName)
            ->exists();
    }
};
