package com.organizador.escolar.widgets;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio y Factory de RemoteViews para poblar la lista del TaskDeadlinesWidget.
 */
public class TaskDeadlinesService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new TaskDeadlinesFactory(this.getApplicationContext());
    }

    static class TaskDeadlinesFactory implements RemoteViewsService.RemoteViewsFactory {

        private final Context context;
        private List<WidgetDataSync.TaskDeadlineItem> items = new ArrayList<>();

        public TaskDeadlinesFactory(Context context) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            loadData();
        }

        @Override
        public void onDataSetChanged() {
            loadData();
        }

        private void loadData() {
            items = WidgetDataSync.getDeadlines(context);
        }

        @Override
        public void onDestroy() {
            items.clear();
        }

        @Override
        public int getCount() {
            return items.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            if (position < 0 || position >= items.size()) return null;

            WidgetDataSync.TaskDeadlineItem item = items.get(position);
            String packageName = context.getPackageName();
            RemoteViews row = new RemoteViews(packageName,
                    context.getResources().getIdentifier("widget_task_deadline_item", "layout", packageName));

            int idColorBar = context.getResources().getIdentifier("item_subject_color_bar", "id", packageName);
            int idTitle = context.getResources().getIdentifier("item_task_title", "id", packageName);
            int idSubject = context.getResources().getIdentifier("item_subject_name", "id", packageName);
            int idDue = context.getResources().getIdentifier("item_due_badge", "id", packageName);
            int idUrgency = context.getResources().getIdentifier("item_urgency_badge", "id", packageName);

            if (idTitle != 0) row.setTextViewText(idTitle, item.title);
            if (idSubject != 0) row.setTextViewText(idSubject, item.subjectName);

            String dueText = item.dueDate + (item.dueTime != null && !item.dueTime.isEmpty() ? " " + item.dueTime : "");
            if (idDue != 0) row.setTextViewText(idDue, dueText);

            if (idUrgency != 0) row.setTextViewText(idUrgency, item.urgencyLabel);

            // Código de color de la materia
            if (idColorBar != 0) {
                row.setInt(idColorBar, "setBackgroundColor", item.subjectColor);
            }

            // Fill-in Intent para que el clic abra la tarea en la app
            Intent fillInIntent = new Intent();
            fillInIntent.putExtra("task_id", item.id);
            row.setOnClickFillInIntent(context.getResources().getIdentifier("widget_deadline_item_root", "id", packageName), fillInIntent);

            return row;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }
    }
}
