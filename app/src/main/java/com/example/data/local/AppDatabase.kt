package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.local.dao.AssessmentDao
import com.example.data.local.entities.AiConfigEntity
import com.example.data.local.entities.AssessmentResponseEntity
import com.example.data.local.entities.AssessmentSessionEntity
import com.example.data.local.entities.CohortGroupEntity
import com.example.data.local.entities.UserEntity

@Database(
    entities = [
        AssessmentSessionEntity::class,
        AssessmentResponseEntity::class,
        AiConfigEntity::class,
        CohortGroupEntity::class,
        UserEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun assessmentDao(): AssessmentDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "orientapp_database.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
