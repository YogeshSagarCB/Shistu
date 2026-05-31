import AppIntents
import SQLite3

struct LogHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Habit"
    
    @Parameter(title: "Habit ID")
    var habitId: Int
    
    @Parameter(title: "Increment")
    var increment: Double

    func perform() async throws -> some IntentResult {
        // 1. Get DB Path
        let fileManager = FileManager.default
        guard let containerURL = fileManager.containerURL(forSecurityApplicationGroupIdentifier: "group.com.basecamplogic.shistu") else {
            return .result()
        }
        let dbPath = containerURL.appendingPathComponent("habits_tracker.db").path

        // 2. Execute SQL Write
        var db: OpaquePointer?
        if sqlite3_open(dbPath, &db) == SQLITE_OK {
            let query = "INSERT INTO events (habit_id, timestamp, numeric_value) VALUES (?, datetime('now'), ?);"
            var statement: OpaquePointer?
            
            if sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_int(statement, 1, Int32(habitId))
                sqlite3_bind_double(statement, 2, increment)
                
                if sqlite3_step(statement) == SQLITE_DONE {
                    print("Successfully logged event from widget")
                }
            }
            sqlite3_finalize(statement)
        }
        sqlite3_close(db)
        
        return .result()
    }
}
