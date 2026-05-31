import WidgetKit
import SwiftUI
import SQLite3

struct HabitEntry: Identifiable {
    let id: Int32
    let name: String
    let icon: String
    let color: String
}

struct ShistuWidgetEntry: TimelineEntry {
    let date: Date
    let habits: [HabitEntry]
}

struct ShistuWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> ShistuWidgetEntry {
        ShistuWidgetEntry(date: Date(), habits: [])
    }
    func getSnapshot(in context: Context, completion: @escaping (ShistuWidgetEntry) -> ()) {
        completion(ShistuWidgetEntry(date: Date(), habits: []))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ShistuWidgetEntry>) -> ()) {
        completion(Timeline(entries: [], policy: .atEnd))
    }
}
