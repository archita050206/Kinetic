<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('region')->default('AWS | ap-south-1');
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        Schema::table('guest_invitations', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->after('id')->constrained('events')->cascadeOnDelete();
        });

        $users = DB::table('users')->select('id', 'name')->get();

        foreach ($users as $user) {
            $eventId = DB::table('events')->insertGetId([
                'owner_user_id' => $user->id,
                'name' => "{$user->name}'s Event",
                'region' => 'AWS | ap-south-1',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('guest_invitations')
                ->where('invited_by_user_id', $user->id)
                ->whereNull('event_id')
                ->update(['event_id' => $eventId]);
        }

        $orphanInvitations = DB::table('guest_invitations')
            ->whereNull('event_id')
            ->select('invited_by_user_id')
            ->distinct()
            ->get();

        foreach ($orphanInvitations as $orphanGroup) {
            $ownerId = $orphanGroup->invited_by_user_id ?? DB::table('users')->value('id');

            if (! $ownerId) {
                continue;
            }

            $eventId = DB::table('events')->insertGetId([
                'owner_user_id' => $ownerId,
                'name' => 'Imported Event',
                'region' => 'AWS | ap-south-1',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('guest_invitations')
                ->whereNull('event_id')
                ->where('invited_by_user_id', $orphanGroup->invited_by_user_id)
                ->update(['event_id' => $eventId]);
        }

        Schema::table('guest_invitations', function (Blueprint $table) {
            $table->dropUnique(['guest_email']);
            $table->unique(['event_id', 'guest_email']);
        });

        if (DB::getDriverName() === 'sqlite') {
            try {
                Schema::table('guest_invitations', function (Blueprint $table) {
                    $table->unsignedBigInteger('event_id')->nullable(false)->change();
                });
            } catch (\Exception $e) {
                // Bypass if change is not fully supported in the local sqlite environment
            }
        } else {
            DB::statement('alter table guest_invitations alter column event_id set not null');
        }
    }

    public function down(): void
    {
        Schema::table('guest_invitations', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'guest_email']);
            $table->unique('guest_email');
            $table->dropConstrainedForeignId('event_id');
        });

        Schema::dropIfExists('events');
    }
};
