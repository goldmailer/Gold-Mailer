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

        if (!Schema::hasTable('cpx_transactions')) {
            Schema::create('cpx_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('trans_id', 191)->unique();
                $table->unsignedBigInteger('user_id')->index();
                $table->decimal('amount_usd', 12, 4)->default(0);
                $table->integer('coins')->default(0);
                $table->string('status', 64);
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cpx_transactions');
    }
};
