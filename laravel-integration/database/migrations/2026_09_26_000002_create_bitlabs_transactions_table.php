<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'coins')) {
            Schema::table('users', function (Blueprint $table) {
                $table->bigInteger('coins')->default(0)->after('id');
            });
        }

        if (!Schema::hasTable('bitlabs_transactions')) {
            Schema::create('bitlabs_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('transaction_id', 191)->unique();
                $table->unsignedBigInteger('user_id')->index();
                $table->decimal('reward', 12, 4)->default(0);
                $table->integer('coins')->default(0);
                $table->string('type', 64)->default('complete');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bitlabs_transactions');
    }
};
